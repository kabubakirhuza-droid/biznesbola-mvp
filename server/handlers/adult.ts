import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
import { database } from "../supabase.js";
import { rateLimit } from "../rate.js";
import { randomBytes } from "node:crypto";
const schema = z.object({
  learner_id: z.uuid(),
  password: z.string().min(12).max(128),
});
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["POST"])) return;
  try {
    const { db, profile } = await authenticated(req, res);
    if (profile.role !== "PARENT") throw new Error("forbidden");
    if (!(await rateLimit(req, "learner_credentials", 5)))
      return json(res, 429, { error: "rate_limited" });
    const input = schema.parse(await body(req));
    const { data: link } = await db
      .from("guardian_links")
      .select("learner_id")
      .eq("learner_id", input.learner_id)
      .eq("guardian_id", profile.id)
      .single();
    if (!link) throw new Error("forbidden");
    const { data: learner } = await db
      .from("learner_profiles")
      .select("id,alias,user_id")
      .eq("id", input.learner_id)
      .single();
    if (!learner) throw new Error("forbidden");
    const admin = database();
    if (learner.user_id) {
      const { error } = await admin.auth.admin.updateUserById(learner.user_id, {
        password: input.password,
      });
      if (error) throw new Error("server_error");
      const { data } = await admin.auth.admin.getUserById(learner.user_id);
      return json(res, 200, { login: data.user?.email });
    }
    const login = `learner-${randomBytes(12).toString("hex")}@learn.biznesbola.invalid`;
    const { data, error } = await admin.auth.admin.createUser({
      email: login,
      password: input.password,
      email_confirm: true,
      user_metadata: { alias: learner.alias },
    });
    if (error || !data.user) throw new Error("server_error");
    const { error: attach } = await admin.rpc("attach_learner_account", {
      learner: input.learner_id,
      account: data.user.id,
      guardian: profile.id,
    });
    if (attach) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw new Error("server_error");
    }
    json(res, 200, { login });
  } catch (e) {
    failure(res, e);
  }
}
