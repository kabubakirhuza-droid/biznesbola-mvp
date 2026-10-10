import DreamProductPicker from "../components/DreamProductPicker";
import DreamProductImage from "../components/DreamProductImage";
import type { CatalogProduct } from "../domain/catalog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import { useApp } from "../store/useApp";
import Robert from "../components/Robert";
import { Field, Notice } from "../components/UI";
export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const s = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("8–10");
  const [avatar, setAvatar] = useState("🌱");
  const [dream, setDream] = useState("");
  const [goal, setGoal] = useState("1200000");
  const [product, setProduct] = useState<CatalogProduct>();
  const [error, setError] = useState(false);
  return (
    <div className="onboarding">
      <div className="onboard-nav">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap />
          </div>
          BiznesBola
        </div>
        <div className="language-switch">
          {(["uz", "ru"] as const).map((l) => (
            <button
              className={s.language === l ? "selected" : ""}
              key={l}
              onClick={() => {
                s.setLanguage(l);
                i18n.changeLanguage(l);
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="onboard-card">
        <div className="onboard-art">
          <span className="orbit one">✦</span>
          <Robert expression={step === 2 ? "celebrating" : "happy"} />
          <span className="orbit two">✧</span>
          <div className="onboard-slogan">{t("slogan")}</div>
        </div>
        <section>
          {step < 3 ? (
            <>
              <span className="eyebrow">
                {t("brand")} • {step + 1}/3
              </span>
              <h1>{t(["welcome", "slide2Title", "slide3Title"][step])}</h1>
              <p>{t(["slide1", "slide2", "slide3"][step])}</p>
              <div className="slide-dots">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i === step ? "active" : ""} />
                ))}
              </div>
              <button className="btn primary" onClick={() => setStep(step + 1)}>
                {t("next")}
                <ArrowRight size={18} />
              </button>
              {step > 0 && (
                <button className="btn text" onClick={() => setStep(step - 1)}>
                  {t("back")}
                </button>
              )}
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !name.trim() ||
                  name.length > 30 ||
                  !Number.isSafeInteger(+goal) ||
                  +goal <= 0 ||
                  +goal > 1000000000 ||
                  (!product && dream.length > 60)
                ) {
                  setError(true);
                  return;
                }
                s.setProfile({
                  name: name.trim(),
                  age,
                  avatar,
                  dream: dream.trim() || t("bike"),
                  goal: product?.price || +goal,
                  product,
                });
              }}
            >
              <h1>{t("profileTitle")}</h1>
              <Field label={t("nickname")}>
                <input
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label={t("age")}>
                <select value={age} onChange={(e) => setAge(e.target.value)}>
                  {["8–10", "11–13", "14–16"].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("avatar")}>
                <div className="avatars">
                  {["🌱", "🚀", "🦊", "🎨", "🌟"].map((a) => (
                    <button
                      type="button"
                      key={a}
                      aria-label={a}
                      aria-pressed={a === avatar}
                      className={a === avatar ? "active" : ""}
                      onClick={() => setAvatar(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </Field>
              <DreamProductPicker
                onQueryChange={(query) => {
                  setDream(query);
                  setProduct(undefined);
                }}
                onSelect={(p) => {
                  setProduct(p);
                  setDream(p.name);
                  setGoal(String(p.price));
                }}
              />
              {product ? (
                <div className="selected-dream">
                  <DreamProductImage key={product.id} product={product} />
                  <strong>{product.name}</strong>
                  <p>{product.price.toLocaleString()} so‘m</p>
                  <a
                    href={product.source}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ASAXIY · {t("productPriceSource")}
                  </a>
                </div>
              ) : (
                <Field label={t("dreamAmount")}>
                  <input
                    type="number"
                    min="1"
                    max="1000000000"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                  />
                  <p className="muted small">{t("productManualPrice")}</p>
                </Field>
              )}
              <p className="muted small">
                <ShieldCheck size={16} />
                {t("profileHint")}
              </p>
              {error && <Notice>{t("invalid")}</Notice>}
              <button className="btn primary full">
                {t("launch")}
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </section>
      </div>
      <p className="onboard-disclaimer">{t("disclaimer")}</p>
    </div>
  );
}
