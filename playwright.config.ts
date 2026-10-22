import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  // Each test renders a WebGL map in software (headless); more workers starve the CPU.
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    locale: "en-GB",
    timezoneId: "Asia/Colombo",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  // Reuses a running `pnpm dev`; otherwise starts one.
  webServer: {
    command: "pnpm dev",
    url: `${BASE_URL}/api/v1/health`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
