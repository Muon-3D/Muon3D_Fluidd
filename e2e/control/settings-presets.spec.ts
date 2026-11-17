/**
 * Settings > Security presets (KAN-3606): Open / Protected / Locked-down.
 *
 * Choosing one sets the printer's underlying permission settings; which one is
 * current is read back from those settings (so a mix says "Custom"); and the
 * rest of Control hides what the settings keep a non-owner from doing. The
 * printer's answers are faked per test with page.route, so the shared mock
 * never changes.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']
const FOUR = ['anyone', 'owner_and_shared', 'owner', 'owner_at_printer']

type Values = Record<string, string>

const OPEN: Values = {
  hotspot_toggle: 'anyone',
  hotspot_change: 'anyone',
  wifi_change: 'anyone',
  update_install: 'anyone',
  plate_clear: 'anyone',
  usb_print: 'anyone',
  dev_mode: 'anyone'
}

/** The printer's list, in the contract's shape, with `values` for each setting. */
function listOf (values: Values) {
  return {
    claimed: false,
    knobs: [
      ...['hotspot_toggle', 'hotspot_change', 'wifi_change', 'update_install', 'plate_clear', 'dev_mode']
        .map(id => ({ id, value: values[id], default: 'anyone', values: FOUR, read_only: false })),
      { id: 'usb_print', label: 'Print from a USB stick', value: values.usb_print, values: ['anyone', 'owner'] },
      { id: 'dev_mode_first_entry', value: 'owner_at_printer', values: ['owner_at_printer'], read_only: true, fixed: true }
    ],
    switches: []
  }
}

/** The printer keeps its settings for this test across reloads, and says whether this browser may manage access. */
async function printerWith (page: Page, values: Values, { owner = true, status = {} as Record<string, unknown> } = {}) {
  await usePrinter(page, status, { components: MUON })
  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/`), route => {
    const name = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    if (name === 'capabilities') return route.fulfill({ json: { result: { actions: { protection: owner ? 'allowed' : 'refused' } } } })
    return route.fulfill({ status: 404, json: { error: { code: 404, message: 'Not Found' } } })
  })
  const kept = { ...values }
  const posts: Array<{ id: string, value: string }> = []
  await page.route('**/server/aux/permissions', route => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: listOf(kept) })
    const body = route.request().postDataJSON()
    posts.push(body)
    kept[body.id] = body.value
    return route.fulfill({ json: { knob: listOf(kept).knobs.find(k => k.id === body.id) } })
  })
  return { posts, kept }
}

const current = (page: Page) => page.getByTestId('security-preset-current')
const choice = (page: Page, id: string) => page.getByTestId(`security-preset-${id}`)

test('each preset sets the settings it names, and shows as the current one', async ({ page, open }) => {
  const { posts, kept } = await printerWith(page, { ...OPEN, hotspot_change: 'owner' })
  await open('/settings#security')
  // A mix is Custom, with nothing chosen.
  await expect(current(page)).toHaveText('Custom')
  await expect(choice(page, 'open')).toHaveAttribute('aria-pressed', 'false')

  await choice(page, 'open').click()
  await expect(current(page)).toHaveText('Open')
  await expect(choice(page, 'open')).toHaveAttribute('aria-pressed', 'true')
  expect(posts).toEqual([{ id: 'hotspot_change', value: 'anyone' }])
  expect(kept).toEqual(OPEN)

  posts.length = 0
  await choice(page, 'protected').click()
  await expect(current(page)).toHaveText('Protected')
  expect(posts.map(p => `${p.id}=${p.value}`).sort()).toEqual([
    'dev_mode=owner', 'hotspot_change=owner', 'hotspot_toggle=owner_and_shared', 'plate_clear=owner_and_shared',
    'update_install=owner_and_shared', 'usb_print=owner', 'wifi_change=owner_and_shared'
  ])
  await expect(page.locator('[data-tid="security-row"][data-knob="wifi_change"]').getByRole('combobox')).toHaveValue('owner_and_shared')

  posts.length = 0
  await choice(page, 'locked-down').click()
  await expect(current(page)).toHaveText('Locked-down')
  expect(Object.values(kept).every(v => v === 'owner')).toBe(true)
  // The row that is only confirmed at the printer is never sent.
  expect(posts.some(p => p.id === 'dev_mode_first_entry')).toBe(false)

  // Changing one setting by hand leaves the preset behind.
  await page.locator('[data-tid="security-row"][data-knob="plate_clear"]').getByRole('combobox').selectOption('anyone')
  await expect(current(page)).toHaveText('Custom')
})

test('the current preset is read from the printer when the page opens', async ({ page, open }) => {
  await printerWith(page, { ...OPEN, hotspot_toggle: 'owner', hotspot_change: 'owner', wifi_change: 'owner', update_install: 'owner', plate_clear: 'owner', usb_print: 'owner', dev_mode: 'owner' })
  await open('/settings#security')
  await expect(current(page)).toHaveText('Locked-down')
  await expect(choice(page, 'locked-down')).toHaveAttribute('aria-pressed', 'true')
})

test('someone who is not the owner sees which preset it is but cannot choose one', async ({ page, open }) => {
  const { posts } = await printerWith(page, { ...OPEN, update_install: 'owner' }, { owner: false })
  await open('/settings#security')
  await expect(current(page)).toHaveText('Custom')
  await expect(choice(page, 'open')).toHaveCount(0)
  await expect(choice(page, 'locked-down')).toHaveCount(0)
  expect(posts).toEqual([])
})

const NEEDS_CLEARING = {
  ...PRESETS.idleHomed(),
  m1_machine: { activity: 'idle', conditions: { plate: 'present', plate_cleared: false }, missing: {}, ready: {}, faults: [], pause_reason: null }
}

test('a non-owner is not shown the plate-clear notice when the printer keeps it to the owner', async ({ page, open }) => {
  await printerWith(page, { ...OPEN, plate_clear: 'owner' }, { owner: false, status: NEEDS_CLEARING })
  await open('/')
  await expect(page.getByTestId('page-title')).toBeVisible()
  await expect(page.getByTestId('plate-clear-notice')).toHaveCount(0)
})

test('a non-owner is shown the plate-clear notice when anyone may confirm it', async ({ page, open }) => {
  await printerWith(page, OPEN, { owner: false, status: NEEDS_CLEARING })
  await open('/')
  await expect(page.getByTestId('plate-clear-notice')).toBeVisible()
})

test('the owner is shown the plate-clear notice whatever the preset', async ({ page, open }) => {
  await printerWith(page, { ...OPEN, plate_clear: 'owner' }, { owner: true, status: NEEDS_CLEARING })
  await open('/')
  await expect(page.getByTestId('plate-clear-notice')).toBeVisible()
})
