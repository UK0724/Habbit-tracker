import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "retain-on-failure",
    headless: true
  },
  webServer: [
    {
      command: "npm --workspace server run preview:test",
      url: "http://127.0.0.1:4100/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command:
        "npm --workspace client run preview -- --port 5175 --host 127.0.0.1",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_BASE_URL: "/api",
        VITE_DEV_API_TARGET: "http://127.0.0.1:4100"
      },
      timeout: 120000
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      grep: /[1-4,7-9]\. /
    },
    {
      name: "iphone-webkit",
      timeout: 120000,
      use: { ...devices["iPhone 13"], reducedMotion: "reduce" },
      grep: /[7-8]\. /
    }
  ]
});
