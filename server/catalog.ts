import { z } from "zod";
import { catalog, type CatalogProduct } from "../src/domain/catalog.js";
import { verifiedProducts } from "./catalogSnapshot.js";

const cache = new Map<
  string,
  { expires: number; promise: Promise<CatalogProduct> }
>();
const offerSchema = z.object({
  price: z.coerce.number().int().positive().max(1e9),
  priceCurrency: z.literal("UZS"),
  availability: z.string().optional(),
});
export function parseRetailProduct(
  html: string,
  id: string,
  source: string,
): CatalogProduct {
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    let raw: unknown;
    try {
      raw = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const nodes = Array.isArray(raw) ? raw : [raw];
    for (const value of nodes) {
      const node = value as Record<string, unknown>;
      if (!node || typeof node !== "object" || node["@type"] !== "Product")
        continue;
      const offer = offerSchema.parse(
        Array.isArray(node.offers) ? node.offers[0] : node.offers,
      );
      const image = Array.isArray(node.image) ? node.image[0] : node.image;
      const imageUrl = new URL(z.string().parse(image));
      if (
        imageUrl.protocol !== "https:" ||
        imageUrl.hostname !== "assets.asaxiy.uz"
      )
        throw new Error("invalid_image");
      return {
        id,
        name: z.string().min(1).max(200).parse(node.name),
        image: imageUrl.href,
        price: offer.price,
        currency: "UZS",
        source,
        checkedAt: new Date().toISOString(),
        available: offer.availability === "https://schema.org/InStock",
        sourceStatus: "live",
      };
    }
  }
  throw new Error("product_unavailable");
}

export function getRetailProduct(id: string): Promise<CatalogProduct> {
  const entry = catalog.find((p) => p.id === id);
  if (!entry) return Promise.reject(new Error("unknown_product"));
  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) return hit.promise;
  const source = `https://asaxiy.uz/product/${entry.slug}`;
  const promise = (async () => {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(8000),
      redirect: "error",
      headers: { Accept: "text/html" },
    });
    if (!response.ok) throw new Error(`source_http_${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("source_unavailable");
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2_000_000) {
        await reader.cancel();
        throw new Error("source_too_large");
      }
      chunks.push(value);
    }
    return parseRetailProduct(
      Buffer.concat(chunks).toString("utf8"),
      id,
      source,
    );
  })().catch((error: unknown) => {
    console.warn("catalog_source_unavailable", { id, reason: error instanceof Error ? error.message : "unknown" });
    const snapshot = verifiedProducts.find((product) => product.id === id && product.source === source);
    if (!snapshot) throw error;
    return { ...snapshot, sourceStatus: "snapshot" as const };
  });
  cache.set(id, { expires: Date.now() + 15 * 60_000, promise });
  promise.catch(() => {
    if (cache.get(id)?.promise === promise) cache.delete(id);
  });
  return promise;
}
