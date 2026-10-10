export const lessonAnswers = [7000, 3000, 5000, 1000, 30, 100, 3000];
export const lessonHints = [
  "15 000 − 8 000 = 7 000",
  "1 000 + 2 000 = 3 000",
  "10 000 × 50% = 5 000",
  "3 000 − 2 000 = 1 000",
  "3 000 ÷ 10 000 × 100 = 30",
  "50 + 30 + 20 = 100",
  "10 000 − 7 000 = 3 000",
];
export function learningStreak(
  days: string[],
  today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" }),
) {
  const completed = new Set(days);
  const day = new Date(today + "T12:00:00Z");
  let count = 0;
  if (!completed.has(today)) day.setUTCDate(day.getUTCDate() - 1);
  while (completed.has(day.toISOString().slice(0, 10))) {
    count++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return count;
}
