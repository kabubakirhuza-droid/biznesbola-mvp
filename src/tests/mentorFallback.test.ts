import { expect, it } from "vitest";
import { mentorFallback } from "../lib/mentorFallback";

it("asks for the idea without fabricating a product or prices on a greeting", () => {
  const result = mentorFallback("salom men bitta ideam bor", (key) => key);
  expect(result.text).toBe("fallbackClarify");
  expect(result.fallback).toBe(true);
  expect(result).not.toHaveProperty("plan");
});

it("keeps explicit book examples available offline without treating every idea as a bracelet", () => {
  expect(mentorFallback("kitob ijarasi", (key) => key).plan?.price).toBe(3000);
  expect(mentorFallback("men rasm chizaman", (key) => key)).not.toHaveProperty(
    "plan",
  );
});
