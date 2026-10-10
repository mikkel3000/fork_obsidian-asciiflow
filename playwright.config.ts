import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 20000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "node scripts/browser-server.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
