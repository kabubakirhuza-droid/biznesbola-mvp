export type LedgerEntry = {
  id: string;
  project_id: string;
  kind:
    "capital" | "revenue" | "expense" | "refund" | "correction" | "allocation";
  mode: "practice" | "real";
  amount: number;
  cost: number;
  original_id: string | null;
  note: string;
  occurred_at: string;
  created_at: string;
};
export function effectiveLedger(rows: LedgerEntry[]) {
  const originals = rows.filter(
    (r) => !["correction", "refund", "allocation"].includes(r.kind),
  );
  return originals.map((original) => {
    const correction = rows
      .filter((r) => r.kind === "correction" && r.original_id === original.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .at(-1);
    return correction
      ? { ...original, amount: correction.amount, cost: correction.cost }
      : original;
  });
}
export function ledgerSummary(rows: LedgerEntry[]) {
  const effective = effectiveLedger(rows);
  const revenue = effective
    .filter((r) => r.kind === "revenue")
    .reduce((sum, r) => sum + r.amount, 0);
  const expenses = effective.reduce(
    (sum, r) =>
      sum +
      (r.kind === "expense" ? r.amount : r.kind === "revenue" ? r.cost : 0),
    0,
  );
  const capital = effective
    .filter((r) => r.kind === "capital")
    .reduce((sum, r) => sum + r.amount, 0);
  const refunds = rows
    .filter((r) => r.kind === "refund")
    .reduce((sum, r) => sum + r.amount, 0);
  const allocated = rows
    .filter((r) => r.kind === "allocation")
    .reduce((sum, r) => sum + r.amount, 0);
  return {
    revenue,
    expenses,
    capital,
    refunds,
    allocated,
    profit: revenue - expenses - refunds,
    balance: capital + revenue - expenses - refunds,
  };
}
