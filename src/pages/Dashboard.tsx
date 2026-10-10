import { useState } from "react";
import DreamProductPicker from "../components/DreamProductPicker";
import DreamProductImage from "../components/DreamProductImage";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Calculator,
  Wallet,
  Store,
  Flame,
  Check,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";
import { LazyMotion, m, useReducedMotion } from "framer-motion";
import Robert from "../components/Robert";
import { Money, Progress } from "../components/UI";
import { useApp } from "../store/useApp";
import { ledger, allocate } from "../lib/budget";
import { Level } from "../layouts/Layout";
import { learningStreak } from "../lib/learning";
const loadMotion = () =>
  import("../lib/motionFeatures").then((module) => module.default);
export default function Dashboard() {
  const { t } = useTranslation();
  const s = useApp();
  const reduce = useReducedMotion();
  const [choosingProduct, setChoosingProduct] = useState(false);
  const totals = ledger(s.transactions, "practice");
  const savings = allocate(Math.max(0, totals.profit), s.allocation)[1];
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tashkent",
  });
  const done = s.days.includes(today);
  const lesson = Math.min(6, Math.max(0, s.days.length - (done ? 1 : 0)));
  return (
    <>
      <div className="dashboard-greeting">
        <div>
          <h1>
            {t("hello", { name: s.profile?.name })} <span>👋</span>
          </h1>
          <p>{t("greeting")}</p>
        </div>
        <div className="date-chip">
          <Flame size={17} />
          {learningStreak(s.days)} {t("streak")}
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-tag">
                <Sparkles size={14} />
                {t("stepTitle")}
              </span>
              <h2>{t("heroTitle")}</h2>
              <p>{t("heroBody")}</p>
              <Link to="/robert" className="btn dark">
                {t("talk")}
                <ArrowRight size={18} />
              </Link>
            </div>
            <LazyMotion features={loadMotion}>
              <m.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="hero-mascot"
              >
                <span className="hero-star star1">✦</span>
                <span className="hero-star star2">✧</span>
                <Robert />
                <span className="mascot-label">
                  Robert <span>✦</span>
                </span>
              </m.div>
            </LazyMotion>
            <div className="hero-circle" />
          </section>
          <div className="section-heading">
            <div>
              <h2>{t("modules")}</h2>
              <p>{t("moduleSub")}</p>
            </div>
            <span className="section-spark">✦</span>
          </div>
          <div className="module-grid">
            {[
              ["/robert", "ai", "aiDesc", Sparkles, "blue"],
              ["/calculator", "calculator", "calcDesc", Calculator, "yellow"],
              ["/wallet", "wallet", "walletDesc", Wallet, "mint"],
              ["/store", "store", "storeDesc", Store, "coral"],
            ].map(([url, title, desc, Icon, color], i) => {
              const I = Icon as typeof Sparkles;
              return (
                <Link
                  key={i}
                  to={url as string}
                  className={`module-card ${color}`}
                >
                  <span className="module-number">0{i + 1}</span>
                  <div className="module-icon">
                    <I size={26} />
                  </div>
                  <h3>{t(title as string)}</h3>
                  <p>{t(desc as string)}</p>
                  <span className="module-action">
                    {t("start")}
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              );
            })}
          </div>
          <section className="journey card">
            <div className="section-heading">
              <h2>{t("journey")}</h2>
              <span className="muted small">{s.milestones.length}/5</span>
            </div>
            <div className="journey-steps">
              {[
                ["idea", "idea"],
                ["plan", "idea"],
                ["calculate", "calculation"],
                ["saving", "income"],
                ["showcase", "draft"],
              ].map(([label, m], i) => (
                <div
                  key={label}
                  className={s.milestones.includes(m) ? "done" : ""}
                >
                  <span>
                    {s.milestones.includes(m) ? <Check size={18} /> : i + 1}
                  </span>
                  <small>{t(label)}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-right">
          <section className="dream-card card">
            <div className="mini-title">
              <span className="icon-bg lavender">
                <Target size={20} />
              </span>
              <h3>{t("dream")}</h3>
              <span>✧</span>
            </div>
            <DreamProductImage
              key={s.profile?.product?.id || "empty"}
              product={s.profile?.product}
            />
            <h3 className="dream-name">{s.profile?.dream}</h3>
            <div className="dream-amount">
              <strong>
                <Money value={savings} />
              </strong>
              <span>
                / <Money value={s.profile?.goal || 1} />
              </span>
            </div>
            <Progress value={(savings / (s.profile?.goal || 1)) * 100} />
            <div className="progress-caption">
              <span>{t("practice")}</span>
              <strong>
                {Math.round((savings / (s.profile?.goal || 1)) * 100)}%
              </strong>
            </div>
            {s.profile?.product ? (
              <p className="small muted">
                <a
                  href={s.profile.product.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("productPriceSource")} · ASAXIY
                </a>
                <br />
                {t("productChecked", {
                  date: new Date(s.profile.product.checkedAt).toLocaleString(
                    s.language === "ru" ? "ru-RU" : "uz-UZ",
                  ),
                })}
              </p>
            ) : (
              <p className="small muted">{t("productManualPrice")}</p>
            )}
            <button
              type="button"
              className="btn subtle full"
              onClick={() => setChoosingProduct(!choosingProduct)}
            >
              {t("chooseDreamProduct")}
            </button>
            {choosingProduct && (
              <DreamProductPicker
                initialQuery={s.profile?.product?.id || s.profile?.dream}
                onSelect={(product) => {
                  if (s.profile)
                    s.setProfile({
                      ...s.profile,
                      dream: product.name,
                      goal: product.price,
                      product,
                    });
                  setChoosingProduct(false);
                }}
              />
            )}
            <p>{t("dreamSub")}</p>
          {s.profile?.product?.sourceStatus === "snapshot" && <p className="muted small">{t("productSnapshot")}</p>}
            <Link to="/wallet" className="btn subtle full">
              {t("seeDream")}
              <ArrowRight size={16} />
            </Link>
          </section>
          <section className="daily-card">
            <div className="daily-top">
              <span>
                <BookOpen size={17} />
                {t("today")}
              </span>
              <span className="xp-pill">{t("day", { day: lesson + 1 })}</span>
            </div>
            <h3>{t(`lessons.${lesson}.title`)}</h3>
            <p>{t(`lessons.${lesson}.body`)}</p>
            <Link className="daily-link" to="/achievements">
              {done ? t("completed") : t("continue")}
              <ArrowRight size={16} />
            </Link>
          </section>
          <section className="level-card card">
            <div className="mini-title">
              <span className="icon-bg yellow">
                <Trophy size={20} />
              </span>
              <h3>{t("progress")}</h3>
            </div>
            <Level />
            <div className="dashboard-balance">
              <span>
                {t("balance")} • {t("practice")}
              </span>
              <strong>
                <Money value={totals.balance} />
              </strong>
            </div>
            <Link to="/achievements">
              {t("viewAll")}
              <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
