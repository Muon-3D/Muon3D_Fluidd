/**
 * KAN-4340: a Muon printer's safety policy refuses Moonraker's user and
 * API-key administration (/access/user, /access/users/list, /access/api_key),
 * because changing them could lock the panel out. Control must not ask, and
 * must not draw the Authentication / Users panels that need them. Who may use
 * a Muon printer comes from muon-link and the Muon cloud (People and access).
 *
 * The page's requests are recorded here (page.on('request')); nothing reaches
 * a real printer, only the shared mock. A stock Moonraker host with the same
 * `authorization` component is the control: it is still asked, and still shows
 * the card, so the test cannot pass by the page asking nothing at all.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

test.use({ signedIn: true })

const BASE = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization']
const MUON = [...BASE, 'muon_protection']
const MUON_WITH_ACCESS = [...MUON, 'muon_access']

/** Every request the page makes to Moonraker's user and API-key administration. */
function recordAccessAdmin (page: Page) {
  const seen: string[] = []
  page.on('request', request => {
    const { pathname } = new URL(request.url())
    if (/^\/access\/(user|users|api_key)/.test(pathname)) seen.push(`${request.method()} ${pathname}`)
  })
  return seen
}

for (const [label, components] of [['a Muon printer on an older MuonOS', MUON], ['a Muon printer with muon_access', MUON_WITH_ACCESS]] as const) {
  test(`${label}: no /access/user* or /access/api_key request, and no Users or API key panel`, async ({ page, open }) => {
    const seen = recordAccessAdmin(page)
    await usePrinter(page, {}, { components })
    await open('/settings#access')
    // Let the components' init requests (all fired on server.info) settle.
    await page.waitForLoadState('networkidle')

    expect(seen).toEqual([])
    await expect(page.locator('#auth')).toHaveCount(0)
    await expect(page.getByText(/API key|Add user/i)).toHaveCount(0)
  })
}

test('negative control: a stock Moonraker host is still asked for its users and API key, and shows the card', async ({ page, open }) => {
  const seen = recordAccessAdmin(page)
  // The shared mock answers every /access/* with one user object; a stock host answers each in its own shape.
  await page.route(/\/access\/users\/list/, route => route.fulfill({ json: { result: { users: [{ username: 'jack', source: 'moonraker', created_on: 1 }] } } }))
  await page.route(/\/access\/api_key/, route => route.fulfill({ json: { result: 'abc' } }))
  await usePrinter(page, {}, { components: BASE })
  await open('/settings#access')
  await expect(page.locator('#auth')).toBeVisible()
  expect(seen.some(s => s.endsWith('/access/users/list'))).toBe(true)
  expect(seen.some(s => s.endsWith('/access/api_key'))).toBe(true)
})
