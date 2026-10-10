import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StorePreview } from "./Store";
import { Notice } from "../components/UI";
import type { Draft } from "../types";
export default function PublicStore() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/storefront/public?slug=${encodeURIComponent(slug || "")}`, {
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDraft(d.content))
      .catch(() => setDraft(null))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [slug]);
  return (
    <div className="public-page">
      <Link className="brand" to="/">
        BiznesBola
      </Link>
      {loading ? (
        <div className="skeleton" aria-label={t("loading")} />
      ) : draft ? (
        <StorePreview draft={draft} />
      ) : (
        <Notice>{t("publicMissing")}</Notice>
      )}
      <p className="muted small">{t("disclaimer")}</p>
    </div>
  );
}
