import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Calculator,
  Wallet,
  Store,
  ShieldCheck,
  Check,
  Lock,
  Flame,
} from "lucide-react";
import { useApp, milestones } from "../store/useApp";
import { PageTitle, Notice } from "../components/UI";
import { Level } from "../layouts/Layout";
import Robert from "../components/Robert";
import { lessonAnswers, lessonHints } from "../lib/learning";
export default function Achievements() {
  const { t } = useTranslation();
  const s = useApp();
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tashkent",
  });
  const completed = s.days.includes(today);
  const lesson = Math.min(6, Math.max(0, s.days.length - (completed ? 1 : 0)));
  return (
    <>
      <PageTitle title="allBadges" subtitle="achievementSub" />
      <section className="card achievement-level">
        <Robert expression="celebrating" />
        <div>
          <h2>{t("progress")}</h2>
          <Level />
          <p>
            <Flame size={17} />
            {s.days.length} {t("daysLearned")}
          </p>
        </div>
      </section>
      <div className="badges-grid">
        {(
          [
            ["idea", "badgeIdea", Sparkles],
            ["calculation", "badgeCalc", Calculator],
            ["income", "badgeIncome", Wallet],
            ["draft", "badgeDraft", Store],
            ["publication", "badgePublication", ShieldCheck],
          ] as const
        ).map(([key, title, Icon]) => {
          const done = s.milestones.includes(key);
          return (
            <article
              className={`card badge-card ${done ? "unlocked" : "locked"}`}
              key={key}
            >
              <span className="badge-icon">
                <Icon size={32} />
              </span>
              <h3>{t(title)}</h3>
              <span className="badge-xp">+{milestones[key]} XP</span>
              <small>
                {done ? <Check size={14} /> : <Lock size={14} />}{" "}
                {t(done ? "unlocked" : "locked")}
              </small>
            </article>
          );
        })}
      </div>
      <section className="card challenge">
        <h2>{t("challenge")}</h2>
        <p>{t("challengeSub")}</p>
        <div className="challenge-days">
          {Array.from({ length: 7 }, (_, i) => (
            <div className={s.days.length > i ? "done" : ""} key={i}>
              <span>{s.days.length > i ? <Check size={19} /> : i + 1}</span>
              <small>{t("day", { day: i + 1 })}</small>
            </div>
          ))}
        </div>
        <div className="lesson">
          <h3>{t(`lessons.${lesson}.title`)}</h3>
          <p>{t(`lessons.${lesson}.body`)}</p>
          <p>{t(`lessons.${lesson}.question`)}</p>
          {completed ? (
            <Notice>{t("completed")}</Notice>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setChecked(true);
                if (+answer === lessonAnswers[lesson]) s.learn();
              }}
            >
              <div className="inline-actions">
                <input
                  type="number"
                  aria-label={t("amount")}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="0"
                />
                <button className="btn primary">{t("complete")}</button>
              </div>
              {checked && +answer !== lessonAnswers[lesson] && (
                <Notice>{lessonHints[lesson]}</Notice>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  );
}
