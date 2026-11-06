import { defineConfig, devices } from '@playwright/test'
import { MOCK_PORT, VITE_PORT } from './ports'

/**
 * End-to-end tests for Control and the Library (Jack, 5 Nov 2026: what the
 * user sees and does matters most; no page is done until its e2e tests pass).
 *
 * Control runs from vite against a mock Moonraker (e2e/mock/moonraker.py, a
 * mid-print M1 on E2E_MOCK_PORT, default :7125; see ports.ts). The model service
 * and the console are faked per test with page.route (e2e/fakes), so every
 * test owns its data. Two sizes: desktop and phone.
 */
const PORT = VITE_PORT

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  // The whole run, warm-up included: a cold vite in CI can take minutes.
  globalTimeout: 35 * 60_000,
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
      command: `${process.env.PYTHON || 'python'} e2e/mock/moonraker.py ${MOCK_PORT}`,
      port: MOCK_PORT,
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
      env: { E2E: '1', E2E_PORT: String(PORT) }
    }
  ]
})
