/**
 * /setup on the printer's hotspot (v3 setup storyboard): the step list or
 * dots, one step card, and the footer with one primary. The fake muon_setup
 * in ./setup-printer.ts owns the step order; the page only draws it.
 */
import type { Page } from '@playwright/test'
import { expect, ready, test } from '../fixtures'
import { setupPrinter, WRONG_PASSWORD } from './setup-printer'

const card = (page: Page) => page.locator('.setup-step')
const title = (page: Page) => card(page).locator('h1')

async function startSetup (page: Page) {
  const printer = await setupPrinter(page)
  await page.goto('/setup')
  await ready(page)
  await expect(title(page)).toHaveText('Set up Walnut · 8987')
  await page.getByTestId('setup-start').click()
  await expect(title(page)).toHaveText('Choose Wi-Fi')
  return printer
}

async function joinHome (page: Page, password: string) {
  await page.getByTestId('wifi-HomeWiFi').click()
  await page.getByTestId('wifi-password').fill(password)
  await page.getByTestId('wifi-connect').click()
}

test('a new printer goes from Welcome to Finish, one step card at a time', async ({ page }, info) => {
  const printer = await startSetup(page)
  const phone = info.project.name === 'phone'
  // A list beside the card on a desktop; dots above it on a phone.
  await expect(page.getByTestId('step-network')).toBeVisible({ visible: !phone })
  await expect(page.getByTestId('step-dots')).toBeVisible({ visible: phone })
  await expect(page.getByTestId('step-eyebrow')).toHaveText('Step 2 of 7')
  expect(printer.posts.map(p => p.path)).toEqual(['clock', 'language', 'driver'])

  await joinHome(page, 'correct horse battery staple')
  await expect(page.getByTestId('join-done')).toHaveText('Walnut is on HomeWiFi')
  await page.getByTestId('join-continue').click()

  await expect(title(page)).toHaveText('Name your printer')
  await page.getByTestId('name-field').fill('Workshop')
  await page.getByTestId('name-save').click()

  await expect(title(page)).toHaveText('Update available')
  await page.getByTestId('update-later').click()

  await expect(title(page)).toHaveText('Your account')
  await page.getByTestId('remote-skip').click()

  await expect(title(page)).toHaveText('First calibration')
  // Required items happen at the printer; only the optional one can be skipped here.
  await expect(page.getByTestId('ready-skip-self_test')).toHaveCount(0)
  await page.getByTestId('ready-skip-load_filament').click()

  printer.finishAtPanel()
  await expect(title(page)).toHaveText('Workshop is set up', { timeout: 10_000 })
  await expect(page.getByRole('link', { name: /Open/ })).toBeVisible()

  expect(printer.posts.map(p => [p.path, p.body])).toEqual(expect.arrayContaining([
    ['network', expect.objectContaining({ kind: 'wifi', ssid: 'HomeWiFi', psk: 'correct horse battery staple' })],
    ['name', expect.objectContaining({ name: 'Workshop' })],
    ['update', expect.objectContaining({ action: 'later' })],
    ['remote', expect.objectContaining({ mode: 'later' })],
    ['ready', expect.objectContaining({ action: 'skip', item: 'load_filament' })]
  ]))
  // Never the hotspot teardown: Wi-Fi goes through muon_setup's /network only.
  expect(printer.posts.some(p => p.path.includes('wifi'))).toBe(false)
})

test('after a restart mid-setup the page says Carry on, and what is done stays done', async ({ page }, info) => {
  const printer = await startSetup(page)
  await joinHome(page, 'correct horse battery staple')
  await page.getByTestId('join-continue').click()
  // The printer restarts: the driver claim is gone and rev starts again; done steps stay done.
  printer.state.driver = null
  printer.state.rev = 1
  printer.posts.length = 0
  await page.reload()
  await ready(page)
  await expect(title(page)).toHaveText('Carry on setting up Walnut · 8987')
  await expect(card(page)).toContainText('kept what is already done.')
  await expect(page.getByTestId('setup-part-done')).toHaveCount(1)
  await page.screenshot({ path: info.outputPath(`setup-carry-on-${info.project.name}.png`) })
  await page.getByTestId('setup-start').click()
  await expect(title(page)).not.toHaveText(/Carry on setting up/)
  expect(printer.posts.map(p => p.path)).toEqual(['clock', 'driver'])
})

