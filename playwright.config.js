/**
 * @module playwright.config
 * @description Playwright E2E test configuration
 *
 * PURPOSE:
 * - Configure Playwright for E2E testing of the Sales Engine app
 * - Set up local web server to serve index.html
 * - Configure browser and test settings
 *
 * USAGE:
 * - npm run test:e2e - Run all E2E tests
 * - npm run test:e2e:ui - Run with Playwright UI
 * - npm run test:e2e:debug - Run in debug mode
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local server before tests
  webServer: {
    command: 'npx serve -l 3000 -s .',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
