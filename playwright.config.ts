import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", workers: 1, timeout: 90_000,
  use: { baseURL: "http://localhost:3100", headless: true, viewport: { width: 1440, height: 1100 }, screenshot: "only-on-failure" },
  reporter: "list",
});
