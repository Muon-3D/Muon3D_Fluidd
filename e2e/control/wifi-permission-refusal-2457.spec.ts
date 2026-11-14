/**
 * KAN-2457: a Wi-Fi or hotspot action the printer's permission store refuses
 * says who may do it (and offers Sign in), not "Do this at the printer's
 * screen". The join dialog shows real words, not locale keys.
 *
 * The mock answers the Aux API's POSTs with the store's own 403 shape, laid
 * per test with page.route; nothing here changes the shared mock.
 */
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const RESTRICTED = (knob: string, required = 'owner_and_shared') => ({
  detail: { code: 'permission_restricted', knob, required, allowed: ['owner', 'shared'], message: 'This caller is not allowed to change this.' }
})
const SHARED_TEXT = "Only this printer's owner and the people it's shared with can do this, and this browser isn't signed in as one of them."
const PANEL_TEXT = "Do this at the printer's screen"

type Page = import('@playwright/test').Page

async function expectRefusal (page: Page, text = SHARED_TEXT) {
  const notice = page.getByTestId('permission-refusal').first()
  await expect(notice).toBeVisible()
  await expect(notice.getByTestId('permission-refusal-text')).toHaveText(text)
  await expect(notice.getByTestId('permission-refusal-sign-in')).toBeVisible()
  await expect(notice.getByTestId('permission-refusal-detail')).toHaveText('This caller is not allowed to change this.')
  await expect(notice.getByTestId('permission-refusal-instead')).toContainText('over Bluetooth')
  await expect(notice.getByTestId('permission-refusal-instead')).toContainText('through Muon3D')
  // The old wrong reason is gone: not "this printer only lets its own screen ...".
  await expect(page.getByText(PANEL_TEXT, { exact: false })).toHaveCount(0)
  await expect(page.getByText('only lets its own screen', { exact: false })).toHaveCount(0)
}

test.describe('a permission refusal on the Wi-Fi page (KAN-2457)', () => {
  test('hotspot on: says who may, offers Sign in, never "at the printer\'s screen"', async ({ page, open }, testInfo) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/up', route => route.fulfill({ status: 403, json: RESTRICTED('hotspot_toggle') }))
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toHaveText('Off')
    await page.getByTestId('hotspot-switch').click()
    await expectRefusal(page)
    // It is not a panel-only printer: the switch is still there to try again.
    await expect(page.getByTestId('hotspot-switch')).toBeVisible()
    // SHOT_DIR is set only when taking the pictures for a ticket.
    await page.getByTestId('permission-refusal').first().evaluate(el => el.scrollIntoView({ block: 'center' }))
    if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/KAN2457-${testInfo.project.name}.png` })
  })

  test('disconnect: says who may (owner only), and the Disconnect button stays', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/disconnect', route => route.fulfill({ status: 403, json: RESTRICTED('wifi_change', 'owner') }))
    await open('/wifi')
    await page.getByTestId('wifi-connected').getByTestId('wifi-disconnect').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expectRefusal(page, "Only this printer's owner can do this.")
    await expect(page.getByTestId('wifi-disconnect')).toBeVisible()
    await expect(page.getByTestId('wifi-disconnect-panel')).toHaveCount(0)
  })

  test('join a new network: the password dialog has real words, and a refusal says who may', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/show**', route => route.fulfill({ status: 404, json: { detail: 'not saved' } }))
    await page.route('**/server/aux/wifi/connect', route => route.fulfill({ status: 403, json: RESTRICTED('wifi_change') }))
    await open('/wifi')
    await page.getByTestId('wifi-networks').locator('[data-ssid="Office"]').getByRole('button', { name: 'Connect' }).click()
    await page.getByTestId('wifi-proceed').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Password for Office' })).toBeVisible()
    await expect(dialog.getByTestId('wifi-connect')).toHaveText('Connect')
    await expect(page.getByText('app.general', { exact: false })).toHaveCount(0)
    await dialog.getByTestId('wifi-connect').click()
    await expectRefusal(page)
  })

  test('hotspot change: says who may', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/modify', route => route.fulfill({ status: 403, json: RESTRICTED('hotspot_change') }))
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toBeVisible()
    await page.getByTestId('hotspot-edit').click()
    await page.getByTestId('hotspot-card').locator('input[type=password]').fill('a-new-passphrase')
    await page.getByTestId('hotspot-apply').click()
    const proceed = page.getByRole('dialog').getByRole('button', { name: /proceed/i })
    if (await proceed.isVisible().catch(() => false)) await proceed.click()
    await expectRefusal(page)
  })
})
