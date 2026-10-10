import { createClient } from "@supabase/supabase-js";
// Never import this module into browser code.
import type { Request } from "./http.js";
export function database() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("database_not_configured");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function parent(req: Request) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) throw new Error("unauthorized");
  const db = database();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user || !data.user.email_confirmed_at)
    throw new Error("unauthorized");
  const { data: verified } = await db
    .from("verified_parents")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!verified) throw new Error("unverified_parent");
  return { db, user: data.user };
}
