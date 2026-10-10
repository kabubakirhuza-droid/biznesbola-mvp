import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const url = process.env.BB_AUDIT_URL || "http://127.0.0.1:5189";
await mkdir("reports", { recursive: true });
const browser = await chromium.launchPersistentContext(
  "reports/lighthouse-profile",
  { headless: true, args: ["--remote-debugging-port=9321"] },
);
try {
  const page = await browser.newPage();
  await page.goto(url);
  await page.evaluate(() =>
    localStorage.setItem(
      "biznesbola-learning-v1",
      JSON.stringify({
        state: {
          profile: {
            name: "Aziz",
            age: "8–10",
            avatar: "🌱",
            dream: "Velosiped",
            goal: 1200000,
          },
          language: "uz",
        },
        version: 0,
      }),
    ),
  );
  await page.close();
  const result = await lighthouse(url, {
    port: 9321,
    output: ["html", "json"],
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    disableStorageReset: true,
  });
  await writeFile("reports/lighthouse.html", result.report[0]);
  await writeFile("reports/lighthouse.json", result.report[1]);
  console.log(
    JSON.stringify(
      {
        url,
        date: new Date().toISOString(),
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, category]) => [
            key,
            Math.round(category.score * 100),
          ]),
        ),
        failedAudits: Object.entries(result.lhr.audits)
          .filter(([, a]) => a.score !== null && a.score < 1)
          .map(([id, a]) => ({
            id,
            title: a.title,
            score: a.score,
            details: a.details?.items,
          })),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
