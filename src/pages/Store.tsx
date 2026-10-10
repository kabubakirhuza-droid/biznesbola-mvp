import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Store as StoreIcon,
  Plus,
  Trash2,
  Eye,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../store/useApp";
import { draftSchema } from "../lib/validation";
import { compressImage } from "../lib/image";
import { Field, Money, PageTitle, Notice } from "../components/UI";
import type { Draft, Product } from "../types";
import { useCapabilities } from "../hooks/useCapabilities";
import { Link } from "react-router-dom";
export function StorePreview({
  draft,
  demo = false,
}: {
  draft: Pick<Draft, "name" | "description" | "products" | "demo" | "avatar">;
  demo?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="store-preview">
      <div className="store-banner">
        <div className="store-logo">
          {draft.avatar || <BookOpen size={34} />}
        </div>
        {(demo || draft.demo) && (
          <span className="demo-label">{t("demoContent")}</span>
        )}
        <h2>{draft.name || t("storeName")}</h2>
        <p>{draft.description}</p>
      </div>
      <div className="public-products">
        {draft.products.map((p, i) => (
          <article className="public-product" key={p.id}>
            <div className={`product-art art-${i % 5}`}>
              {p.image ? (
                <img src={p.image} alt={p.name} />
              ) : (
                <div className="book-cover">
                  <span>✦</span>
                  <BookOpen size={42} />
                  <strong>{p.name}</strong>
                  <span>✧</span>
                </div>
              )}
            </div>
            <div className="product-copy">
              <small className={p.available ? "availability" : "unavailable"}>
                {t(p.available ? "available" : "unavailable")}
              </small>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <strong>
                <Money value={p.price} />
              </strong>
            </div>
          </article>
        ))}
      </div>
      <Notice>{t("publicEducational")}</Notice>
    </div>
  );
}
export default function Store() {
  const { t } = useTranslation();
  const s = useApp();
  const capabilities = useCapabilities();
  const [draft, setDraft] = useState(s.draft);
  const [preview, setPreview] = useState(false);
  const [demo, setDemo] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  function editProduct(id: string, patch: Partial<Product>) {
    setDraft((current) => ({
      ...current,
      status: "draft",
      products: current.products.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    }));
  }
  function save(review = false) {
    const parsed = draftSchema.safeParse(draft);
    if (!parsed.success) {
      setNotice(t("invalid") + " " + t("privacyText"));
      return;
    }
    const next = {
      ...draft,
      status: review ? ("review" as const) : ("draft" as const),
    };
    try {
      s.setDraft(next);
      s.award("draft");
      setDraft(next);
      setNotice(t(review ? "review" : "draftSaved"));
    } catch {
      setNotice(t("imageError"));
    }
  }
  return (
    <>
      <PageTitle title="storeTitle" subtitle="storeSub" />
      <Notice>
        <ShieldCheck size={18} />
        {capabilities.publishing ? (
          <Link to="/parent">{t("secureNote")}</Link>
        ) : (
          t("publishingDisabled")
        )}
      </Notice>
      <div className="page-tools">
        <span className="pill">
          {t(draft.status)} • {t("private")}
        </span>
        <div className="inline-actions">
          <button
            className="btn secondary"
            onClick={() => {
              setDemo(true);
              setDraft({
                demo: true,
                avatar: "📚",
                name: t("library"),
                description: t("libraryDesc"),
                status: "draft",
                products: [1, 2, 3, 4, 5].map((i) => ({
                  id: crypto.randomUUID(),
                  name: t(`book${i}`),
                  description: t("bookDesc"),
                  price: 3000,
                  available: true,
                })),
              });
            }}
          >
            <BookOpen size={17} />
            {t("loadDemo")}
          </button>
          <button
            className="btn secondary"
            onClick={() => setPreview(!preview)}
          >
            <Eye size={17} />
            {t("preview")}
          </button>
        </div>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {preview ? (
        <>
          <StorePreview draft={draft} demo={demo} />
          <button className="btn secondary" onClick={() => setPreview(false)}>
            {t("back")}
          </button>
        </>
      ) : (
        <div className="two-column store-editor">
          <section className="card form-card">
            <div className="card-heading">
              <span className="icon-bg coral">
                <StoreIcon />
              </span>
              <h2>{t("store")}</h2>
            </div>
            <Field label={t("storeName")}>
              <input
                value={draft.name}
                maxLength={60}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value, status: "draft" })
                }
              />
            </Field>
            <Field label={t("avatar")}>
              <div className="avatars">
                {["📚", "🎨", "🌱", "⭐"].map((a) => (
                  <button
                    type="button"
                    key={a}
                    aria-label={a}
                    className={draft.avatar === a ? "active" : ""}
                    onClick={() =>
                      setDraft({ ...draft, avatar: a, status: "draft" })
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label={`${t("description")} (${draft.description.length}/140)`}
            >
              <textarea
                maxLength={140}
                value={draft.description}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    description: e.target.value,
                    status: "draft",
                  })
                }
              />
            </Field>
            <div className="stack-actions">
              <button
                className="btn primary"
                disabled={uploading}
                onClick={() => save()}
              >
                {t("save")}
              </button>
              <button
                className="btn secondary"
                disabled={uploading}
                onClick={() => save(true)}
              >
                {t("submitReview")}
              </button>
            </div>
            <p className="small muted">{t("secureNote")}</p>
          </section>
          <section>
            <div className="section-heading">
              <h2>{t("products")}</h2>
              <span>{draft.products.length}/10</span>
            </div>
            {draft.products.map((p, i) => (
              <div className="card product-editor" key={p.id}>
                <div className="card-heading">
                  <h3>
                    {i + 1}. {p.name || t("productName")}
                  </h3>
                  <button
                    className="icon-button"
                    aria-label={t("remove")}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        status: "draft",
                        products: draft.products.filter((x) => x.id !== p.id),
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <Field label={t("productName")}>
                  <input
                    maxLength={80}
                    value={p.name}
                    onChange={(e) =>
                      editProduct(p.id, { name: e.target.value })
                    }
                  />
                </Field>
                <Field label={t("price")}>
                  <input
                    type="number"
                    min="0"
                    max="100000000"
                    value={p.price}
                    onChange={(e) =>
                      editProduct(p.id, { price: +e.target.value })
                    }
                  />
                </Field>
                <Field label={t("description")}>
                  <input
                    maxLength={140}
                    value={p.description}
                    onChange={(e) =>
                      editProduct(p.id, { description: e.target.value })
                    }
                  />
                </Field>
                <Field label={t("image")}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const image = await compressImage(file);
                        editProduct(p.id, { image });
                        setNotice("");
                      } catch {
                        setNotice(t("imageError"));
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </Field>
                {p.image && (
                  <img className="uploaded-thumb" src={p.image} alt={p.name} />
                )}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={p.available}
                    onChange={(e) =>
                      editProduct(p.id, { available: e.target.checked })
                    }
                  />
                  {t("available")}
                </label>
              </div>
            ))}
            <button
              className="btn secondary full"
              disabled={draft.products.length >= 10}
              onClick={() =>
                setDraft({
                  ...draft,
                  status: "draft",
                  products: [
                    ...draft.products,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      price: 3000,
                      description: "",
                      available: true,
                    },
                  ],
                })
              }
            >
              <Plus size={18} />
              {t("addProduct")}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
