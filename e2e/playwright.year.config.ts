import { defineConfig, devices } from '@playwright/test'
import { MOCK_PORT } from './ports'

/**
 * History's year grid and spool ring (design-lab A and C) are behind a build-time
 * flag that is OFF by default, so the main run never draws them. These specs run
 * against a vite started with the flag ON, on its own port:
 *
 *   npm run test:e2e:year
 *   E2E_YEAR_PORT=8291 E2E_MOCK_PORT=7291 npm run test:e2e:year
 *
 * (The flag-off side is e2e/control/year-flag-off.spec.ts, in the main run.)
 */
const YEAR_PORT = Number(process.env.E2E_YEAR_PORT || 8091)

export default defineConfig({
  testDir: './year',
  globalSetup: './global-setup.ts',
  globalTimeout: 20 * 60_000,
  outputDir: '../test-results-year',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github']] : 'list',
  use: {
    testIdAttribute: 'data-tid',
    baseURL: `http://localhost:${YEAR_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'dark'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } } }
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
      command: `npx vite --port ${YEAR_PORT} --strictPort`,
      port: YEAR_PORT,
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      stdout: 'pipe',
      env: { E2E: '1', E2E_PORT: String(YEAR_PORT), VITE_CONTROL_YEAR_SPOOL: 'true' }
    }
  ]
})
