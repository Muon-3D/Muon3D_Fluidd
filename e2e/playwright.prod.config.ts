import base from './playwright.config'
import { MOCK_PORT, VITE_PORT } from './ports'

/**
 * The same tests against a production build (`vite build`, served by
 * e2e/serve-dist.py), for what only the built bundle shows: CSS code-splitting and
 * chunk order. Build first into ../dist-prod-check:
 *
 *   E2E=1 npx vite build --outDir ../dist-prod-check --emptyOutDir
 *   E2E_PORT=8091 npx playwright test -c e2e/playwright.prod.config.ts library/styles
 *
 * (The build ends with an error from the PWA plugin, which expects ./dist;
 * the bundle itself is complete. e2e/serve-dist.py serves it.)
 */
export default {
  ...base,
  // 127.0.0.1, not localhost: Node resolves localhost to ::1, where serve-dist.py doesn't listen.
  use: { ...base.use, baseURL: `http://127.0.0.1:${VITE_PORT}` },
  webServer: [
    {
      command: `${process.env.PYTHON || 'python'} e2e/mock/moonraker.py ${MOCK_PORT}`,
      port: MOCK_PORT,
      cwd: '..',
      reuseExistingServer: true,
      timeout: 60_000
    },
    {
      command: `${process.env.PYTHON || 'python'} e2e/serve-dist.py ../dist-prod-check ${VITE_PORT}`,
      port: VITE_PORT,
      cwd: '..',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
}
