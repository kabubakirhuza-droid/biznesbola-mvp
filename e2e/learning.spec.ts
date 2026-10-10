import { test, expect } from "@playwright/test";
async function onboard(page: import("@playwright/test").Page) {
  await page.goto("/");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  await expect(
    page.getByRole("heading", { name: "Salom, Aziz!" }),
  ).toBeVisible();
}
test("complete local learning flow and language persistence", async ({
  page,
}) => {
  await onboard(page);
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Привет, Aziz!" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Привет, Aziz!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "UZ", exact: true }).click();
  await page.goto("/calculator");
  await expect(page.getByText("70 000 so‘m", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hisobni saqlash" }).click();
  await page.goto("/wallet");
  await page.getByRole("button", { name: "Yozuv qo‘shish" }).click();
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(page.getByText("Birinchi daromad! +30 XP")).toBeVisible();
  await expect(page.getByText("5 000 so‘m", { exact: true })).toBeVisible();
  await expect(
    page.getByText("3 000 so‘m", { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("10 000 so‘m", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tuzatish" }).click();
  await page.getByLabel("Miqdor (so‘m)").fill("20000");
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(
    page.getByText("6 000 so‘m", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bekor qilish", exact: true }).click();
  await expect(
    page.getByText("Hali yozuv yo‘q.", { exact: false }),
  ).toBeVisible();
});
test("AI fallback transfers to calculator and storefront stays private", async ({
  page,
}) => {
  await onboard(page);
  await page.route("**/api/ai/chat", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"ai_not_configured"}',
    }),
  );
  await page.goto("/robert");
  await page
    .getByRole("button", { name: "Eski kitoblarim bor", exact: true })
    .click();
  await expect(
    page.locator(".response-label.fallback"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kalkulyatorga o‘tkazish" }).click();
  await expect(page.getByLabel("Mahsulot nomi")).toHaveValue(
    "Hovli kutubxonasi",
  );
  await page.goto("/store");
  await page
    .getByRole("button", { name: "Kutubxona namunasini yuklash" })
    .click();
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await page
    .getByRole("button", { name: "Ota-onaga ko‘rib chiqish uchun" })
    .click();
  await expect(
    page.getByText("Ko‘rib chiqish kutilmoqda").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Vitrinani ko‘rish" }).click();
  await expect(page.getByText("NAMUNA • XAYOLIY KITOBLAR")).toBeVisible();
  await expect(page.getByText("Sehrli bog‘").first()).toBeVisible();
  await page.goto("/parent");
  await expect(
    page.getByText(
      "Mahalliy o‘quv ko‘rinishi — ota-onani tasdiqlash usuli emas.",
    ),
  ).toBeVisible();
  await page.goto("/v/unpublished");
  await expect(
    page.getByText("Bu vitrina nashr etilmagan yoki yopilgan."),
  ).toBeVisible();
});
test("navigation and responsive page overflow", async ({ page }) => {
  await onboard(page);
  for (const path of [
    "/",
    "/robert",
    "/calculator",
    "/wallet",
    "/store",
    "/achievements",
    "/parent",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noOverflow, `${path} has horizontal overflow`).toBe(true);
  }
});
