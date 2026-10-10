import { test, expect } from "@playwright/test";
test.use({ trace: "off" });
test("anonymous users cannot approve storefronts", async ({ request }) => {
  const response = await request.post("/api/parent/stores", {
    data: { action: "approve", id: "0f2c32e4-3061-48a3-903c-a2c5a83172e1" },
  });
  expect(response.status()).toBe(401);
});
test("verified parent approves, another browser opens storefront, parent unpublishes", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.BB_TEST_PARENT_EMAIL || !process.env.BB_TEST_PARENT_PASSWORD,
    "Requires configured Supabase, rate limiter, and a verified demo parent.",
  );
  await page.goto("/");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  await page.goto("/store");
  await page
    .getByRole("button", { name: "Kutubxona namunasini yuklash" })
    .click();
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await page.goto("/parent");
  await page
    .getByLabel("Tasdiqlangan ota-ona elektron pochtasi")
    .fill(process.env.BB_TEST_PARENT_EMAIL!);
  await page
    .getByLabel("Parol", { exact: true })
    .fill(process.env.BB_TEST_PARENT_PASSWORD!);
  await page.getByRole("button", { name: "Ota-ona akkauntiga kirish" }).click();
  await page
    .getByRole("button", { name: "Serverga ko‘rib chiqish uchun yuborish" })
    .click();
  const first = page.locator(".server-store").first();
  await first
    .getByRole("button", { name: "Tasdiqlash va nashr etish" })
    .click();
  const url = await first.locator(".public-link a").getAttribute("href");
  expect(url).toBeTruthy();
  const visitor = await browser.newContext();
  try {
    const publicPage = await visitor.newPage();
    await publicPage.goto(url!);
    await expect(
      publicPage.getByRole("heading", { name: "Hovli kutubxonasi" }),
    ).toBeVisible();
    await expect(
      publicPage.getByText("NAMUNA • XAYOLIY KITOBLAR"),
    ).toBeVisible();
    await first.getByRole("button", { name: "Nashrni yopish" }).click();
    await publicPage.reload();
    await expect(
      publicPage.getByText("Bu vitrina nashr etilmagan yoki yopilgan."),
    ).toBeVisible();
  } finally {
    await visitor.close();
    if (await first.getByRole("button", { name: "Nashrni yopish" }).count())
      await first.getByRole("button", { name: "Nashrni yopish" }).click();
  }
});
