export type Calculation = {
  expenses: number[];
  quantity: number;
  markupPercent: number;
  sold: number;
  manualPrice?: number;
};
export function calculate(x: Calculation) {
  if (
    !x.expenses.length ||
    x.expenses.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    !Number.isSafeInteger(x.quantity) ||
    x.quantity < 1 ||
    !Number.isSafeInteger(x.sold) ||
    x.sold < 0 ||
    x.sold > x.quantity ||
    !Number.isFinite(x.markupPercent) ||
    x.markupPercent < 0 ||
    x.markupPercent > 10000 ||
    (x.manualPrice !== undefined &&
      (!Number.isSafeInteger(x.manualPrice) || x.manualPrice < 0))
  )
    throw new Error("Invalid calculation");
  const total = x.expenses.reduce((a, b) => a + b, 0);
  if (!Number.isSafeInteger(total)) throw new Error("Overflow");
  const unitCost = Math.ceil(total / x.quantity),
    price = x.manualPrice ?? Math.round(unitCost * (1 + x.markupPercent / 100)),
    markup = price - unitCost,
    profit = markup * x.sold;
  return {
    total,
    unitCost,
    price,
    markup,
    profit,
    markupPercent: unitCost ? (markup / unitCost) * 100 : 0,
    margin: price ? (markup / price) * 100 : 0,
    breakEven: price > 0 ? Math.ceil(total / price) : null,
  };
}
