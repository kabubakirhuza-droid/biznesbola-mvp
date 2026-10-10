import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Robert from "../components/Robert";
import { useApp } from "../store/useApp";
export default function Landing() {
  const { t, i18n } = useTranslation();
  const language = useApp((s) => s.language);
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" to="/">
          Biznes<span>Bola</span>
        </Link>
        <nav>
          <Link to="/account">{t("login")}</Link>
          <button
            className="btn secondary"
            onClick={() => {
              const next = language === "uz" ? "ru" : "uz";
              useApp.getState().setLanguage(next);
              i18n.changeLanguage(next);
            }}
          >
            {language === "uz" ? "RU" : "UZ"}
          </button>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <div>
            <span className="pill">{t("freeAccess")}</span>
            <h1>{t("saasSlogan")}</h1>
            <p>{t("landingIntro")}</p>
            <div className="plan-actions">
              <Link className="btn primary" to="/start">
                {t("guestStart")}
              </Link>
              <Link className="btn secondary" to="/start">
                {t("demoSee")}
              </Link>
            </div>
          </div>
          <Robert expression="happy" />
        </section>
        <section>
          <h2>{t("learningPath")}</h2>
          <div className="path-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <article className="card" key={i}>
                <span className="step-number">{i + 1}</span>
                <h3>{t("stage" + i)}</h3>
                <p>{t("stageHelp" + i)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-example card">
          <h2>{t("projectExample")}</h2>
          <p>{t("projectExampleBody")}</p>
          <Link className="btn primary" to="/start">
            {t("tryProject")}
          </Link>
        </section>
        <section className="path-grid">
          {["parentsInfo", "teachersInfo", "safetyInfo", "freeInfo"].map(
            (k) => (
              <article className="card" key={k}>
                <h2>{t(k)}</h2>
                <p>{t(k + "Body")}</p>
                <Link to="/account">{t("account")}</Link>
              </article>
            ),
          )}
        </section>
        <section>
          <h2>FAQ</h2>
          {["free", "ai", "privacy", "money"].map((k) => (
            <details className="card" key={k}>
              <summary>{t("faq_" + k)}</summary>
              <p>{t("faq_" + k + "Answer")}</p>
            </details>
          ))}
        </section>
      </main>
      <footer className="footer">
        <Link to="/privacy">{t("privacy")}</Link>
        <span>{t("disclaimer")}</span>
      </footer>
    </div>
  );
}
