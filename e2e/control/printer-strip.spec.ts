import { test, expect } from '../fixtures'
import { PRESETS, usePrinter } from './printer'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { CONSOLE } from '../fakes/console'

const fake = async (page: import('@playwright/test').Page, method: string, arg?: number) => page.evaluate(async ([method, arg]) => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'printerStrip.ts'].join('/'))
  await m[method](arg)
}, [method, arg] as const)

test('current pill and +N expose only the rest, including shared and found printers', async ({ page, open }, info) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false, database: true })
  await foundPrinter(page)
  await open('/control')
  await fake(page, 'seedStrip')
  await page.getByTestId('toast-close').first().click({ timeout: 500 }).catch(() => {})
  const strip = page.getByTestId('printer-strip')
  await expect(strip.getByTestId('printer-switch')).toHaveAttribute('aria-current', 'page')
  const visible = strip.getByTestId('strip-printer')
  const shown = await visible.count()
  const names = await visible.evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label')!.split(',')[0].replace(/^Open /, '')))
  await expect(strip.getByTestId('strip-overflow')).toHaveText(`+${9 - shown}`)
  await expect(strip.getByRole('button', { name: /Open Found printer/ })).toHaveCount(0)
  if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2233-strip-${info.project.name}.png` })
  await strip.getByTestId('strip-overflow').click()
  const menu = page.locator('.printer-strip__menu:visible')
  await expect(menu.getByText('Shared with you', { exact: true })).toBeVisible()
  await expect(menu.getByText('Found on this network', { exact: true })).toBeVisible()
  for (const name of names) await expect(menu.locator('.muon-card__name').filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(0)
  await expect(menu.locator('.muon-card')).toHaveCount(9 - shown)
  if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2233-overflow-${info.project.name}.png` })
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(strip.getByTestId('strip-overflow')).toBeFocused()
  const bounds = await strip.boundingBox()
  const stop = await page.getByTestId('estop').boundingBox()
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(stop!.x)
  expect(printer.gcode).toEqual([])
})

test('state colours match both schemes, labels remain readable, and foreign printers are square', async ({ page, open, isMobile }, info) => {
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false, database: true })
  await foundPrinter(page)
  await open('/control')
  const states = ['printing', 'ready', 'heating', 'paused', 'fault', 'asleep', 'new']
  const colors = [['rgb(128, 214, 209)', 'rgb(48, 209, 88)', 'rgb(255, 146, 48)', 'rgb(255, 146, 48)', 'rgb(255, 66, 69)', 'rgb(99, 99, 102)', 'rgb(152, 152, 157)'], ['rgb(43, 127, 121)', 'rgb(0, 137, 50)', 'rgb(201, 52, 0)', 'rgb(201, 52, 0)', 'rgb(215, 0, 21)', 'rgb(174, 174, 178)', 'rgb(110, 110, 115)']]
  for (let theme = 0; theme < 2; theme++) {
    if (theme) await fake(page, 'lightTheme')
    for (let i = 0; i < states.length; i++) {
      await fake(page, 'seedStrip')
      await fake(page, 'onlyState', i)
      if (isMobile && !await page.locator('.printer-strip__menu:visible').count()) await page.getByTestId('strip-overflow').click()
      const screen = isMobile ? page.locator('.printer-strip__menu:visible .muon-card').first().locator('.printer-screen') : page.getByTestId('strip-printer').locator('.printer-screen')
      await expect(screen).toHaveAttribute('data-state', states[i])
      await expect(screen).toHaveCSS('color', colors[theme][i])
      await expect(screen).toHaveCSS('border-radius', '50%')
      await expect(screen).toHaveAttribute('aria-label', /.+/)
    }
    await fake(page, 'addForeign')
    const foreign = isMobile ? page.locator('.printer-strip__menu:visible .muon-card').first().locator('.printer-screen') : page.getByTestId('strip-printer').locator('.printer-screen')
    await expect(foreign).toHaveCSS('border-radius', '11px')
    if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2233-${theme ? 'light' : 'dark'}-${info.project.name}.png` })
  }
})

async function foundPrinter (page: import('@playwright/test').Page) {
  await page.route('http://192.0.2.11/**', route => route.fulfill({ json: route.request().url().includes('/server/muon/identity')
    ? { name: 'Found printer', display: 'Found printer', endpoint_id: 'found-strip' }
    : route.request().url().includes('/server/muon/link') ? { phase: 'unlinked' } : { result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } } } } }))
}

test.describe('switching', () => {
  test.use({ signedIn: true })
  test('a round-screen pick opens the printer through the existing route', async ({ page, account, open, isMobile }) => {
    await useAllRoutes(page, account)
    const p = { ...account.printers[0], id: '5a1ce0de'.repeat(8), name: 'Sloe 8f21' }
    account.printers.push(p)
    let selected = false
    await page.route(`${CONSOLE}/v1/printers/${p.id}/access`, route => {
      selected = true
      return route.fulfill({ json: { printer_id: p.id, relay_url: 'https://relay.e2e.test', role: 'operator', grant_id: 'e2e-grant', expires_at: Math.floor(Date.now() / 1000) + 3600 } })
    })
    await page.route('**/server/muon/identity', route => route.fulfill({ json: { name: selected ? 'Sloe' : 'Boxwood', display: selected ? p.name : ROUTE_PRINTER.name, derived_name: selected ? 'sloe' : 'boxwood', suffix: selected ? '8f21' : '367a', endpoint_id: selected ? p.id : ROUTE_PRINTER.id } }))
    await open('/control')
    if (isMobile) await page.getByTestId('strip-overflow').click()
    const pick = isMobile ? page.locator('.printer-strip__menu:visible .muon-card').filter({ hasText: 'Sloe' }) : page.getByRole('button', { name: /^Open Sloe/ })
    await expect(pick).toBeVisible()
    await pick.click()
    await expect(page).toHaveURL(/\/sloe-8f21/)
    await expect(page.getByTestId('printer-switch')).toHaveAttribute('aria-current', 'page')
  })
})
