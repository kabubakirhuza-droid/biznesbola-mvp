import { describe, it, expect } from "vitest";
import { calculate } from "../lib/calc";
import { allocate, ledger, correctTransaction } from "../lib/budget";
import { awardOnce } from "../store/useApp";
import { planSchema, draftSchema } from "../lib/validation";
import type { Transaction } from "../types";
const example = {
  expenses: [50000, 30000],
  quantity: 10,
  markupPercent: 87.5,
  sold: 10,
};
describe("calculator", () => {
  it("calculates cost, markup, price, profit and break even", () => {
    expect(calculate(example)).toEqual({
      total: 80000,
      unitCost: 8000,
      price: 15000,
      markup: 7000,
      profit: 70000,
      markupPercent: 87.5,
      margin: (7000 / 15000) * 100,
      breakEven: 6,
    });
  });
  it("computes loss and manual price correctly", () => {
    expect(calculate({ ...example, manualPrice: 6000 })).toMatchObject({
      markup: -2000,
      profit: -20000,
      margin: (-2000 / 6000) * 100,
    });
  });
  it("uses integer amounts without understating unit cost", () =>
    expect(
      calculate({
        ...example,
        expenses: [100],
        quantity: 3,
        sold: 3,
        markupPercent: 50,
      }),
    ).toMatchObject({ unitCost: 34, price: 51, profit: 51 }));
  it("rejects invalid quantities and expenses", () => {
    expect(() => calculate({ ...example, quantity: 0 })).toThrow();
    expect(() => calculate({ ...example, expenses: [-1] })).toThrow();
    expect(() => calculate({ ...example, sold: 11 })).toThrow();
  });
  it("supports free materials without division by zero", () =>
    expect(
      calculate({ ...example, expenses: [0], manualPrice: 3000 }),
    ).toMatchObject({ markupPercent: 0, profit: 30000 }));
});
describe("allocations", () => {
  it("allocates 50/30/20", () =>
    expect(allocate(10000, [50, 30, 20])).toEqual([5000, 3000, 2000]));
  it("preserves every integer sum with deterministic largest remainders", () => {
    for (let amount = 0; amount < 500; amount++) {
      const parts = allocate(amount, [33, 33, 34]);
      expect(parts.reduce((a, b) => a + b)).toBe(amount);
    }
    expect(allocate(1, [50, 30, 20])).toEqual([1, 0, 0]);
  });
  it("rejects invalid totals and fractional percentages", () => {
    expect(() => allocate(1, [50, 30, 21])).toThrow();
    expect(() => allocate(1, [50.5, 29.5, 20])).toThrow();
  });
});
const tx: Transaction[] = [
  {
    id: "1",
    kind: "income",
    amount: 15000,
    cost: 8000,
    note: "sale",
    mode: "real",
    date: "2026-10-09",
  },
  {
    id: "2",
    kind: "capital",
    amount: 100000,
    cost: 0,
    note: "capital",
    mode: "real",
    date: "2026-10-09",
  },
  {
    id: "3",
    kind: "income",
    amount: 10000,
    cost: 0,
    note: "practice",
    mode: "practice",
    date: "2026-10-09",
  },
];
describe("ledger and progress", () => {
  it("separates capital, revenue and profit, and excludes simulations", () =>
    expect(ledger(tx, "real")).toEqual({
      revenue: 15000,
      expenses: 8000,
      capital: 100000,
      profit: 7000,
      balance: 107000,
    }));
  it("corrects and can undo transactions", () => {
    const corrected = correctTransaction(tx, "1", { amount: 20000 });
    expect(ledger(corrected, "real").profit).toBe(12000);
    expect(tx[0].amount).toBe(15000);
    expect(
      ledger(
        corrected.filter((t) => t.id !== "1"),
        "real",
      ).profit,
    ).toBe(0);
  });
  it("awards milestone only once", () =>
    expect(awardOnce(awardOnce([], "idea"), "idea")).toEqual(["idea"]));
});
describe("server schemas", () => {
  it("rejects inconsistent structured prices", () =>
    expect(
      planSchema.safeParse({
        product: "book",
        unit_cost: 1000,
        markup: 2000,
        price: 4000,
      }).success,
    ).toBe(false));
  it("rejects public contact details", () =>
    expect(
      draftSchema.safeParse({
        name: "shop",
        description: "call +998 90 123 45 67",
        products: [
          {
            id: "x",
            name: "book",
            description: "",
            available: true,
            price: 3000,
          },
        ],
      }).success,
    ).toBe(false));
});
