import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "line" : "html",
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3001",
    navigationTimeout: 30000,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chrome-390",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-chrome-375",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "mobile-chrome-414",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 414, height: 896 },
      },
    },
    {
      name: "mobile-chrome-320",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 320, height: 568 },
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
  },
})
