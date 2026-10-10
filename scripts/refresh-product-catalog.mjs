import { writeFile } from "node:fs/promises";

// Run the local dev server first. Never refresh source dates from stale snapshots.
const response = await fetch("http://127.0.0.1:5188/api/products");
if (!response.ok) throw new Error("Local catalog request failed");
const { products } = await response.json();
if (products.length !== 6 || products.some((p) => p.sourceStatus !== "live")) {
  throw new Error("All six listings must be verified live before updating the snapshot");
}
await writeFile(new URL("../server/catalog-snapshot.json", import.meta.url), JSON.stringify(products, null, 2) + "\n");
await writeFile(new URL("../server/catalogSnapshot.ts", import.meta.url), 'import type { CatalogProduct } from "../src/domain/catalog.js";\n// Verified seller data. Preserve checkedAt when the source is unavailable.\nexport const verifiedProducts: CatalogProduct[] = ' + JSON.stringify(products, null, 2) + ";\n");
console.log("Updated six verified seller listings; original source timestamps preserved.");
