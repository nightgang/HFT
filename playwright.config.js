// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '/tmp',
  testMatch: 'dashboard-test.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],
  webServer: {
    command: 'cd /workspaces/HFT/frontend && npx vite --port 5175 --host 0.0.0.0',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
