import DreamProductPicker from "../components/DreamProductPicker";
import DreamProductImage from "../components/DreamProductImage";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Undo2,
  Pencil,
  Wallet as WalletIcon,
  Check,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { useApp } from "../store/useApp";
import {
  ledger,
  allocate,
  correctTransaction,
  savingsForecast,
} from "../lib/budget";
import { Field, Money, PageTitle, Notice, Progress } from "../components/UI";
import type { Transaction } from "../types";
export default function Wallet() {
  const { t } = useTranslation();
  const s = useApp();
  const location = useLocation();
  const sale = location.state?.sale;
  const [choosingProduct, setChoosingProduct] = useState(false);
  const [mode, setMode] = useState<"practice" | "real">("practice");
  const [open, setOpen] = useState(!!sale);
  const [kind, setKind] = useState<Transaction["kind"]>("income");
  const [amount, setAmount] = useState(String(sale?.amount || 10000));
  const [cost, setCost] = useState(String(sale?.cost || 0));
  const [note, setNote] = useState(sale?.note || "");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [percent, setPercent] = useState(s.allocation.map(String));
  const totals = ledger(s.transactions, mode);
  const jars = allocate(Math.max(0, totals.profit), s.allocation);
  const rows = s.transactions.filter((t) => t.mode === mode);
  const forecast = savingsForecast(
    s.transactions,
    mode,
    s.profile?.goal || 0,
    s.allocation,
  );
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      day: date.toLocaleDateString(s.language === "ru" ? "ru-RU" : "uz-UZ", {
        weekday: "short",
      }),
      income: rows
        .filter(
          (r) =>
            r.kind === "income" &&
            new Date(r.date).toDateString() === date.toDateString(),
        )
        .reduce((a, r) => a + r.amount, 0),
    };
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !Number.isSafeInteger(+amount) ||
      +amount <= 0 ||
      +amount > 1e9 ||
      !Number.isSafeInteger(+cost) ||
      +cost < 0 ||
      +cost > 1e9
    ) {
      setError(t("invalid"));
      return;
    }
    if (editing)
      s.setTransactions(
        correctTransaction(s.transactions, editing, {
          amount: +amount,
          cost: kind === "income" ? +cost : 0,
          note,
        }),
      );
    else {
      const first = !s.milestones.includes("income") && kind === "income";
      s.addTransaction({
        id: crypto.randomUUID(),
        kind,
        amount: +amount,
        cost: kind === "income" ? +cost : 0,
        note,
        mode,
        date: new Date().toISOString(),
      });
      if (first) setCelebrate(true);
    }
    setOpen(false);
    setEditing(null);
    setError("");
  }
  return (
    <>
      <PageTitle title="walletTitle" subtitle="walletSub" />
      <div className="page-tools">
        <div className="segment">
          {(["practice", "real"] as const).map((m) => (
            <button
              className={m === mode ? "active" : ""}
              key={m}
              onClick={() => {
                setMode(m);
                setOpen(false);
                setEditing(null);
              }}
            >
              {t(m)}
            </button>
          ))}
        </div>
        <button
          className="btn primary"
          onClick={() => {
            setEditing(null);
            setOpen(!open);
          }}
        >
          <Plus size={18} />
          {t("addTransaction")}
        </button>
      </div>
      <p className="muted small">{t("modeNote")}</p>
      {celebrate && (
        <div className="celebration" role="status">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${i * 6}%`,
                  background: ["#FFC83D", "#2F6BFF", "#3DDC97", "#FF6B6B"][
                    i % 4
                  ],
                  animationDelay: `${(i % 5) * 0.12}s`,
                }}
              />
            ))}
          </div>
          <span>🎉</span>
          <strong>{t("firstIncome")} +30 XP</strong>
          <button
            className="icon-button"
            aria-label={t("cancel")}
            onClick={() => setCelebrate(false)}
          >
            ×
          </button>
        </div>
      )}
      {open && (
        <form className="card transaction-form" onSubmit={submit}>
          <div className="field-pair">
            <Field label={t("addTransaction")}>
              <select
                disabled={!!editing}
                value={kind}
                onChange={(e) => setKind(e.target.value as Transaction["kind"])}
              >
                {["income", "expense", "capital"].map((k) => (
                  <option key={k} value={k}>
                    {t(k === "expense" ? "expenses" : k)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("amount")}>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
          </div>
          {kind === "income" && (
            <>
              <Field label={t("costRecovered")}>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>
              <p className="small muted">{t("costHint")}</p>
            </>
          )}
          <Field label={t("note")}>
            <input
              maxLength={100}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {error && <Notice>{error}</Notice>}
          <div className="inline-actions">
            <button className="btn primary">{t("save")}</button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}
      <div className="stats-grid">
        {[
          ["balance", totals.balance],
          ["income", totals.revenue],
          ["expenses", totals.expenses],
          ["profit", totals.profit],
        ].map(([key, value]) => (
          <div className="card stat" key={key}>
            <span>{t(key as string)}</span>
            <strong>
              <Money value={value as number} />
            </strong>
          </div>
        ))}
      </div>
      <div className="two-column">
        <section className="card jars-card">
          <h2>{t("allocation")}</h2>
          <p className="muted">{t("allocationHint")}</p>
          <div className="jars">
            {["working", "dream", "personal"].map((key, i) => (
              <div className={`jar-item jar-${i}`} key={key}>
                <span className="jar-percent">{s.allocation[i]}%</span>
                <div className="jar">
                  <div
                    className="jar-fill"
                    style={{ height: `${s.allocation[i]}%` }}
                  />
                  <span>{["🌱", "⭐", "🍦"][i]}</span>
                </div>
                <h3>{t(key)}</h3>
                <strong>
                  <Money value={jars[i]} />
                </strong>
              </div>
            ))}
          </div>
          <div className="allocation-inputs">
            {percent.map((p, i) => (
              <input
                key={i}
                type="number"
                min="0"
                max="100"
                aria-label={t(["working", "dream", "personal"][i])}
                value={p}
                onChange={(e) =>
                  setPercent(
                    percent.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              />
            ))}
            <button
              className="icon-button"
              aria-label={t("allocation")}
              onClick={() => {
                try {
                  allocate(0, percent.map(Number));
                  s.setAllocation(percent.map(Number));
                  setError("");
                } catch {
                  setError(t("allocationError"));
                }
              }}
            >
              <Check size={18} />
            </button>
          </div>
          {error && <Notice>{error}</Notice>}
          <DreamProductImage
            key={s.profile?.product?.id || "empty"}
            product={s.profile?.product}
          />
          <h3>{s.profile?.dream}</h3>
          {s.profile?.product?.sourceStatus === "snapshot" && <p className="muted small">{t("productSnapshot")}</p>}
          {s.profile?.product && (
            <a
              href={s.profile.product.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              ASAXIY · {t("productPriceSource")}
            </a>
          )}
          <button
            className="btn subtle"
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

          <Progress value={(jars[1] / (s.profile?.goal || 1)) * 100} />
          <p className="small muted">
            <Money value={jars[1]} /> / <Money value={s.profile?.goal || 0} />
          </p>
        </section>
        <section className="card chart-card">
          <h2>{t("weekly")}</h2>
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={week}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="income"
                  name={t("income")}
                  fill="#2F6BFF"
                  radius={[7, 7, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="small muted">
            {forecast === null
              ? t("noForecast")
              : t("forecastDays", { days: forecast })}
          </p>
          <div className="capital-line">
            <WalletIcon size={17} />
            {t("capital")}{" "}
            <strong>
              <Money value={totals.capital} />
            </strong>
          </div>
        </section>
      </div>
      <section className="card history">
        <h2>{t("history")}</h2>
        {!rows.length ? (
          <div className="empty-state">
            <WalletIcon size={35} />
            <p>{t("emptyTransactions")}</p>
          </div>
        ) : (
          rows.map((r) => (
            <div className="transaction-row" key={r.id}>
              <span className={`transaction-icon ${r.kind}`}>
                {r.kind === "expense" ? <ArrowUpRight /> : <ArrowDownLeft />}
              </span>
              <div className="transaction-info">
                <strong>
                  {r.note || t(r.kind === "expense" ? "expenses" : r.kind)}
                </strong>
                <small>
                  {new Date(r.date).toLocaleDateString(
                    s.language === "ru" ? "ru-RU" : "uz-UZ",
                  )}{" "}
                  • {t(r.mode)}
                </small>
              </div>
              <strong
                className={r.kind === "expense" ? "negative" : "positive"}
              >
                {r.kind === "expense" ? "−" : "+"}
                <Money value={r.amount} />
              </strong>
              <button
                className="icon-button"
                aria-label={t("edit")}
                onClick={() => {
                  setEditing(r.id);
                  setKind(r.kind);
                  setAmount(String(r.amount));
                  setCost(String(r.cost));
                  setNote(r.note);
                  setOpen(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={t("undo")}
                onClick={() => s.removeTransaction(r.id)}
              >
                <Undo2 size={16} />
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
}
