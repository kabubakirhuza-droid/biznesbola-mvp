import type { IncomingMessage, ServerResponse } from "node:http";
// Shared implementation lives outside api/ so it is not deployed as an endpoint.
export type Request = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
};
export type Response = ServerResponse;
export function json(res: Response, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}
export function sameOrigin(req: Request) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const allowed = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ];
  if (
    !process.env.VERCEL &&
    /^((localhost|127\.0\.0\.1)(:\d+)?|\[::1\](:\d+)?)$/.test(
      req.headers.host || "",
    )
  )
    allowed.push(`http://${req.headers.host}`);
  return allowed.includes(origin);
}
export function method(req: Request, res: Response, allowed: string[]) {
  if (!allowed.includes(req.method || "")) {
    res.setHeader("Allow", allowed.join(", "));
    json(res, 405, { error: "method_not_allowed" });
    return false;
  }
  if (!sameOrigin(req)) {
    json(res, 403, { error: "origin_denied" });
    return false;
  }
  return true;
}
export async function body(req: Request, maxBytes = 16000): Promise<unknown> {
  if (req.body !== undefined) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > maxBytes)
      throw new Error("body_too_large");
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) throw new Error("body_too_large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
