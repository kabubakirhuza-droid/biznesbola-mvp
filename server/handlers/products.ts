import { method, json, type Request, type Response } from "../http.js";
import { findCatalog } from "../../src/domain/catalog.js";
import { getRetailProduct } from "../catalog.js";

export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET"])) return;
  const url = new URL(req.url || "/", "http://localhost");
  const query = url.searchParams.get("q") || "";
  const id = url.searchParams.get("id");
  if (query.length > 80) return json(res, 400, { error: "invalid_query" });
  const entries = id
    ? findCatalog("").filter((p) => p.id === id)
    : findCatalog(query);
  const results = await Promise.allSettled(
    entries.map((p) => getRetailProduct(p.id)),
  );
  const products = results.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );
  json(res, products.length || !entries.length ? 200 : 503, {
    products,
    unavailable: results.filter((r) => r.status === "rejected").length,
  });
}
