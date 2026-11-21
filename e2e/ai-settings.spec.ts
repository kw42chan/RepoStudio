import { test, expect } from "@playwright/test";

test("OpenRouter settings save, redact, reload, update models and remove through the UI", async ({ page, request }) => {
  const initial = await (await request.get("/api/settings/ai")).json();
  test.skip(initial.configured, "Preserve an existing real connection; synthetic settings test requires demo mode.");
  const key = `sk-or-v1-${"c".repeat(64)}`;
  try {
    const loaded = page.waitForResponse(response => response.url().endsWith("/api/settings/ai") && response.request().method() === "GET");
    await page.goto("/settings");
    expect((await loaded).ok()).toBe(true);
    await expect(page.getByTestId("ai-connection-status")).toContainText("Demo mode");
    await page.getByLabel("OpenRouter API key", { exact: true }).fill(key);
    await page.getByLabel("Text model ID", { exact: true }).fill("openai/gpt-4o-mini");
    await page.getByRole("button", { name: "Save OpenRouter settings", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "OpenRouter settings saved" })).toBeVisible();
    await expect(page.getByLabel("OpenRouter API key", { exact: true })).toHaveValue("");
    const status = await request.get("/api/settings/ai"); expect(await status.text()).not.toContain(key);
    await page.reload(); await expect(page.getByTestId("ai-connection-status")).toContainText("saved in Settings");
    await page.screenshot({ path: "test-results/openrouter-settings.png", fullPage: true });
    await expect(page.getByLabel("Text model ID", { exact: true })).toHaveValue("openai/gpt-4o-mini");
    await page.getByLabel("Text model ID", { exact: true }).fill("deepseek/deepseek-v4.1-flash-1017");
    await page.getByRole("button", { name: "Save OpenRouter settings", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "OpenRouter settings saved" })).toBeVisible();
    await page.goto("/"); await expect(page.getByRole("link", { name: "Model: deepseek/deepseek-v4.1-flash-1017", exact: true })).toBeVisible();
    await page.goto("/settings");
    // Simulate the provider-check response; no fake key is sent to an external service.
    await page.route("**/api/settings/ai", async route => {
      if (route.request().method() === "POST") await route.fulfill({ json: { ok: false, message: "OpenRouter rejected this key. Check the key and its permissions." } });
      else await route.continue();
    });
    await page.getByRole("button", { name: "Test connection", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "OpenRouter rejected this key" })).toBeVisible();
    await page.getByRole("button", { name: "Remove saved connection", exact: true }).click();
    await expect(page.getByTestId("ai-connection-status")).toContainText("Demo mode");
  } finally { await request.delete("/api/settings/ai"); }
});
