import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testDir: './real-slicer',
  testMatch: '**/*.local.ts',
  workers: 1,
  globalSetup: undefined,
  timeout: 180_000,
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 900 }, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } }]
})
