import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { setupPrinter } from './setup-printer'
import { usePrinter } from './printer'

async function screenshot (page: Page, name: string, mobile: boolean) {
  if (!process.env.E2E_SCREENSHOT_DIR) return
  await expect(page.getByTestId('toast-close')).toHaveCount(0, { timeout: 10_000 })
  await page.locator('.v-dialog--active').evaluateAll(elements => Promise.all(elements
    .flatMap(el => el.getAnimations({ subtree: true }))
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => null))))
  await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2250-${name}-${mobile ? 'phone' : 'desktop'}.png`, fullPage: true })
}

async function openSheet (page: Page) {
  await page.goto('/')
  await ready(page)
  await expect(page.getByTestId('add-new-printer')).toHaveCount(0)
  await page.getByTestId('add-printer').click()
  await expect(page.getByTestId('add-printer-sheet')).toBeVisible()
}

test('new printer path opens the existing setup and advances to Wi-Fi without a second sheet', async ({ page, isMobile }) => {
  await setupPrinter(page)
  await openSheet(page)
  await expect(page.getByTestId('add-new-printer')).toHaveAttribute('href', '/setup')
  await expect(page.getByTestId('add-existing-printer')).toHaveAttribute('href', '/link')
  await expect(page.getByTestId('add-printer-sheet')).toContainText("Join the new printer's Muon- Wi-Fi first")
  await screenshot(page, 'add', isMobile)
  await page.getByTestId('add-printer-sheet').getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByTestId('add-new-printer')).toHaveCount(0)
  await expect(page.getByTestId('add-existing-printer')).toHaveCount(0)
  await page.getByTestId('add-printer').click()
  await expect(page.getByTestId('add-new-printer')).toHaveCount(1)
  await page.getByTestId('add-new-printer').click()
  await expect(page).toHaveURL(/\/setup$/)
  await expect(page.locator('.setup-step h1')).toHaveText('Set up Walnut · 8987')
  await expect(page.getByTestId('add-printer-sheet')).toHaveCount(0)
  await page.getByTestId('setup-start').click()
  await expect(page.locator('.setup-step h1')).toHaveText('Choose Wi-Fi')
  await screenshot(page, 'setup', isMobile)
})

test('existing printer path signed out opens the existing sign-in gate, not a second printer list', async ({ page }) => {
  await openSheet(page)
  await page.getByTestId('add-existing-printer').click()
  await expect(page).toHaveURL(/\/link$/)
  await expect(page.getByTestId('add-printer-sheet')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toContainText('Sign in')
  await expect(page.getByRole('dialog')).not.toContainText('Link a printer to your account')
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  for (const valid of [true, false]) {
    test(`existing code path preserves ${valid ? 'confirmation on the printer' : 'an invalid-code error without printing'}`, async ({ page, isMobile }) => {
      const claims: unknown[] = []
      let linked = false
      await page.route(`${CONSOLE}/v1/links/claim`, async route => {
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
        claims.push(route.request().postDataJSON())
        await route.fulfill({ status: valid ? 200 : 400, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(valid ? { printer_id: 'hazel-41c2', name: 'Hazel' } : { error: 'This code has expired.' }) })
      })
      await page.route(`${CONSOLE}/v1/links/hazel-41c2`, route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ state: linked ? 'linked' : 'pending' }) }))
      await openSheet(page)
      await page.getByTestId('add-existing-printer').click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText('Link a printer to your account')
      await expect(page.getByTestId('add-printer-sheet')).toHaveCount(0)
      if (valid) await screenshot(page, 'link', isMobile)
      const digits = dialog.locator('.v-otp-input input')
      await expect(digits).toHaveCount(6)
      await expect(dialog.getByRole('button', { name: 'Link', exact: true })).toBeDisabled()
      for (let i = 0; i < 6; i++) await digits.nth(i).fill(String(i + 1))
      await expect.poll(() => claims.length).toBe(1)
      if (valid) {
        await expect(dialog).toContainText('Confirm on the printer')
        linked = true
        await expect(dialog).toContainText('Hazel is linked', { timeout: 15_000 })
      } else {
        await expect(dialog).toContainText('This code has expired.')
        await expect(dialog).toContainText('Link a printer to your account')
      }
      expect(claims).toEqual([{ code: '123456' }])
    })
  }

  test('Grid and List show unique unowned network rows, local Open and safe link/request actions without physical controls', async ({ page, isMobile }) => {
    const printer = await usePrinter(page)
    const hosts = ['192.168.77.5', '192.168.77.6']
    const names = ['Hazel', 'Larch']
    const requests: string[] = []
    await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: names.map((name, i) => ({ printer_id: `${name.toLowerCase()}-41c2`, name: `muon-${name.toLowerCase()}-41c2`, model: 'M1', linked: i === 1, local_addrs: [hosts[i]] })) }) }))
    for (let i = 0; i < hosts.length; i++) {
      await page.route(`http://${hosts[i]}/**`, route => {
        const path = new URL(route.request().url()).pathname
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
        requests.push(path)
        const name = names[i].toLowerCase()
        const body = path === '/server/muon/identity'
          ? { name: `muon-${name}-41c2`, display: `muon-${name}-41c2`, endpoint_id: `${name}-41c2`, derived_name: name, suffix: '41c2' }
          : i === 1 && path === '/server/muon/link'
            ? { result: { phase: 'linked', account: 'another@example.com' } }
            : { result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'printing', filename: 'Sample.gcode' }, virtual_sdcard: { progress: 0.4 } } } }
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) })
      })
    }
    await page.goto('/')
    await ready(page)
    const found = page.getByTestId('found')
    for (const view of ['grid', 'list', 'grid']) {
      await page.getByTestId(`view-${view}`).click()
      await expect(found).toHaveCount(1)
      await expect(page.getByTestId('found-ownership')).toHaveCount(2)
      await expect(found).toContainText('Not in your account or shared with you')
      await expect(found.getByTestId('found-connect')).toHaveCount(2)
      await expect(found.getByTestId('found-link')).toHaveCount(1)
      await expect(found.getByTestId('found-ask')).toHaveCount(1)
      await expect(found.getByRole('button', { name: /^(Pause|Resume|Stop(?: print)?|Cancel print|Start print)$/i })).toHaveCount(0)
      await expect(page.getByTestId('found-list')).toHaveCount(1)
      if (isMobile) {
        const copy = await found.getByTestId('found-ownership').first().boundingBox()
        expect(copy!.width).toBeGreaterThan(page.viewportSize()!.width * 0.6)
      }
      await screenshot(page, view, isMobile)
    }
    if (process.env.E2E_SCREENSHOT_DIR) {
      await found.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2250-found-${isMobile ? 'phone' : 'desktop'}.png` })
    }
    expect(requests.some(path => /\/printer\/(print|gcode)/.test(path))).toBe(false)
    for (const method of ['printer.print.pause', 'printer.print.resume', 'printer.print.cancel']) expect(printer.called(method)).toHaveLength(0)
    await found.getByTestId('found-ask').click()
    await expect(page.getByTestId('access-code').or(page.getByTestId('access-outcome'))).toBeVisible()
  })
})
