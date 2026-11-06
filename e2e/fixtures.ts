/**
 * The e2e test, with what every page test needs:
 * - `models`: the fake model service's state for this test, already served;
 * - `account`: the fake console's state (the Muon3D account service), already served;
 * - `signedIn`: an option, false by default. `test.use({ signedIn: true })`
 *   starts the test with a stored session for the console's account;
 * - `open(path)`: Control at that page under the mock printer, loaded and
 *   past the splash.
 *
 *   test('…', async ({ page, models, open }) => { await open('/library?view=discover') })
 */
import { test as base, expect, type Page } from '@playwright/test'
import { modelService, serveModels, type ModelServiceState } from './fakes/models'
import { consoleState, serveConsole, signIn, useConsole, type ConsoleState } from './fakes/console'
import { MOCK_PORT } from './ports'

/** The mock printer's page prefix: Control puts a printer's pages under its name. */
export const PRINTER = '/boxwood-367a'

interface Options {
  signedIn: boolean;
}

interface Fixtures {
  printerAddress: void;
  models: ModelServiceState;
  account: ConsoleState;
  open: (path: string) => Promise<void>;
}

export const test = base.extend<Options & Fixtures>({
  signedIn: [false, { option: true }],
  models: [async ({ page }, use) => {
    const state = modelService()
    await serveModels(page, state)
    await use(state)
  }, { auto: true }],
  // Control finds its printer from config.json: point it at this run's mock
  // only (localhost blacklisted, so it doesn't also probe :7125, where another
  // run's mock may be).
  printerAddress: [async ({ page }, use) => {
    await page.route('**/config.json', async route => {
      const response = await route.fetch()
      const config = await response.json()
      config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
      config.endpoints = [`http://localhost:${MOCK_PORT}`]
      await route.fulfill({ response, json: config })
    })
    await use()
  }, { auto: true }],
  account: [async ({ page, signedIn }, use) => {
    const state = consoleState()
    await serveConsole(page, state)
    await useConsole(page)
    if (signedIn) await signIn(page)
    await use(state)
  }, { auto: true }],
  open: async ({ page }, use) => {
    await use(async (path: string) => {
      const printerPage = path.startsWith('/') && !path.startsWith(PRINTER) && !path.startsWith('/print')
      await page.goto(printerPage ? `${PRINTER}${path}` : path)
      await ready(page)
    })
  }
})

/** Past index.html's splash, with Control drawn. */
export async function ready (page: Page) {
  await expect(page.locator('.v-application')).toBeVisible({ timeout: 60_000 })
  // index.html's loader (#muon-loader) goes once the first route is drawn.
  await expect(page.locator('#muon-loader')).toHaveCount(0, { timeout: 60_000 })
}

export { expect }
