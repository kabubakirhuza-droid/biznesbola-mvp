import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSession } from "../store/useSession";
import { cloud } from "../lib/cloud";
import { Notice, Field } from "../components/UI";
export default function Account() {
  const { t } = useTranslation();
  const session = useSession();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (code) {
      history.replaceState(null, "", "/account");
      cloud("/api/auth", "POST", { action: "exchange", code })
        .then(() => session.refresh())
        .catch(() => setError("invalid_link"));
    }
  }, [session.refresh]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      await cloud("/api/auth", "POST", {
        action: mode,
        email,
        password,
        alias,
      });
      await session.refresh();
      setPassword("");
      setDone(
        mode === "register"
          ? "confirmEmail"
          : mode === "recover"
            ? "recoveryRequested"
            : "saved",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="public-shell">
      <Link className="brand" to="/">
        BiznesBola
      </Link>
      <section className="card account-card">
        <h1>{t("account")}</h1>
        {!session.loaded ? (
          <p>{t("loading")}</p>
        ) : !session.configured ? (
          <Notice>{t("cloudUnavailable")}</Notice>
        ) : session.profile ? (
          <>
            <h2>{session.profile.alias}</h2>
            <p>{t("role_" + session.profile.role)}</p>
            <Link className="btn primary" to="/workspace">
              {t("workspace")}
            </Link>
            <form onSubmit={submit}>
              <Field label={t("password")}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  minLength={12}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => setMode("password")}
              >
                {t("changePassword")}
              </button>
            </form>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await cloud("/api/auth", "POST", {
                    action: "logout",
                    all: true,
                  });
                  await session.refresh();
                } catch {
                  setError("server_error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("logoutAll")}
            </button>
          </>
        ) : (
          <>
            <div className="segment">
              {["login", "register", "recover"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setDone("");
                  }}
                  className={m === mode ? "active" : ""}
                >
                  {t(m)}
                </button>
              ))}
            </div>
            <form onSubmit={submit}>
              {mode === "register" && (
                <Field label={t("alias")}>
                  <input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </Field>
              )}
              <Field label={t("email")}>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              {mode !== "recover" && (
                <Field label={t("password")}>
                  <input
                    type="password"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    minLength={mode === "register" ? 12 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              )}
              <button className="btn primary" disabled={busy}>
                {t(busy ? "loading" : mode)}
              </button>
            </form>
            <p className="small muted">{t("adultAuthNote")}</p>
          </>
        )}
        {error && (
          <Notice>
            {t("error_" + error, { defaultValue: t("serverError") })}
          </Notice>
        )}
        {done && <Notice>{t(done)}</Notice>}
        <Link to="/start">{t("guestStart")}</Link>
      </section>
    </main>
  );
}
