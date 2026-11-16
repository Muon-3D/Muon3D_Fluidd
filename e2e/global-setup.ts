/**
 * Warm vite before any test: its first page compiles every module, which can
 * take minutes on a cold cache, and would otherwise land on whichever test
 * runs first. Loads Control once, until the splash is gone.
 */
import { chromium, type FullConfig } from '@playwright/test'
import { serveModels, modelService } from './fakes/models'
import { serveConsole, consoleState, useConsole } from './fakes/console'
import { MOCK_PORT } from './ports'

export default async function globalSetup (config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    await serveModels(page, modelService())
    await serveConsole(page, consoleState())
    await useConsole(page)
    await page.route('**/config.json', async route => {
      const response = await route.fetch()
      const config = await response.json()
      config.blacklist = ['localhost', '127.0.0.1']
      config.endpoints = [`http://localhost:${MOCK_PORT}`]
      await route.fulfill({ response, json: config })
    })
    await page.goto(`${baseURL}/boxwood-367a/library?view=discover`, { timeout: 240_000 })
    await page.locator('#muon-loader').waitFor({ state: 'detached', timeout: 240_000 })
    await page.locator('[data-tid="muon-library"]').waitFor({ timeout: 240_000 })
  } catch (error) {
    throw new Error(`e2e warm-up: Control didn't come up at ${baseURL} within 4 minutes (is vite or the mock printer failing?): ${String(error)}`)
  } finally {
    await browser.close()
  }
}
