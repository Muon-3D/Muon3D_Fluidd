import { defineConfig, devices } from '@playwright/test'
import { MOCK_PORT } from './ports'

/**
 * KAN-5101: the offline specs run against a PRODUCTION build (the dev server
 * the other specs use does not install the precache), which the spec serves
 * itself so it can switch the site off. Build first:
 *
 *   npx vite build
 *   npx playwright test -c e2e/playwright.offline.config.ts
 *
 * OFFLINE_DIST names another build to test (default ./dist).
 */
export default defineConfig({
  testDir: './offline',
  outputDir: '../test-results-offline',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    testIdAttribute: 'data-tid',
    colorScheme: 'dark',
    // Windows gives the browser its real GPU, so the accurate M1 model is drawn (as e2e/control/m1-model-look.spec.ts).
    ...(process.platform === 'win32' ? { launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } } : {})
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
      reuseExistingServer: true,
      timeout: 60_000
    }
  ]
})
