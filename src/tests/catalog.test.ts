import { describe, expect, it, vi } from "vitest";
import { findCatalog } from "../domain/catalog";
import { getRetailProduct, parseRetailProduct } from "../../server/catalog";

describe("dream product matching", () => {
  it("keeps the verified source timestamp and marks the price as a snapshot when the seller is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("source_down")));
    const log = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const product = await getRetailProduct("iphone-16");
      expect(product.sourceStatus).toBe("snapshot");
      expect(product.source).toContain("asaxiy.uz/product/");
      expect(product.price).toBeGreaterThan(0);
      expect(new Date(product.checkedAt).getTime()).toBeLessThanOrEqual(Date.now());
    } finally { vi.unstubAllGlobals(); log.mockRestore(); }
  });
  it("returns phone models for the category, and never substitutes a different iPhone generation", () => {
    expect(findCatalog("telefon").map((p) => p.id)).toEqual([
      "iphone-16",
      "galaxy-a16",
    ]);
    expect(findCatalog("telefon iphone 16").map((p) => p.id)).toEqual([
      "iphone-16",
    ]);
    expect(findCatalog("iPhone 18")).toEqual([]);
    expect(findCatalog("velosiped").map((p) => p.category)).toEqual(["bike"]);
    expect(findCatalog("kitob")).toHaveLength(1);
  });
  it("reads the full UZS offer and product photo, not installment text or unrelated site metadata", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "Product", name: "Test phone", image: "https://assets.asaxiy.uz/product/phone.webp", offers: { price: "10899000", priceCurrency: "UZS", availability: "https://schema.org/InStock" } })}</script><p>1 089 800 x 12</p>`;
    const product = parseRetailProduct(
      html,
      "iphone-16",
      "https://asaxiy.uz/product/test",
    );
    expect(product.price).toBe(10899000);
    expect(product.available).toBe(true);
    expect(product.image).toContain("phone.webp");
    expect(() =>
      parseRetailProduct(html.replace('"UZS"', '"USD"'), "id", "url"),
    ).toThrow();
    expect(() =>
      parseRetailProduct(
        html.replace("assets.asaxiy.uz", "untrusted.example"),
        "id",
        "url",
      ),
    ).toThrow();
  });
});
