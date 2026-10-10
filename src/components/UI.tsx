import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../store/useApp";
import { money } from "../lib/format";
export function Money({ value }: { value: number }) {
  const l = useApp((s) => s.language);
  return <>{money(value, l)}</>;
}
export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { t } = useTranslation();
  return (
    <header className="page-title">
      <span className="eyebrow">{t("learning")}</span>
      <h1>{t(title)}</h1>
      <p>{t(subtitle)}</p>
    </header>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice" role="status">
      {children}
    </div>
  );
}
export function Progress({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={t("progress")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.max(0, Math.min(100, Math.round(value)))}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
