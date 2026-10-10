import type { Transaction } from "../types";
export function savingsForecast(
  rows: Transaction[],
  mode: "practice" | "real",
  goal: number,
  percent: number[],
) {
  const relevant = rows.filter((t) => t.mode === mode);
  const dates = [
    ...new Set(
      relevant
        .filter((t) => t.kind === "income")
        .map((t) => t.date.slice(0, 10)),
    ),
  ].sort();
  if (dates.length < 3) return null;
  const span =
    Math.floor(
      (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / 86400000,
    ) + 1;
  if (span < 7) return null;
  const profit = ledger(relevant, mode).profit;
  if (profit <= 0 || percent[1] === 0) return null;
  const saved = allocate(profit, percent)[1];
  const daily = saved / span;
  if (daily <= 0) return null;
  return Math.ceil(Math.max(0, goal - saved) / daily);
}
export function allocate(amount: number, percent: number[]) {
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    percent.length !== 3 ||
    percent.some((n) => !Number.isInteger(n) || n < 0) ||
    percent.reduce((a, b) => a + b, 0) !== 100
  )
    throw new Error("Invalid allocation");
  const parts = percent.map((p) => Math.floor((amount * p) / 100));
  let remainder = amount - parts.reduce((a, b) => a + b, 0);
  const order = percent
    .map((p, i) => ({ i, remainder: (amount * p) % 100 }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  for (const { i } of order) {
    if (remainder-- > 0) parts[i]++;
  }
  return parts;
}
export function ledger(rows: Transaction[], mode: "practice" | "real") {
  const r = rows.filter((t) => t.mode === mode);
  const revenue = r
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0),
    expenses = r.reduce(
      (s, t) =>
        s +
        (t.kind === "expense" ? t.amount : t.kind === "income" ? t.cost : 0),
      0,
    ),
    capital = r
      .filter((t) => t.kind === "capital")
      .reduce((s, t) => s + t.amount, 0);
  return {
    revenue,
    expenses,
    capital,
    profit: revenue - expenses,
    balance: capital + revenue - expenses,
  };
}
export function correctTransaction(
  rows: Transaction[],
  id: string,
  patch: Partial<Pick<Transaction, "amount" | "cost" | "note">>,
) {
  return rows.map((t) => (t.id === id ? { ...t, ...patch } : t));
}
