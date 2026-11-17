import { defineConfig } from '@playwright/test'
import base from './playwright.config'
import { VITE_PORT } from './ports'

const controlDist = process.env.REAL_CONTROL_DIST

export default defineConfig({
  ...base,
  ...(controlDist
    ? {
        use: { ...base.use, baseURL: `http://127.0.0.1:${VITE_PORT}` },
        webServer: {
          command: `${process.env.PYTHON || 'python'} e2e/serve-dist.py "${controlDist}" ${VITE_PORT}`,
          port: VITE_PORT,
          cwd: '..',
          reuseExistingServer: false,
          timeout: 120_000
        }
      }
    : {}),
  testDir: './real-slicer',
  testMatch: '**/*.local.ts',
  workers: 1,
  globalSetup: undefined,
  timeout: 180_000,
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 900 }, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } }]
})
