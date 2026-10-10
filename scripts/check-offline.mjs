import { chromium } from "@playwright/test";
const url = process.env.BB_AUDIT_URL || "http://127.0.0.1:5189";
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  for (const route of [
    "/calculator",
    "/wallet",
    "/store",
    "/robert",
    "/achievements",
  ]) {
    await page.goto(url + route);
    await page.locator("h1").waitFor();
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto(url + "/calculator");
  await page.getByText("70 000 so‘m", { exact: true }).waitFor();
  await page.goto(url + "/wallet");
  await page.getByRole("button", { name: "Yozuv qo‘shish" }).click();
  await page
    .locator(".transaction-form")
    .getByRole("button", { name: "Saqlash", exact: true })
    .click();
  await page.getByText("5 000 so‘m", { exact: true }).waitFor();
  await page.goto(url + "/robert");
  await page
    .getByRole("button", { name: "Eski kitoblarim bor", exact: true })
    .click();
  await page.getByText("O‘quv javobi • Jonli AI ulanmagan").waitFor();
  console.log(
    "PASS: cached production calculator, income allocation, and labelled Robert fallback work with browser networking disabled.",
  );
} finally {
  await browser.close();
}
