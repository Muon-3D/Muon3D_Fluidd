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
import { cacheModules } from './module-cache'

/** The mock printer's page prefix: Control puts a printer's pages under its name. */
export const PRINTER = '/boxwood-367a'

interface Options {
  /**
   * Whether the page can draw WebGL. Off by default: with it on, every page that shows the overview or the G-code
   * preview draws the M1 model or the toolpath, and on a CI runner (software GL, two cores, two workers) that keeps
   * the main thread and both cores busy for seconds, so the app shell takes over 60 s to mount, and the page the
   * OTHER worker is loading starves too (KAN-2781). Control then draws its fallback, as in a browser without
   * WebGL. Specs that are about the 3D model, the stage or the toolpath ask for it with `test.use({ webgl: true })`.
   */
  webgl: boolean;
  signedIn: boolean;
  printerHosted: boolean;
}

interface Fixtures {
  printerAddress: void;
  cpuThrottle: void;
  noWebgl: void;
  moduleCache: void;
  models: ModelServiceState;
  account: ConsoleState;
  open: (path: string) => Promise<void>;
}

export const test = base.extend<Options & Fixtures>({
  webgl: [!!process.env.E2E_WEBGL, { option: true }],
  signedIn: [false, { option: true }],
  // E2E_THROTTLE=4: run every page at 1/4 CPU speed (CDP), to reproduce a slow
  // CI runner locally. Off by default.
  cpuThrottle: [async ({ page }, use) => {
    const rate = Number(process.env.E2E_THROTTLE || 1)
    if (rate > 1) {
      const client = await page.context().newCDPSession(page)
      await client.send('Emulation.setCPUThrottlingRate', { rate })
    }
    await use()
  }, { auto: true }],
  printerHosted: [false, { option: true }],
  models: [async ({ page }, use) => {
    const state = modelService()
    await serveModels(page, state)
    await use(state)
  }, { auto: true }],
  // Control finds its printer from config.json: point it at this run's mock
  // only (localhost blacklisted, so it doesn't also probe :7125, where another
  // run's mock may be).
  moduleCache: [async ({ context, baseURL }, use) => {
    if (!process.env.E2E_NO_MODULE_CACHE) await cacheModules(context, new URL(baseURL!).origin)
    await use()
  }, { auto: true }],
  noWebgl: [async ({ page, webgl }, use) => {
    if (!webgl) {
      await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          return /webgl/i.test(type) ? null : getContext.call(this, type, ...rest)
        } as typeof HTMLCanvasElement.prototype.getContext
      })
    }
    await use()
  }, { auto: true }],
  printerAddress: [async ({ page, printerHosted }, use) => {
    await page.route('**/config.json', async route => {
      const response = await route.fetch()
      const config = await response.json()
      config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
      config.endpoints = [`http://localhost:${MOCK_PORT}`]
      // Only the printer-hosted Library tests change how Control is served;
      // every other test keeps the served config (hosted: false, localhost
      // blacklisted), which start-up depends on (src/init.ts).
      if (printerHosted) {
        config.hosted = false
        config.blacklist = config.blacklist.filter((host: string) => host !== 'localhost')
      }
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
