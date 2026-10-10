import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const url = process.env.BB_PREVIEW_URL || "http://127.0.0.1:5188";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(url);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  await page.goto(url + "/robert");
  await page.getByRole("textbox").fill("salom men bitta ideam bor");
  await page.getByRole("button", { name: "Yuborish", exact: true }).click();
  await page.getByText("G‘oyang nima?", { exact: false }).waitFor();
  assert.equal(await page.locator(".plan-card").count(), 0);
  assert.equal(
    await page.locator(".message.assistant .response-label.fallback").count(),
    1,
  );
  const status = await page.request.get(url + "/api/status");
  assert.equal(status.status(), 200);
  const api = await page.request.post(url + "/api/ai/chat", {
    headers: { Origin: url },
    data: { text: "salom men bitta ideam bor", language: "uz", history: [] },
  });
  assert.equal(api.status(), 503);
  assert.equal((await api.json()).error, "ai_not_configured");
  console.log(
    JSON.stringify({
      site: url,
      greeting: "clarifies_without_invented_plan",
      apiStatus: await status.json(),
      chat: "503 ai_not_configured",
    }),
  );
} finally {
  await browser.close();
}