test('a wrong password says so, and Try again reopens the same network', async ({ page }) => {
  await startSetup(page)
  await joinHome(page, WRONG_PASSWORD)
  await expect(title(page)).toHaveText("Wi-Fi didn't connect")
  await expect(page.getByTestId('join-error')).toHaveText("HomeWiFi didn't accept that password.")
  await page.getByTestId('join-retry').click()
  await expect(title(page)).toHaveText('Choose Wi-Fi')
  await expect(page.getByTestId('wifi-password')).toHaveValue('')
})

test('a short password is refused before anything is sent', async ({ page }) => {
  const printer = await startSetup(page)
  await joinHome(page, 'short')
  await expect(card(page)).toContainText('8 to 63 characters')
  expect(printer.posts.filter(p => p.path === 'network')).toEqual([])
})

test('no Wi-Fi in range says so, and Skip asks first', async ({ page }) => {
  const printer = await setupPrinter(page, { networks: { ok: true, scanned_at: 1, ethernet: { present: true, carrier: false, address: null }, networks: [] } })
  await page.goto('/setup')
  await ready(page)
  await page.getByTestId('setup-start').click()
  await expect(page.getByTestId('wifi-none')).toContainText("can't see any Wi-Fi networks")
  await expect(page.getByTestId('wifi-connect')).toBeDisabled()
  await page.getByTestId('wifi-skip').click()
  await expect(page.getByTestId('wifi-skip-confirm')).toContainText('will stay offline')
  await page.getByTestId('wifi-skip-yes').click()
  await expect(title(page)).toHaveText('Name your printer')
  expect(printer.posts.find(p => p.path === 'skip')?.body).toMatchObject({ step: 'network' })
  // Back from Name goes to the skipped Wi-Fi step, through the printer's goto.
  await page.getByTestId('setup-back').click()
  await expect(title(page)).toHaveText('Choose Wi-Fi')
  expect(printer.posts.at(-1)).toMatchObject({ path: 'goto', body: { step: 'network' } })
})

test('the account step shows the link code, and Back cancels it', async ({ page }) => {
  const printer = await startSetup(page)
  await joinHome(page, 'correct horse battery staple')
  await page.getByTestId('join-continue').click()
  await page.getByTestId('name-save').click()
  await page.getByTestId('update-later').click()
  await page.getByTestId('remote-continue').click()
  await expect(page.getByTestId('link-code')).toHaveText('482913')
  await page.getByTestId('link-cancel').click()
  await expect(title(page)).toHaveText('Your account')
  expect(printer.posts.map(p => p.path).slice(-2)).toEqual(['remote', 'remote/cancel'])
})

test("while the printer's screen is in charge, the page follows it", async ({ page }) => {
  const printer = await setupPrinter(page)
  printer.state.driver = { kind: 'panel', client_id: 'panel', since: 1, renewed: 1, lapsed: false }
  await page.goto('/setup')
  await ready(page)
  await expect(title(page)).toHaveText("Carry on at Walnut's screen")
  expect(printer.posts).toEqual([])
})

test('a printer that is away shows the connecting card, with no footer', async ({ page }) => {
  await page.route('**/websocket*', route => route.abort())
  await page.route('**/server/muon/setup**', route => route.abort())
  await page.goto('/setup')
  await ready(page)
  await expect(page.getByTestId('setup-connecting')).toBeVisible()
  await expect(card(page).locator('footer')).toHaveCount(0)
})
