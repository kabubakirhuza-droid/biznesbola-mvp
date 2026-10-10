import { test, expect } from "@playwright/test";
test("product images reject SVG, compress PNG, and survive draft reload", async ({
  page,
}) => {
  await page.goto("/");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Keyingi" }).click();
  await page.getByLabel("Ism yoki taxallus").fill("Aziz");
  await page.getByRole("button", { name: "Boshladik!" }).click();
  await page.goto("/store");
  await page.getByLabel("Vitrina nomi").fill("Ijod do‘koni");
  await page
    .getByRole("button", { name: "Mahsulot qo‘shish", exact: true })
    .click();
  await page.getByLabel("Mahsulot nomi").fill("Rasm");
  await page
    .getByLabel("Mahsulot rasmi")
    .setInputFiles({
      name: "unsafe.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    });
  await expect(
    page.getByText("JPEG, PNG yoki WebP tanlang", { exact: false }),
  ).toBeVisible();
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#2F6BFF";
    ctx.fillRect(0, 0, 1400, 1400);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Mahsulot rasmi")
    .setInputFiles({
      name: "drawing.png",
      mimeType: "image/png",
      buffer: Buffer.from(data, "base64"),
    });
  const image = page.locator(".uploaded-thumb");
  await expect(image).toBeVisible();
  const source = await image.getAttribute("src");
  expect(source).toMatch(/^data:image\/webp;base64,/);
  expect(
    Buffer.from(source!.split(",")[1], "base64").length,
  ).toBeLessThanOrEqual(300 * 1024);
  await page.getByRole("button", { name: "Saqlash", exact: true }).click();
  await page.reload();
  await expect(page.locator(".uploaded-thumb")).toBeVisible();
  await expect(page.getByLabel("Mahsulot nomi")).toHaveValue("Rasm");
});
