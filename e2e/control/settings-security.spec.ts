/**
 * Settings > Security (KAN-1926, KAN-2189): one row per setting the printer
 * reports, in the device contract's shape (four values, `claimed`, switches,
 * fixed rows). The owner can restrict each one; everyone else sees the value
 * read-only with why; a fixed row is "Printer only". A printer from before the
 * contract (three values, no `claimed`) is still read. The printer's answers
 * are faked per test with page.route, so the shared mock never changes. (The
 * /muon-link route of a managed session is covered in the component test,
 * SecuritySettings.spec.ts: e2e has no managed session.)
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']
const NOT_MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization']
const FOUR = ['anyone', 'owner_and_shared', 'owner', 'owner_at_printer']

const reported = (claimed: boolean) => {
  const dflt = claimed ? 'owner_and_shared' : 'anyone'
  return {
    claimed,
    knobs: [
      { id: 'hotspot_toggle', value: dflt, default: dflt, values: FOUR, read_only: false },
      { id: 'hotspot_change', value: 'owner', default: dflt, values: FOUR, read_only: false },
      { id: 'wifi_change', value: dflt, default: dflt, values: FOUR, read_only: false },
      { id: 'update_install', value: dflt, default: dflt, values: FOUR, read_only: false },
      { id: 'plate_clear', value: dflt, default: dflt, values: FOUR, read_only: false },
      { id: 'usb_print', label: 'Print from a USB stick', description: 'A stick in the front port starts a print.', value: 'anyone', values: ['anyone', 'owner'] },
      { id: 'remote_print', label: 'Print from Muon3D', value: 'owner_or_admin' },
      { id: 'dev_mode', value: 'owner_at_printer', values: FOUR, read_only: false },
      { id: 'dev_mode_first_entry', value: 'owner_at_printer', values: ['owner_at_printer'], read_only: true, fixed: true }
    ],
    switches: [
      { id: 'hotspot_change_confirm', label: 'Confirm hotspot changes at the printer', value: false, default: false, read_only: false },
      { id: 'hotspot_password_on_screen', label: "Show the hotspot password on the printer's screen", value: true, default: true, read_only: false }
    ]
  }
}

/** The three-value list #328 first read: no `claimed`, no switches, dev_mode forced to the panel. */
const older = () => ({
  knobs: [
    { id: 'hotspot_toggle', value: 'anyone' },
    { id: 'wifi_change', value: 'owner' },
    { id: 'lockdown', value: 'owner_at_printer' },
    { id: 'dev_mode', value: 'owner_at_printer', values: ['owner_at_printer'] }
  ]
})

interface Options { owner?: boolean, refuse?: { status: number, json: unknown }, bare?: boolean, claimed?: boolean, list?: () => any }

