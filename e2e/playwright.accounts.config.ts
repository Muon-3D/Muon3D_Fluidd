import { defineConfig, devices } from '@playwright/test'
import { MOCK_PORT } from './ports'

/**
 * Sign-in through accounts.muon3d.com (KAN-7197) is behind a build-time flag that is OFF by default and works
 * only on exactly https://control.muon3d.com, so the main run never draws it. These specs run against a vite
 * started with the flag ON and this port named as the one extra origin it may work on, with a fake accounts
 * issuer served by the tests at <origin>/accounts:
 *
 *   npm run test:e2e:accounts
 */
const ACCOUNTS_PORT = Number(process.env.E2E_ACCOUNTS_PORT || 8092)

export default defineConfig({
  testDir: './accounts',
  globalTimeout: 20 * 60_000,
  outputDir: '../test-results-accounts',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github']] : 'list',
  use: {
    testIdAttribute: 'data-tid',
    baseURL: `http://localhost:${ACCOUNTS_PORT}`,
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
      command: `npx vite --port ${ACCOUNTS_PORT} --strictPort`,
      port: ACCOUNTS_PORT,
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      stdout: 'pipe',
      env: { E2E: '1', E2E_PORT: String(ACCOUNTS_PORT), VITE_CONTROL_ACCOUNTS_SIGNIN: 'true', VITE_CONTROL_ACCOUNTS_E2E_ORIGIN: `http://localhost:${ACCOUNTS_PORT}`, VITE_CONTROL_ACCOUNTS_URL: `http://localhost:${ACCOUNTS_PORT}/accounts` }
    }
  ]
})
