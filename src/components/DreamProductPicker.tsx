import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogProduct } from "../domain/catalog";
import { Money } from "./UI";

export default function DreamProductPicker({
  initialQuery = "",
  onSelect,
  onQueryChange,
}: {
  initialQuery?: string;
  onSelect: (product: CatalogProduct) => void;
  onQueryChange?: (query: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [state, setState] = useState("loading");
  useEffect(() => {
    const controller = new AbortController();
    setProducts([]);
    setState("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("unavailable");
        const result = await response.json();
        setProducts(result.products);
        setState(result.products.length ? "ready" : "empty");
      } catch {
        if (!controller.signal.aborted) setState("error");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="dream-picker">
      <label>
        {t("productSearch")}
        <input
          maxLength={80}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChange?.(e.target.value);
          }}
          placeholder={t("productSearchHint")}
        />
      </label>
      <p className="muted small" role="status">
        {t(`productState_${state}`)}
      </p>
      <div className="dream-product-list">
        {products.map((p) => (
          <button
            type="button"
            className="dream-product-option"
            key={p.id}
            onClick={() => onSelect(p)}
          >
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span>
              <strong>{p.name}</strong>
              <span>
                <Money value={p.price} />
              </span>
              <small>
                {p.sourceStatus === "snapshot" && <>{t("productSnapshot")} · {new Date(p.checkedAt).toLocaleDateString()}<br /></>}
                {p.available ? t("productInStock") : t("productOutOfStock")}
              </small>
            </span>
          </button>
        ))}
      </div>
      <p className="muted small">{t("productCatalogNote")}</p>
    </div>
  );
}
