import { test, expect } from "@playwright/test";

test("brand heading and body typography persist independently", async ({ page, request }) => {
  const id = `typography-check-${Date.now()}`;
  const response = await request.post("/api/presets", { data: { preset: { id, name: "Typography check", voice: "Direct", audience: "Builders", cta: "Save", handle: "@check", primaryColor: "#123456", secondaryColor: "#654321", defaultWritingStyle: "educational" } } });
  expect(response.ok()).toBe(true);
  try {
    await page.goto(`/settings/brands/${id}`);
    await page.getByLabel("Heading font").selectOption("lora");
    await page.getByLabel("Body font").selectOption("inter");
    await page.getByRole("button", { name: "Save brand", exact: true }).click();
    await expect(page.getByText("Saved Typography check.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Heading font")).toHaveValue("lora");
    await expect(page.getByLabel("Body font")).toHaveValue("inter");
    await page.evaluate(() => document.fonts.ready);
    const family = await page.getByText("Make your ideas clear / 讓想法更清晰").evaluate(el => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toContain("lora");
    await page.screenshot({ path: "test-results/brand-typography.png", fullPage: true });
  } finally {
    await request.delete("/api/presets", { data: { id } });
  }
});

test("keyboard deck commands keep focus and count limits", async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await page.getByRole("button", { name: "Move right", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await expect(page.getByText("Slide 2 (body)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate slide", exact: true }).click();
  await expect(page.getByText("6 slides", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await expect(page.getByText("5 slides", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete slide", exact: true })).toBeDisabled();
  await expect(page.getByText("3 slides", { exact: true })).toBeVisible();
});
