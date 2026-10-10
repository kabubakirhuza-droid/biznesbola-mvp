import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, LogIn } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useApp } from "../store/useApp";
import { PageTitle, Notice, Field, Money } from "../components/UI";
import { StorePreview } from "./Store";
import type { Draft } from "../types";
import { useCapabilities } from "../hooks/useCapabilities";
type ServerStore = { id: string; slug: string; status: string; content: Draft };
export default function Parent() {
  const { t } = useTranslation();
  const s = useApp();
  const capabilities = useCapabilities();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [stores, setStores] = useState<ServerStore[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(path: string, body?: object, auth = token) {
    const res = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
  async function refresh(auth = token) {
    const data = await request("/api/parent/stores", undefined, auth);
    setStores(data.stores);
  }
  async function action(id: string, action: string) {
    setBusy(true);
    try {
      await request("/api/parent/stores", { id, action });
      if (action === "approve") s.award("publication");
      await refresh();
      setNotice("");
    } catch {
      setNotice(t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="parentTitle" subtitle="parentSub" />
      <Notice>
        <ShieldCheck size={18} />
        {t("localParent")}
      </Notice>
      <div className="two-column">
        <section className="card form-card">
          <h2>{t("progress")}</h2>
          <div className="parent-profile">
            <span>{s.profile?.avatar}</span>
            <div>
              <h3>{s.profile?.name}</h3>
              <p>
                {s.milestones.length}/5 • {s.days.length} {t("daysLearned")}
              </p>
            </div>
          </div>
          <h3>{t("history")}</h3>
          {s.transactions.slice(0, 10).map((r) => (
            <div className="result-row" key={r.id}>
              <span>
                {r.note || t(r.kind === "expense" ? "expenses" : r.kind)}
                <small> • {t(r.mode)}</small>
              </span>
              <strong>
                <Money value={r.amount} />
              </strong>
            </div>
          ))}
          {!s.transactions.length && (
            <p className="muted">{t("emptyTransactions")}</p>
          )}
          <h3>{t("store")}</h3>
          <span className="pill">{t(s.draft.status)}</span>
          <p>{s.draft.name || t("draft")}</p>
          <p className="muted small">{t("secureNote")}</p>
          <button
            className="btn text negative"
            onClick={() => {
              if (window.confirm(t("confirmDelete"))) {
                localStorage.removeItem("biznesbola-learning-v1");
                window.location.href = "/";
              }
            }}
          >
            {t("deleteData")}
          </button>
        </section>
        <section className="card form-card">
          <h2>
            <ShieldCheck size={22} />
            {t("approval")}
          </h2>
          {!token ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const data = await request("/api/parent/login", {
                    email,
                    password,
                  });
                  setPassword("");
                  setToken(data.token);
                  await refresh(data.token);
                  setNotice("");
                } catch {
                  setNotice(t("authError") + " " + t("notConfigured"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label={t("parentEmail")}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label={t("parentPassword")}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <button className="btn primary full" disabled={busy}>
                <LogIn size={17} />
                {t("signIn")}
              </button>
              {!capabilities.publishing && (
                <Notice>{t("notConfigured")}</Notice>
              )}
            </form>
          ) : (
            <>
              <button
                className="btn secondary"
                onClick={() => {
                  setToken("");
                  setStores([]);
                }}
              >
                {t("signOut")}
              </button>
              <button
                className="btn primary full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await request("/api/parent/stores", {
                      action: "submit",
                      content: s.draft,
                    });
                    await refresh();
                    setNotice(t("submitted"));
                  } catch {
                    setNotice(t("error"));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("publishRequest")}
              </button>
              {stores.map((store) => (
                <div className="server-store" key={store.id}>
                  <h3>{store.content.name}</h3>
                  <span className="pill">{t(store.status)}</span>
                  <StorePreview draft={store.content} />
                  <div className="inline-actions">
                    {store.status === "review" && (
                      <>
                        <button
                          disabled={busy}
                          className="btn primary"
                          onClick={() => action(store.id, "approve")}
                        >
                          {t("approve")}
                        </button>
                        <button
                          disabled={busy}
                          className="btn secondary"
                          onClick={() => action(store.id, "reject")}
                        >
                          {t("reject")}
                        </button>
                      </>
                    )}
                    {store.status === "published" && (
                      <>
                        <button
                          disabled={busy}
                          className="btn secondary"
                          onClick={() => action(store.id, "unpublish")}
                        >
                          {t("unpublish")}
                        </button>
                        <PublicLink slug={store.slug} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          {notice && <Notice>{notice}</Notice>}
        </section>
      </div>
      {s.draft.products.length > 0 && (
        <section className="card parent-preview">
          <h2>{t("private")}</h2>
          <StorePreview draft={s.draft} />
        </section>
      )}
    </>
  );
}
function PublicLink({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const url = `${window.location.origin}/v/${encodeURIComponent(slug)}`;
  return (
    <div className="public-link">
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
      <QRCodeCanvas id={`qr-${slug}`} value={url} size={160} marginSize={2} />
      <button
        className="btn secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setError(false);
          } catch {
            setError(true);
          }
        }}
      >
        {t(copied ? "copied" : "copy")}
      </button>
      <button
        className="btn secondary"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ url });
            else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            }
            setError(false);
          } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError"))
              setError(true);
          }
        }}
      >
        {t("share")}
      </button>
      <button
        className="btn secondary"
        onClick={() => {
          const canvas = document.getElementById(
            `qr-${slug}`,
          ) as HTMLCanvasElement;
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = `biznesbola-${slug}.png`;
          a.click();
        }}
      >
        {t("downloadQR")}
      </button>
      {error && <Notice>{t("error")}</Notice>}
    </div>
  );
}
