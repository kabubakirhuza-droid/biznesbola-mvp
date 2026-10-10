import { expect, test } from "@playwright/test";

test("dream selects a real model, photo, and seller price and preserves it after reload", async ({
  page,
}) => {
  await page.addInitScript(() =>
    !localStorage.getItem("biznesbola-learning-v1") && localStorage.setItem(
      "biznesbola-learning-v1",
      JSON.stringify({
        version: 0,
        state: {
          profile: {
            name: "Aziz",
            age: "11–13",
            avatar: "🌱",
            dream: "iPhone 18",
            goal: 10000000,
          },
          language: "uz",
          transactions: [],
          milestones: [],
          messages: [],
          plans: [],
          draft: { name: "", description: "", products: [], status: "draft" },
          days: [],
          allocation: [50, 30, 20],
          calculation: null,
        },
      }),
    ),
  );
  await page.goto("/");
  const dream = page.locator(".dream-card");
  await expect(dream.locator(".dream-image-empty")).toBeVisible();
  await dream.getByRole("button", { name: "Mahsulotni tanlash" }).click();
  await expect(
    dream.getByText("Bu model katalogda topilmadi.", { exact: false }),
  ).toBeVisible();
  await dream.getByLabel("Orzu mahsulotini qidirish").fill("telefon");
  await expect(dream.locator(".dream-product-option")).toHaveCount(2);
  const expected = await (
    await page.request.get("/api/products?id=iphone-16")
  ).json();
  const product = expected.products[0];
  expect(product.price).toBeGreaterThan(0);
  await dream.getByRole("button", { name: /Apple iPhone 16/ }).click();
  await expect(dream.locator(".dream-name")).toHaveText(product.name);
  await expect(dream.locator(".dream-illustration img")).toHaveAttribute(
    "src",
    product.image,
  );
  await expect
    .poll(() =>
      dream
        .locator(".dream-illustration img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await expect(dream.locator(".dream-amount")).toContainText(
    product.price.toLocaleString("en-US").replace(/,/g, " "),
  );
  const photoBox = await dream.locator(".dream-illustration img").boundingBox();
  const titleBox = await dream.locator(".dream-name").boundingBox();
  expect(photoBox!.y + photoBox!.height).toBeLessThanOrEqual(titleBox!.y);
  await page.reload();
  await expect(dream.locator(".dream-name")).toHaveText(product.name);
  await page.goto("/wallet");
  await expect(
    page.getByRole("heading", { name: product.name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dream-illustration img")).toHaveAttribute(
    "src",
    product.image,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
