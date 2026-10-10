import { it, expect } from "vitest";
import { learningStreak } from "../lib/learning";
import { savingsForecast } from "../lib/budget";
import { money } from "../lib/format";
import type { Transaction } from "../types";
it("formats currency with the specified space separator", () => {
  expect(money(15000, "uz")).toBe("15 000 so‘m");
  expect(money(15000, "ru")).toBe("15 000 сум");
});
it("counts a streak without penalizing a day still in progress", () => {
  expect(learningStreak(["2026-10-07", "2026-10-08"], "2026-10-09")).toBe(2);
  expect(learningStreak(["2026-10-07"], "2026-10-09")).toBe(0);
});
it("refuses unsupported savings forecasts and uses only observed profit", () => {
  const rows: Transaction[] = ["2026-10-01", "2026-10-04", "2026-10-07"].map(
    (date, i) => ({
      id: String(i),
      kind: "income",
      amount: 10000,
      cost: 0,
      note: "",
      mode: "practice",
      date,
    }),
  );
  expect(
    savingsForecast(rows.slice(0, 1), "practice", 30000, [50, 30, 20]),
  ).toBeNull();
  expect(savingsForecast(rows, "practice", 30000, [50, 30, 20])).toBe(17);
  expect(savingsForecast(rows, "real", 30000, [50, 30, 20])).toBeNull();
});
