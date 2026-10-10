import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Sparkles,
  Calculator,
  Wallet,
  Store,
  Trophy,
  ShieldCheck,
  ArrowUpRight,
  Flame,
  GraduationCap,
  FolderOpen,
  Gamepad2,
} from "lucide-react";
import { useSession } from "../store/useSession";
import { useApp, milestones } from "../store/useApp";
import { Progress } from "../components/UI";
import Robert from "../components/Robert";
import { learningStreak } from "../lib/learning";
export const navigation = [
  ["/", "home", Home],
  ["/projects", "projects", FolderOpen],
  ["/practice", "practice", Gamepad2],
  ["/lessons", "lessons", GraduationCap],
  ["/robert", "ai", Sparkles],
  ["/calculator", "calculator", Calculator],
  ["/wallet", "wallet", Wallet],
  ["/store", "store", Store],
  ["/achievements", "achievements", Trophy],
  ["/parent", "parent", ShieldCheck],
] as const;
export default function Layout() {
  const { t, i18n } = useTranslation();
  const s = useApp();
  const session = useSession();
  const xp = s.milestones.reduce(
    (n, k) => n + (milestones[k as keyof typeof milestones] || 0),
    0,
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/">
          <div className="brand-icon">
            <GraduationCap size={25} />
          </div>
          <span>
            Biznes<span>Bola</span>
            <small>{t("learning")}</small>
          </span>
        </NavLink>
        <span className="nav-caption">{t("yourSpace")}</span>
        <nav>
          {navigation.filter(([url])=>!(url==="/parent" && session.profile?.role==="STUDENT")).map(([url, key, Icon]) => (
            <NavLink key={key} to={url} end={url === "/"}>
              <Icon size={21} />
              <span>{t(key)}</span>
              {key === "ai" && <small className="new-dot">AI</small>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Robert />
          <h3>{t("stepTitle")}</h3>
          <p>{t("aiDesc")}</p>
          <NavLink to="/robert">
            {t("talk")} <ArrowUpRight size={16} />
          </NavLink>
        </div>
        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          <span>{t("disclaimer")}</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            {t("learning")} <span> / </span> {t("brand")}
          </span>
          <div className="top-actions">
            <NavLink to="/account" className="btn secondary">
              {session.profile?.alias || t("account")}
            </NavLink>
            {session.profile?.role!=="STUDENT" && session.profile && <NavLink to="/workspace" className="btn secondary">{t("workspace")}</NavLink>}
            <button
              className="btn secondary"
              aria-label={t("theme")}
              onClick={() => {
                const dark = document.documentElement.dataset.theme !== "dark";
                document.documentElement.dataset.theme = dark
                  ? "dark"
                  : "light";
                localStorage.setItem(
                  "biznesbola-theme",
                  dark ? "dark" : "light",
                );
              }}
            >
              {t("theme")}
            </button>
            <div className="language-switch" aria-label={t("language")}>
              {(["uz", "ru"] as const).map((l) => (
                <button
                  key={l}
                  className={s.language === l ? "selected" : ""}
                  onClick={() => {
                    s.setLanguage(l);
                    i18n.changeLanguage(l);
                    document.documentElement.lang = l;
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="streak-chip">
              <Flame size={18} />
              {learningStreak(s.days)}
            </span>
            <NavLink className="profile-chip" to="/parent">
              <span>{s.profile?.avatar || "🌱"}</span>
              <div>
                {s.profile?.name}
                <small>
                  {t(xp >= 80 ? "level2" : xp >= 30 ? "level1" : "level0")}
                </small>
              </div>
            </NavLink>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="footer">
          {t("disclaimer")} <NavLink to="/privacy">{t("privacy")}</NavLink>
        </footer>
      </div>
      <nav className="mobile-nav">
        {navigation
          .filter(([url]) =>
            ["/", "/projects", "/practice", "/wallet", "/robert"].includes(url),
          )
          .map(([url, key, Icon]) => (
            <NavLink to={url} end={url === "/"} key={key}>
              <Icon size={21} />
              <span>{t(key)}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
export function Level() {
  const { t } = useTranslation();
  const done = useApp((s) => s.milestones);
  const xp = done.reduce(
    (n, k) => n + (milestones[k as keyof typeof milestones] || 0),
    0,
  );
  return (
    <div className="level-line">
      <span className="level-badge">
        <Trophy size={15} />
        {t(xp >= 80 ? "level2" : xp >= 30 ? "level1" : "level0")}
      </span>
      <strong>{xp} XP</strong>
      <Progress value={(xp / 115) * 100} />
    </div>
  );
}
