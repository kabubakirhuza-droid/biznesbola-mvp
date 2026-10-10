import { json, method, type Request, type Response } from "../http.js";
export default function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET"])) return;
  const limiter = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  json(res, 200, {
    auth: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && limiter),
    health: "ok",
    ai: !!(
      limiter &&
      process.env.ANTHROPIC_API_KEY &&
      (process.env.AI_MODEL || process.env.ANTHROPIC_MODEL)
    ),
    publishing: !!(
      limiter &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  });
}
