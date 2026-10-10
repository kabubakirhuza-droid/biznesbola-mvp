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
  if (!method(req, res, ["POST"])) return;
  try {
    const { db } = await authenticated(req, res);
    const p = z
      .object({
        id: z.uuid(),
        answer: z.string().min(1).max(200),
        language: z.enum(["uz", "ru"]),
      })
      .parse(await body(req));
    const { data, error } = await db.rpc("check_lesson", {
      lesson: p.id,
      provided_answer: p.answer,
      lang: p.language,
    });
    if (error) throw new Error("forbidden");
    json(res, 200, data);
  } catch (e) {
    failure(res, e);
  }
}
