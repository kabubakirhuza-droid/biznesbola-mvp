import { createServerClient } from "@supabase/ssr";
import type { Request, Response } from "./http.js";
export function sessionClient(req: Request, res: Response) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("auth_not_configured");
  const cookies = (req.headers.cookie || "").split(";").flatMap((part) => {
    const at = part.indexOf("=");
    if (at < 0) return [];
    try {
      return [
        {
          name: part.slice(0, at).trim(),
          value: decodeURIComponent(part.slice(at + 1)),
        },
      ];
    } catch {
      return [];
    }
  });
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: !!process.env.VERCEL,
      path: "/",
    },
    cookies: {
      getAll: () => cookies,
      setAll: (items) => {
        const previous = res.getHeader("Set-Cookie");
        const headers = items.map(
          ({ name, value, options }) =>
            `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${process.env.VERCEL ? "; Secure" : ""}${options.maxAge !== undefined ? `; Max-Age=${options.maxAge}` : ""}`,
        );
        res.setHeader("Set-Cookie", [
          ...(Array.isArray(previous)
            ? previous.map(String)
            : previous
              ? [String(previous)]
              : []),
          ...headers,
        ]);
      },
    },
  });
}
export async function authenticated(req: Request, res: Response) {
  const db = sessionClient(req, res);
  const { data, error } = await db.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at)
    throw new Error("unauthorized");
  const { data: profile } = await db
    .from("profiles")
    .select("id,alias,role,language,status")
    .eq("id", data.user.id)
    .single();
  if (!profile || profile.status !== "active") throw new Error("forbidden");
  return { db, user: data.user, profile };
}
export function failure(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "server_error";
  const known: Record<string, number> = {
    unauthorized: 401,
    forbidden: 403,
    auth_not_configured: 503,
    database_not_configured: 503,
    conflict: 409,
  };
  res.statusCode = known[message] || 400;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({ error: known[message] ? message : "invalid_request" }),
  );
}
