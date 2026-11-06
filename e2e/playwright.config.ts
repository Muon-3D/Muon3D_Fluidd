import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests for Control and the Library (Jack, 5 Nov 2026: what the
 * user sees and does matters most; no page is done until its e2e tests pass).
 *
 * Control runs from vite against a mock Moonraker (e2e/mock/moonraker.py, a
 * mid-print M1 on :7125, where Control looks by default). The model service
 * and the console are faked per test with page.route (e2e/fakes), so every
 * test owns its data. Two sizes: desktop and phone.
 */
const PORT = Number(process.env.E2E_PORT || 8090)

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  // The whole run, warm-up included: a cold vite in CI can take minutes.
  globalTimeout: 25 * 60_000,
  outputDir: '../test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: '../playwright-report' }]] : 'list',
  use: {
    // Control marks elements for tests with data-tid.
    testIdAttribute: 'data-tid',
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'dark'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } }
  ],
  webServer: [
    {
      command: `${process.env.PYTHON || 'python'} e2e/mock/moonraker.py 7125`,
      port: 7125,
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000
    },
    {
      command: `npx vite --port ${PORT} --strictPort`,
      port: PORT,
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: { E2E: '1' }
    }
  ]
})