/** The printer says whether this browser may manage access, and keeps its settings for this test across reloads. */
async function printerWith (page: Page, { owner = true, refuse, bare = false, claimed = false, list }: Options = {}) {
  await usePrinter(page, {}, { components: MUON })
  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/`), route => {
    const name = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    if (name === 'capabilities') return route.fulfill({ json: { result: { actions: { protection: owner ? 'allowed' : 'refused' } } } })
    return route.fulfill({ status: 404, json: { error: { code: 404, message: 'Not Found' } } })
  })
  const state = list ? list() : reported(claimed)
  const posts: unknown[] = []
  const switchPosts: unknown[] = []
  let reads = 0
  await page.route('**/server/aux/permissions/switch', route => {
    const body = route.request().postDataJSON()
    switchPosts.push(body)
    if (refuse) return route.fulfill(refuse)
    const sw = state.switches.find((s: any) => s.id === body.id)
    if (sw) sw.value = body.value
    return route.fulfill({ json: { switch: sw } })
  })
  await page.route('**/server/aux/permissions', route => {
    if (route.request().method() !== 'POST') {
      reads++
      return route.fulfill({ json: state })
    }
    const body = route.request().postDataJSON()
    posts.push(body)
    if (refuse) return route.fulfill(refuse)
    const knob = state.knobs.find((k: any) => k.id === body.id)
    if (knob) knob.value = body.value
    return bare ? route.fulfill({ status: 200, json: {} }) : route.fulfill({ json: { knob } })
  })
  return { posts, switchPosts, reads: () => reads }
}

const row = (page: Page, id: string) => page.locator(`[data-tid="security-row"][data-knob="${id}"]`)

test('an open printer: one row per setting in the printer\'s order, open by default, with all four values to choose from', async ({ page, open }) => {
  await printerWith(page)
  await open('/settings#security')
  await expect(page.getByTestId('security-claimed')).toContainText('An open printer: Anyone may do each of these by default.')
  await expect(page.getByTestId('security-label')).toHaveText([
    'Turn the hotspot on or off', "Change the hotspot's name or password", 'Join or forget Wi-Fi networks', 'Install updates',
    'Confirm the plate is clear', 'Print from a USB stick', 'Print from Muon3D', 'Turn developer mode back on'
  ])
  await expect(row(page, 'wifi_change').getByRole('combobox').locator('option')).toHaveText(['Anyone', 'Owner and shared users', 'Owner', 'Owner, at the printer'])
  await expect(row(page, 'wifi_change').getByTestId('security-default')).toHaveText('Open by default.')
  await expect(row(page, 'hotspot_change').getByTestId('security-default')).toHaveText('Open by default. Now set to Owner.')
  // A value Control doesn't know is still a row, shown as the printer reports it.
  await expect(row(page, 'remote_print').getByRole('combobox')).toHaveCount(0)
  await expect(row(page, 'remote_print').getByTestId('locked-row-label')).toHaveText('Owner or admin')
  await expect(row(page, 'usb_print').getByRole('combobox').locator('option')).toHaveText(['Anyone', 'Owner'])
  // Plate clear is an ordinary row because the printer reports it as one.
  await expect(row(page, 'plate_clear').getByRole('combobox')).toHaveValue('anyone')
  await expect(page.getByTestId('security-reset')).toHaveText("Reset to the defaults at the printer's screen.")
})

test('a claimed printer shows Owner and shared users as the default, and the value is a real choice', async ({ page, open }) => {
  const { posts } = await printerWith(page, { claimed: true })
  await open('/settings#security')
  await expect(page.getByTestId('security-claimed')).toContainText('A claimed printer: Owner and shared users by default.')
  const select = row(page, 'wifi_change').getByRole('combobox')
  await expect(select).toHaveValue('owner_and_shared')
  await expect(row(page, 'wifi_change').getByTestId('security-default')).toHaveText('Default: Owner and shared users.')
  await select.selectOption('anyone')
  await expect.poll(() => posts).toEqual([{ id: 'wifi_change', value: 'anyone' }])
  await expect(select).toHaveValue('anyone')
  await expect(row(page, 'wifi_change').getByTestId('security-default')).toHaveText('Default: Owner and shared users. Now set to Anyone.')
})

test('the fixed row is under "Only at the printer", with no control; nothing is sent when it is clicked', async ({ page, open }) => {
  const { posts, switchPosts } = await printerWith(page)
  await open('/settings#security')
  const group = page.getByTestId('security-printer-only')
  await expect(group.getByTestId('security-printer-only-row')).toHaveCount(1)
  await expect(group).toContainText('The first time developer mode is turned on')
  await expect(group.getByTestId('locked-row-label')).toHaveText('Printer only')
  await expect(group.getByRole('combobox')).toHaveCount(0)
  await expect(group.getByRole('switch')).toHaveCount(0)
  await group.getByTestId('security-printer-only-row').click()
  expect(posts).toEqual([])
  expect(switchPosts).toEqual([])
})

test('the owner restricts a setting to Owner, and it stays so after a reload', async ({ page, open }) => {
  const { posts } = await printerWith(page)
  await open('/settings#security')
  const select = page.getByRole('combobox', { name: 'Turn the hotspot on or off' })
  await expect(select).toHaveValue('anyone')
  await select.selectOption('owner')
  await expect.poll(() => posts).toEqual([{ id: 'hotspot_toggle', value: 'owner' }])
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Turn the hotspot on or off' })).toHaveValue('owner')
})

test('the printer\'s switches are toggles that keep their value', async ({ page, open }) => {
  const { switchPosts } = await printerWith(page)
  await open('/settings#security')
  const confirm = page.getByRole('switch', { name: 'Confirm hotspot changes at the printer' })
  await expect(confirm).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('[data-switch="hotspot_change_confirm"]').getByTestId('security-switch-default')).toHaveText('Off by default.')
  await expect(page.getByRole('switch', { name: "Show the hotspot password on the printer's screen" })).toHaveAttribute('aria-checked', 'true')
  await confirm.click()
  await expect.poll(() => switchPosts).toEqual([{ id: 'hotspot_change_confirm', value: true }])
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Confirm hotspot changes at the printer' })).toHaveAttribute('aria-checked', 'true')
})

test('someone the printer does not let manage access sees every value read-only, with why', async ({ page, open }) => {
  await printerWith(page, { owner: false })
  await open('/settings#security')
  await expect(page.getByTestId('security-row')).toHaveCount(8)
  await expect(page.getByTestId('security-settings').getByRole('combobox')).toHaveCount(0)
  await expect(page.getByTestId('security-settings').getByRole('switch')).toHaveCount(0)
  await expect(row(page, 'hotspot_change').getByTestId('locked-row')).toContainText('Owner')
  await expect(row(page, 'hotspot_change').getByTestId('locked-row')).toContainText("Only the printer's owner can change this.")
})

test('a row the printer reports as read-only for this session has no control', async ({ page, open }) => {
  await printerWith(page, { list: () => { const l = reported(true); l.knobs[2].read_only = true; return l } })
  await open('/settings#security')
  await expect(row(page, 'wifi_change').getByRole('combobox')).toHaveCount(0)
  await expect(row(page, 'wifi_change').getByTestId('locked-row-label')).toHaveText('Owner and shared users')
  await expect(row(page, 'hotspot_toggle').getByRole('combobox')).toHaveCount(1)
})

test('a refusal shows the printer\'s own words (detail.message) and keeps the value', async ({ page, open }) => {
  const message = 'Only the owner may change this on a claimed printer.'
  await printerWith(page, { claimed: true, refuse: { status: 403, json: { detail: { code: 'owner_only', knob: 'wifi_change', message } } } })
  await open('/settings#security')
  const select = row(page, 'wifi_change').getByRole('combobox')
  await select.selectOption('anyone')
  await expect(row(page, 'wifi_change').getByTestId('security-note')).toHaveText(message)
  await expect(select).toHaveValue('owner_and_shared')
  // A refused switch says so too.
  await page.getByRole('switch', { name: 'Confirm hotspot changes at the printer' }).click()
  await expect(page.locator('[data-switch="hotspot_change_confirm"]').getByTestId('security-note')).toHaveText(message)
})

test('a change taken without the setting in the answer is read again from the printer', async ({ page, open }) => {
  const { posts, reads } = await printerWith(page, { bare: true })
  await open('/settings#security')
  const select = page.getByRole('combobox', { name: 'Join or forget Wi-Fi networks' })
  await expect(select).toHaveValue('anyone')
  const before = reads()
  await select.selectOption('owner')
  await expect.poll(() => posts).toEqual([{ id: 'wifi_change', value: 'owner' }])
  await expect.poll(reads).toBe(before + 1)
  await expect(select).toHaveValue('owner')
})

test('a printer from before the contract (three values, no claimed) is still read: developer mode stays printer only', async ({ page, open }) => {
  await printerWith(page, { list: older })
  await open('/settings#security')
  await expect(page.getByTestId('security-claimed')).toHaveCount(0)
  await expect(page.getByTestId('security-switches')).toHaveCount(0)
  await expect(row(page, 'wifi_change').getByRole('combobox')).toHaveValue('owner')
  await expect(row(page, 'lockdown').getByTestId('security-default')).toHaveCount(0)
  await expect(row(page, 'dev_mode')).toHaveCount(0)
  await expect(page.getByTestId('security-printer-only')).toContainText('Printer only')
  await expect(page.getByTestId('security-printer-only').getByRole('combobox')).toHaveCount(0)
})

test('a printer that is not a Muon has no Security section', async ({ page, open }) => {
  await usePrinter(page, {}, { components: NOT_MUON })
  await open('/settings')
  await expect(page.getByRole('link', { name: /^Updates/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /^Security/ })).toHaveCount(0)
  await open('/settings#security')
  await expect(page.getByTestId('security-settings')).toHaveCount(0)
})
