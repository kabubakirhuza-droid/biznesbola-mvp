import { afterEach, expect, it, vi } from "vitest";
import { sameOrigin, type Request } from "../../server/http";
afterEach(() => vi.unstubAllEnvs());

it("permits the exact Vercel production and preview origins but rejects another website", () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("APP_ORIGIN", "");
  vi.stubEnv("VERCEL_URL", "biznesbola-preview.vercel.app");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "biznesbola.vercel.app");
  const request = (origin: string) => ({ headers: { origin, host: "biznesbola.vercel.app" } }) as Request;
  expect(sameOrigin(request("https://biznesbola.vercel.app"))).toBe(true);
  expect(sameOrigin(request("https://biznesbola-preview.vercel.app"))).toBe(true);
  expect(sameOrigin(request("https://attacker.example"))).toBe(false);
  expect(sameOrigin(request("https://biznesbola.vercel.app.attacker.example"))).toBe(false);
});
