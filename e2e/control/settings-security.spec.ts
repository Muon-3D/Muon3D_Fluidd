/**
 * Settings › Security (KAN-1926, brief control-settings-1109): one row per
 * setting the printer reports, which the owner can restrict and everyone
 * else sees read-only with why. The printer's answers are faked per test
 * with page.route, so the shared mock never changes.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']
const NOT_MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization']

const reported = () => [
  { id: 'hotspot_toggle', value: 'anyone' },
  { id: 'hotspot_change', value: 'owner' },
  { id: 'wifi_change', value: 'owner' },
  { id: 'update_install', value: 'anyone' },
  { id: 'new_device_requests', value: 'owner' },
  { id: 'hotspot_password_on_screen', value: 'anyone' },
  { id: 'lockdown', value: 'owner_at_printer' },
  { id: 'usb_print', label: 'Print from a USB stick', description: 'A stick in the front port starts a print.', value: 'anyone', values: ['anyone', 'owner'] },
  { id: 'remote_print', label: 'Print from Muon3D', value: 'owner_or_admin' },
  // The printer leaves out read_only: developer mode is still only at its screen.
  { id: 'dev_mode', value: 'owner_at_printer', values: ['owner_at_printer'] }
]

/** The printer says whether this browser may manage access, and keeps its settings for this test across reloads. */
async function printerWith (page: Page, owner: boolean, refuse?: { status: number, json: unknown }, bare = false) {
  await usePrinter(page, {}, { components: MUON })
  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/`), route => {
    const name = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    if (name === 'capabilities') return route.fulfill({ json: { result: { actions: { protection: owner ? 'allowed' : 'refused' } } } })
    return route.fulfill({ status: 404, json: { error: { code: 404, message: 'Not Found' } } })
  })
  const knobs = reported()
  const posts: unknown[] = []
  let reads = 0
  await page.route('**/server/aux/permissions', route => {
    if (route.request().method() !== 'POST') {
      reads++
      return route.fulfill({ json: { knobs } })
    }
    const body = route.request().postDataJSON()
    posts.push(body)
    if (refuse) return route.fulfill(refuse)
    const knob = knobs.find(k => k.id === body.id)
    if (knob) knob.value = body.value
    return bare ? route.fulfill({ status: 200, json: {} }) : route.fulfill({ json: { knob } })
  })
  return { posts, reads: () => reads }
}

const row = (page: Page, id: string) => page.locator(`[data-tid="security-row"][data-knob="${id}"]`)

test('one row per setting the printer reports, in its order, an unknown one as the printer names it', async ({ page, open }) => {
  await printerWith(page, true)
  await open('/settings#security')
  await expect(page.getByTestId('security-row')).toHaveCount(10)
  await expect(page.getByTestId('security-label')).toHaveText([
    'Turn the hotspot on or off', "Change the hotspot's name or password", 'Join or forget Wi-Fi networks', 'Install updates',
    'Accept requests from new devices', "Show the hotspot password on the printer's screen", 'Lockdown', 'Print from a USB stick', 'Print from Muon3D', 'Turn on developer mode'
  ])
  // A value Control doesn't know is still a row, shown as the printer reports it.
  await expect(row(page, 'remote_print').getByRole('combobox')).toHaveCount(0)
  await expect(row(page, 'remote_print').getByTestId('locked-row-label')).toHaveText('Owner or admin')
  await expect(row(page, 'remote_print').getByTestId('locked-row')).toContainText('Shown as the printer reports it.')
  await expect(row(page, 'usb_print')).toContainText('A stick in the front port starts a print.')
  await expect(row(page, 'usb_print').getByRole('combobox').locator('option')).toHaveText(['Anyone', 'Owner'])
  await expect(row(page, 'lockdown').getByRole('combobox').locator('option')).toHaveText(['Anyone', 'Owner', 'Owner, at the printer'])
  await expect(row(page, 'dev_mode').getByRole('combobox')).toHaveCount(0)
  await expect(row(page, 'dev_mode').getByTestId('locked-row')).toContainText("Changed only at the printer's screen.")
})

test('the owner restricts a setting to Owner, and it stays so after a reload', async ({ page, open }) => {
  const { posts } = await printerWith(page, true)
  await open('/settings#security')
  const select = page.getByRole('combobox', { name: 'Turn the hotspot on or off' })
  await expect(select).toHaveValue('anyone')
  await select.selectOption('owner')
  await expect.poll(() => posts).toEqual([{ id: 'hotspot_toggle', value: 'owner' }])
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Turn the hotspot on or off' })).toHaveValue('owner')
})

test('someone the printer does not let manage access sees every value read-only, with why', async ({ page, open }) => {
  await printerWith(page, false)
  await open('/settings#security')
  await expect(page.getByTestId('security-row')).toHaveCount(10)
  await expect(page.getByTestId('security-settings').getByRole('combobox')).toHaveCount(0)
  await expect(row(page, 'hotspot_change').getByTestId('locked-row')).toContainText('Owner')
  await expect(row(page, 'hotspot_change').getByTestId('locked-row')).toContainText("Only the printer's owner can change this.")
  await expect(row(page, 'lockdown').getByTestId('locked-row-label')).toHaveText('Owner, at the printer')
})

test('a change the printer refuses says so in its words, and keeps the value', async ({ page, open }) => {
  await printerWith(page, true, { status: 403, json: { error: { code: 403, message: 'Only at the printer' } } })
  await open('/settings#security')
  const select = page.getByRole('combobox', { name: 'Lockdown' })
  await select.selectOption('anyone')
  await expect(row(page, 'lockdown').getByTestId('security-note')).toHaveText('Only at the printer')
  await expect(select).toHaveValue('owner_at_printer')
})

test('a change taken without the setting in the answer is read again from the printer', async ({ page, open }) => {
  const { posts, reads } = await printerWith(page, true, undefined, true)
  await open('/settings#security')
  const select = page.getByRole('combobox', { name: 'Join or forget Wi-Fi networks' })
  await expect(select).toHaveValue('owner')
  const before = reads()
  await select.selectOption('anyone')
  await expect.poll(() => posts).toEqual([{ id: 'wifi_change', value: 'anyone' }])
  await expect.poll(reads).toBe(before + 1)
  await expect(select).toHaveValue('anyone')
})

test('a change that waits for the knob says to press it', async ({ page, open }) => {
  await printerWith(page, true, { status: 202, json: { consent_required: true, challenge_id: 'c1' } })
  await open('/settings#security')
  await page.getByRole('combobox', { name: 'Install updates' }).selectOption('owner_at_printer')
  await expect(row(page, 'update_install').getByTestId('security-note')).toContainText('Press the knob on the printer to confirm')
  await expect(page.getByRole('combobox', { name: 'Install updates' })).toHaveValue('anyone')
})

test('a printer that is not a Muon has no Security section', async ({ page, open }) => {
  await usePrinter(page, {}, { components: NOT_MUON })
  await open('/settings')
  await expect(page.getByRole('link', { name: /^Updates/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /^Security/ })).toHaveCount(0)
  await open('/settings#security')
  await expect(page.getByTestId('security-settings')).toHaveCount(0)
})
