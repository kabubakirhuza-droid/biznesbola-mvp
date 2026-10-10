import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "./store/useApp";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import { lazy, Suspense, useEffect } from "react";
import { useSession } from "./store/useSession";
const Landing = lazy(() => import("./pages/Landing"));
const Account = lazy(() => import("./pages/Account"));
const Projects = lazy(() => import("./pages/Projects"));
const Practice = lazy(() => import("./pages/Practice"));
const Lessons = lazy(() => import("./pages/Lessons"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Money = lazy(() => import("./pages/Money"));
const Showcase = lazy(() => import("./pages/Showcase"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Mentor = lazy(() => import("./pages/Mentor"));
const Store = lazy(() => import("./pages/Store"));
const Parent = lazy(() => import("./pages/Parent"));
const Achievements = lazy(() => import("./pages/Achievements"));
const PublicStore = lazy(() => import("./pages/PublicStore"));
function Privacy() {
  const { t } = useTranslation();
  return (
    <section className="card privacy-page">
      <h1>{t("privacy")}</h1>
      <p>{t("privacyText")}</p>
      <p>{t("disclaimer")}</p>
    </section>
  );
}
export default function App() {
  const profile = useApp((s) => s.profile);
  const { t } = useTranslation();
  const session = useSession();
  useEffect(() => {
    void session.refresh();
  }, [session.refresh]);
  return (
    <Suspense fallback={<div className="skeleton" aria-label={t("loading")} />}>
      <Routes>
        <Route path="/v/:slug" element={<PublicStore />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/account" element={<Account />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/admin" element={<Workspace admin />} />
        {!profile && !session.profile ? (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Onboarding />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route
              index
              element={session.profile ? <Workspace /> : <Dashboard />}
            />
            <Route path="robert" element={<Mentor />} />
            <Route path="projects" element={<Projects />} />
            <Route path="practice" element={<Practice />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="showcase" element={<Showcase />} />
            <Route path="calculator" element={<Calculator />} />
            <Route
              path="wallet"
              element={session.profile ? <Money /> : <Wallet />}
            />
            <Route path="store" element={<Store />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="parent" element={session.profile ? <Workspace /> : <Parent />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
}
