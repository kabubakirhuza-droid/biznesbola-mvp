import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parent } from "../../supabase.js";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../../http.js";
import { rateLimit } from "../../rate.js";
import { draftSchema } from "../../../src/lib/validation.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    const { db, user } = await parent(req);
    if (req.method === "GET") {
      const { data, error } = await db
        .from("storefronts")
        .select("id,slug,status,content")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      await Promise.all(
        (data || []).map(async (store) => {
          for (const product of store.content.products) {
            if (product.image && !product.image.startsWith("data:")) {
              const { data: signed, error } = await db.storage
                .from("product-images")
                .createSignedUrl(product.image, 60);
              if (error) throw error;
              product.image = signed.signedUrl;
            }
          }
        }),
      );
      return json(res, 200, { stores: data });
    }
    if (!(await rateLimit(req, "store-write", 20)))
      return json(res, 429, { error: "rate_limited" });
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("submit"), content: draftSchema }),
        z.object({
          action: z.enum(["approve", "reject", "unpublish"]),
          id: z.string().uuid(),
        }),
      ])
      .parse(await body(req, 4400000));
    if (input.action === "submit") {
      const { data, error } = await db
        .from("storefronts")
        .insert({
          parent_id: user.id,
          slug: randomUUID(),
          content: input.content,
          status: "review",
        })
        .select("id,slug")
        .single();
      if (error) throw error;
      return json(res, 201, data);
    }
    const { data: store, error } = await db
      .from("storefronts")
      .select("*")
      .eq("id", input.id)
      .eq("parent_id", user.id)
      .single();
    if (error || !store) return json(res, 404, { error: "not_found" });
    if (input.action === "approve") {
      if (store.status !== "review")
        return json(res, 409, { error: "invalid_transition" });
      const content = draftSchema.parse(store.content);
      for (const p of content.products) {
        if (!p.image) continue;
        if (!p.image.startsWith("data:image/webp;base64,"))
          return json(res, 400, { error: "invalid_image" });
        const bytes = Buffer.from(p.image.split(",")[1], "base64");
        if (
          bytes.length > 300 * 1024 ||
          bytes.toString("ascii", 0, 4) !== "RIFF" ||
          bytes.toString("ascii", 8, 12) !== "WEBP"
        )
          return json(res, 400, { error: "invalid_image" });
        const path = `${user.id}/${store.id}/${randomUUID()}.webp`;
        const { error: uploadError } = await db.storage
          .from("product-images")
          .upload(path, bytes, { contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        p.image = path;
      }
      const { data: updated, error: updateError } = await db
        .from("storefronts")
        .update({
          content,
          status: "published",
          approved_at: new Date().toISOString(),
        })
        .eq("id", store.id)
        .eq("parent_id", user.id)
        .eq("status", "review")
        .select("id");
      if (updateError || !updated?.length)
        throw updateError || new Error("conflict");
    } else {
      const expected = input.action === "reject" ? "review" : "published";
      const { data: updated, error: updateError } = await db
        .from("storefronts")
        .update({
          status: input.action === "reject" ? "rejected" : "unpublished",
        })
        .eq("id", store.id)
        .eq("parent_id", user.id)
        .eq("status", expected)
        .select("id");
      if (updateError || !updated?.length)
        return json(res, 409, { error: "invalid_transition" });
    }
    json(res, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    json(
      res,
      message === "unauthorized" || message === "unverified_parent" ? 401 : 503,
      { error: "store_operation_unavailable" },
    );
  }
}
