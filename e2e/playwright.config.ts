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
  // 37 min, under the 40-min job limit in .github/workflows/e2e.yml (D-117), leaving
  // time to write the blob report. At 35 it cut shard 2 (442 tests) before the job limit did.
  globalTimeout: 37 * 60_000,
  outputDir: '../test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // CI runs --shard=N/6 (14 Nov, KAN-2755: shard 1 of 4 reached the 37 min limit), which cuts the test list into six runs of equal COUNT
  // in file order (skipped tests count too), not equal time. The slow specs
  // that load the 3D stage or the editors live in control/heavy/ so they sort
  // into the first slice and no shard gets all of them. Re-balance by moving a
  // file in or out of that folder, or add a shard, when a shard drifts toward its 37 min limit.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  // Two retries in CI (14 Nov): on the 2-core runner one or two heavy tests a run time out on both of two tries
  // under load (a different one each run: ble-chooser:97, history:169, settings-3d-model...), while a real
  // failure fails all three. The report still lists them as flaky.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: '../playwright-report' }]] : 'list',
  use: {
    // Control marks elements for tests with data-tid.
    testIdAttribute: 'data-tid',
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'dark',
    // E2E_SOFTWARE_GL=1: draw WebGL on SwiftShader as a CI runner (no GPU) does, to reproduce its starvation locally.
    ...(process.env.E2E_SOFTWARE_GL ? { launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu'] } } : {})
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
      stdout: 'pipe',
      env: { E2E: '1', E2E_PORT: String(PORT) }
    }
  ]
})
