import { z } from "zod";
import { database } from "../../supabase.js";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../../http.js";
import { rateLimit } from "../../rate.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["POST"])) return;
  try {
    if (!(await rateLimit(req, "login", 5)))
      return json(res, 429, { error: "rate_limited" });
    const input = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(8).max(128),
      })
      .parse(await body(req));
    const db = database();
    const { data, error } = await db.auth.signInWithPassword(input);
    if (error || !data.user?.email_confirmed_at || !data.session)
      return json(res, 401, { error: "login_failed" });
    const { data: verified } = await db
      .from("verified_parents")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!verified) return json(res, 403, { error: "unverified_parent" });
    json(res, 200, { token: data.session.access_token });
  } catch {
    json(res, 503, { error: "login_unavailable" });
  }
}
