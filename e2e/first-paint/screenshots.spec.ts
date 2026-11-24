/**
 * Screenshots of first paint, light and dark, mid-print and finished. Not a
 * test of anything: it runs only when SHOTS_DIR names where to put them:
 *
 *   SHOTS_DIR=/some/dir npm run test:e2e:first-paint -- screenshots
 */
import path from 'node:path'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, PRESETS } from '../control/printer'

const DIR = process.env.SHOTS_DIR
test.skip(!DIR, 'set SHOTS_DIR to take the screenshots')

for (const theme of ['dark', 'light'] as const) {
  test(`first paint, ${theme}: mid-print and finished`, async ({ page }, info) => {
    await page.addInitScript(t => { try { localStorage.setItem('muon3d.theme', t) } catch {} }, theme)
    const printer = await usePrinter(page, PRESETS.idleHomed())
    // Klipper is still starting: the rim holds at half and the splash stays for the shots.
    printer.state.results['server.info'] = { klippy_state: 'startup' }
    await page.goto(PRINTER)
    const box = page.locator('[data-tid=first-paint]')
    await expect(box).toHaveAttribute('data-logo', /printing|done/, { timeout: 30_000 })
    const name = (what: string) => path.join(DIR!, `${info.project.name}-${theme}-${what}.png`)
    // About two seconds into the print of the wordmark.
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement>('[data-tid=first-paint]')
      return !!el && el.dataset.logo === 'printing'
    })
    await page.waitForTimeout(1700)
    await page.screenshot({ path: name('mid-print') })
    await expect(box).toHaveAttribute('data-logo', 'done', { timeout: 20_000 })
    await page.waitForTimeout(300)
    await page.screenshot({ path: name('finished') })
  })
}
