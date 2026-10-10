import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    const { db, profile } = await authenticated(req, res);
    if (profile.role !== "PLATFORM_ADMIN") throw new Error("forbidden");
    if (req.method === "POST") {
      const p = z
        .object({
          id: z.uuid(),
          role: z.enum(["PARENT", "STUDENT", "PLATFORM_ADMIN"]),
          reason: z.string().min(3).max(500),
        })
        .parse(await body(req));
      const { error } = await db.rpc("admin_role", {
        target: p.id,
        new_role: p.role,
        explanation: p.reason,
      });
      if (error) throw new Error("forbidden");
      return json(res, 200, { ok: true });
    }
    const tables = [
      "profiles",
      "organizations",
      "lessons",
      "support_tickets",
      "moderation_reports",
    ] as const;
    const counts = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await db
          .from(table)
          .select("id", { count: "exact", head: true });
        if (error) throw new Error("server_error");
        return [table, count || 0];
      }),
    );
    json(res, 200, {
      counts: Object.fromEntries(counts),
      aiConfigured: !!(
        process.env.ANTHROPIC_API_KEY &&
        (process.env.AI_MODEL || process.env.ANTHROPIC_MODEL)
      ),
      model: process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || null,
    });
  } catch (e) {
    failure(res, e);
  }
}
