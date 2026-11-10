import { defineConfig } from '@playwright/test'
import base from './playwright.config'
import { MOCK_PORT, VITE_PORT } from './ports'

/**
 * Cold-load timings of a production build (KAN-2013), not a pass/fail suite:
 * e2e/perf/first-paint.perf.ts, one run at a time on the desktop size.
 *
 *   npx vite build --outDir ../dist-prod-check --emptyOutDir
 *   PERF_OUT=perf.jsonl E2E_PORT=8412 E2E_MOCK_PORT=7412 npx playwright test -c e2e/playwright.perf.config.ts
 *
 * PERF_DIST serves another build; PERF_RATES (default "1,6") and PERF_RUNS (default 3) pick the CPU slowdowns and runs.
 */
export default defineConfig({
  ...base,
  testMatch: '**/*.perf.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 6 * 60_000,
  reporter: 'list',
  use: { ...base.use, baseURL: `http://127.0.0.1:${VITE_PORT}`, serviceWorkers: 'block' },
  projects: [base.projects![0]],
  webServer: [
    {
      command: `${process.env.PYTHON || 'python'} e2e/mock/moonraker.py ${MOCK_PORT}`,
      port: MOCK_PORT,
      cwd: '..',
      reuseExistingServer: true,
      timeout: 60_000
    },
    {
      command: `${process.env.PYTHON || 'python'} e2e/serve-dist.py ${process.env.PERF_DIST || '../dist-prod-check'} ${VITE_PORT}`,
      port: VITE_PORT,
      cwd: '..',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
})
