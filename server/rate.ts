import { createHash } from "node:crypto";
// Atomic limits shared by server handlers.
import type { Request } from "./http.js";
export async function rateLimit(req: Request, scope: string, limit = 12) {
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0];
  return sharedLimit(`${scope}:${ip}`, limit, 60);
}
export async function sharedLimit(scope: string, limit: number, seconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("rate_limit_not_configured");
  const key = `bb:${createHash("sha256").update(scope).digest("hex")}`;
  const script =
    "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", script, "1", key, String(seconds)]),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("rate_limit_unavailable");
  const data = (await res.json()) as { result?: number };
  if (typeof data.result !== "number")
    throw new Error("rate_limit_unavailable");
  return data.result <= limit;
}
