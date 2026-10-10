import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const url = process.env.BB_PREVIEW_URL || "http://127.0.0.1:5188";
await mkdir("reports/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto(url);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url);
    await page.getByRole("heading", { name: "Salom, Aziz!" }).waitFor();
    await page.screenshot({
      path: `reports/screenshots/dashboard-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto(url + "/robert");
  await page
    .getByRole("button", { name: "Eski kitoblarim bor", exact: true })
    .click();
  await page.locator(".response-label.fallback").waitFor();
  await page.screenshot({
    path: "reports/screenshots/mentor-1280.png",
    fullPage: true,
  });
  await page.goto(url + "/store");
  await page
    .getByRole("button", { name: "Kutubxona namunasini yuklash" })
    .click();
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await page.getByRole("button", { name: "Vitrinani ko‘rish" }).click();
  await page.screenshot({
    path: "reports/screenshots/store-1280.png",
    fullPage: true,
  });
  console.log("Saved 6 screenshots in reports/screenshots");
} finally {
  await browser.close();
}
