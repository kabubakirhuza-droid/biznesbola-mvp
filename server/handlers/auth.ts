import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure, sessionClient } from "../session.js";
import { rateLimit } from "../rate.js";
const password = z.string().min(12).max(128);
const inputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("login"),
    email: z.email().max(254),
    password: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("register"),
    email: z.email().max(254),
    password,
    alias: z.string().min(2).max(60),
  }),
  z.object({ action: z.literal("recover"), email: z.email().max(254) }),
  z.object({ action: z.literal("password"), password }),
  z.object({
    action: z.literal("exchange"),
    code: z.string().min(1).max(2048),
  }),
  z.object({ action: z.literal("logout"), all: z.boolean().default(false) }),
]);
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    if (req.method === "GET") {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
        return json(res, 200, { configured: false, profile: null });
      try {
        const { profile, db } = await authenticated(req, res);
        const { data: memberships } = await db
          .from("organization_members")
          .select("organization_id,role,organizations(id,name,status)")
          .eq("active", true);
        return json(res, 200, {
          configured: true,
          profile,
          memberships: memberships || [],
        });
      } catch (error) {
        if (error instanceof Error && error.message === "unauthorized")
          return json(res, 200, { configured: true, profile: null });
        throw error;
      }
    }
    const input = inputSchema.parse(await body(req));
    const db = sessionClient(req, res);
    if (!(await rateLimit(req, "auth", 10)))
      return json(res, 429, { error: "rate_limited" });
    const callback = `${process.env.APP_ORIGIN || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : `http://${req.headers.host}`)}/account`;
    if (input.action === "login") {
      const { error } = await db.auth.signInWithPassword(input);
      if (error) return json(res, 401, { error: "login_failed" });
    }
    if (input.action === "register") {
      const { error } = await db.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { alias: input.alias }, emailRedirectTo: callback },
      });
      if (error) return json(res, 400, { error: "registration_failed" });
      return json(res, 200, { confirmationRequired: true });
    }
    if (input.action === "recover") {
      const { error } = await db.auth.resetPasswordForEmail(input.email, {
        redirectTo: callback,
      });
      if (error) return json(res, 503, { error: "email_unavailable" });
      return json(res, 200, { recoveryRequested: true });
    }
    if (input.action === "exchange") {
      const { error } = await db.auth.exchangeCodeForSession(input.code);
      if (error) return json(res, 400, { error: "invalid_link" });
    }
    if (input.action === "password") {
      await authenticated(req, res);
      const { error } = await db.auth.updateUser({ password: input.password });
      if (error) return json(res, 400, { error: "password_failed" });
    }
    if (input.action === "logout") {
      const { error } = await db.auth.signOut({
        scope: input.all ? "global" : "local",
      });
      if (error) return json(res, 400, { error: "logout_failed" });
    }
    json(res, 200, { ok: true });
  } catch (error) {
    failure(res, error);
  }
}
