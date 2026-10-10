const { defineConfig, devices } = require("@playwright/test");

const bravePath = process.env.BRAVE_BIN
  || (process.platform === "darwin"
    ? "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    : process.platform === "win32"
      ? "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      : "/usr/bin/brave-browser");

module.exports = defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }], ["junit", { outputFile: "test-results/junit.xml" }]],
  timeout: 30_000,
  use: {
    baseURL: "https://rahulshettyacademy.com",
    headless: process.env.PW_HEADLESS !== "false",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], browserName: "chromium", channel: "chrome" }
    },
    {
      name: "brave",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        launchOptions: { executablePath: bravePath }
      }
    },
    {
      name: "safari",
      use: { ...devices["Desktop Safari"], browserName: "webkit" }
    }
  ]
});
