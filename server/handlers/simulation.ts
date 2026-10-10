import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    scenario: z.enum(["bracelet", "books", "cards"]),
    seed: z.number().int().min(0).max(1000000),
  }),
  z.object({
    action: z.literal("round"),
    id: z.uuid(),
    revision: z.number().int().min(1),
    quantity: z.number().int().min(0).max(100),
    price: z.number().int().min(1).max(100000),
  }),
]);
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    const { db } = await authenticated(req, res);
    if (req.method === "GET") {
      const id = z
        .uuid()
        .parse(new URL(req.url || "/", "http://local").searchParams.get("id"));
      const { data, error } = await db
        .from("simulation_events")
        .select("*")
        .eq("session_id", id)
        .order("round");
      if (error) throw new Error("forbidden");
      return json(res, 200, { data });
    }
    const p = schema.parse(await body(req));
    const { data, error } =
      p.action === "start"
        ? await db.rpc("start_simulation", {
            kind: p.scenario,
            random_seed: p.seed,
          })
        : await db.rpc("play_simulation", {
            session: p.id,
            expected_revision: p.revision,
            quantity: p.quantity,
            price: p.price,
          });
    if (error)
      throw new Error(
        error.message.includes("conflict")
          ? "conflict"
          : error.message.includes("insufficient_cash")
            ? "insufficient_cash"
            : error.message.includes("limited_supply")
              ? "limited_supply"
              : "invalid_round",
      );
    json(res, 200, p.action === "start" ? { data } : data);
  } catch (e) {
    failure(res, e);
  }
}
