/**
 * The printer's owner changes Wi-Fi and the hotspot from afar (KAN-1565).
 * muon-link's /muon-link/network/* routes are mocked (e2e/fakes/ownerNetwork.ts);
 * the confirm-or-revert route is not defined yet, so no countdown is offered.
 * Nothing here types, prints or snapshots a real passphrase.
 */
import { test, expect } from '../fixtures'
import { reachOverMuonLink, useOwnerNetwork } from '../fakes/ownerNetwork'

const READ_ONLY = "Wi-Fi can only be changed on the printer's own network."

test('an owner on the local network changes Wi-Fi: warned first, then joined', async ({ page, open }) => {
  const net = await useOwnerNetwork(page, { path: 'local' })
  await open('/wifi')
  await reachOverMuonLink(page)

  const wifi = page.getByTestId('owner-wifi')
  await expect(wifi).toContainText('On Workshop')
  await expect(page.getByText(READ_ONLY)).toHaveCount(0)

  await wifi.locator('[data-ssid="Cafe"]').getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByTestId('owner-wifi-warning-title')).toHaveText('This may drop your connection')
  await expect(page.getByTestId('owner-wifi-warning')).toContainText('can drop the connection you are using now')
  expect(net.seen.some(s => s.startsWith('POST /wifi/connect'))).toBe(false)

  await page.getByTestId('owner-wifi-proceed').click()
  await expect(page.getByTestId('owner-wifi-message')).toHaveText('Joining Cafe…')
  expect(net.bodies.find(b => b.route === '/wifi/connect')?.body).toEqual({ ssid: 'Cafe' })
  // The printer has no confirm route yet, so Control does not pretend to offer one.
  await expect(page.getByTestId('change-countdown')).toHaveCount(0)
})

test('over Bluetooth the same change says it is safe', async ({ page, open }) => {
  await useOwnerNetwork(page, { path: 'ble' })
  await open('/wifi')
  await reachOverMuonLink(page)

  await page.getByTestId('owner-wifi').locator('[data-ssid="Cafe"]').getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByTestId('owner-wifi-warning-title')).toHaveText('Safe over Bluetooth')
  await page.getByTestId('owner-wifi-cancel').click()
  await expect(page.getByTestId('owner-wifi-confirm')).toHaveCount(0)
})

test('the three rules sit behind "Who can change the network", open by default', async ({ page, open }) => {
  const net = await useOwnerNetwork(page, { path: 'local' })
  await open('/wifi')
  await reachOverMuonLink(page)

  await expect(page.getByTestId('owner-network-fromBle')).toHaveCount(0)
  await page.getByRole('button', { name: /Who can change the network/ }).click()
  await expect(page.getByTestId('owner-network-fromBle')).toHaveValue('allow')
  await expect(page.getByTestId('owner-network-fromLocal')).toHaveValue('allow')
  await expect(page.getByTestId('owner-network-fromRelay')).toHaveValue('reauth')

  await page.getByTestId('owner-network-fromRelay').selectOption('deny')
  await expect.poll(() => net.rules.network_from_relay).toBe('deny')
})

test('an owner on the relay is told to sign in again, and the rules are read-only', async ({ page, open }) => {
  await useOwnerNetwork(page, { path: 'relay', refuse: 'reauth_required' })
  await open('/wifi')
  await reachOverMuonLink(page)

  await expect(page.getByTestId('owner-wifi-notice')).toHaveText('Sign in again required to change Wi-Fi over the internet.')
  await expect(page.getByTestId('owner-wifi').getByRole('button')).toHaveCount(0)

  await page.getByRole('button', { name: /Who can change the network/ }).click()
  await expect(page.getByTestId('owner-network-readonly')).toBeVisible()
  await expect(page.getByTestId('owner-network-fromBle')).toBeDisabled()
})

test('a blocked path says so', async ({ page, open }) => {
  await useOwnerNetwork(page, { path: 'local', refuse: 'path_disabled' })
  await open('/wifi')
  await reachOverMuonLink(page)
  await expect(page.getByTestId('owner-wifi-notice')).toHaveText('Blocked in your network settings.')
})

test('someone who is not the owner sees nothing new', async ({ page, open }) => {
  const net = await useOwnerNetwork(page, { notOwner: true })
  await open('/wifi')
  await reachOverMuonLink(page)

  await expect(page.getByText(READ_ONLY).first()).toBeVisible()
  await expect(page.getByTestId('owner-wifi')).toHaveCount(0)
  await expect(page.getByTestId('owner-network-settings')).toHaveCount(0)
  await expect(page.getByTestId('owner-hotspot')).toHaveCount(0)
  expect(net.seen).toEqual(['GET /settings'])
})

test('an older muon-link (404) leaves today\'s read-only cards as they were', async ({ page, open }) => {
  const net = await useOwnerNetwork(page, { older: true })
  await open('/wifi')
  await reachOverMuonLink(page)

  await expect(page.getByText(READ_ONLY).first()).toBeVisible()
  await expect(page.getByTestId('owner-wifi')).toHaveCount(0)
  await expect(page.getByTestId('owner-network-settings')).toHaveCount(0)
  expect(net.seen.every(s => s === 'GET /settings')).toBe(true)
})

test('a printer reached on its own network never asks muon-link anything', async ({ page, open }) => {
  const net = await useOwnerNetwork(page)
  await open('/wifi')
  await expect(page.getByTestId('wifi-card')).toBeVisible()
  await expect(page.getByTestId('owner-wifi')).toHaveCount(0)
  expect(net.seen).toEqual([])
})

test('a hotspot change shows the knob prompt, then the outcome', async ({ page, open }) => {
  const net = await useOwnerNetwork(page, { path: 'relay', changeStates: ['waiting', 'applied'] })
  await open('/wifi')
  await reachOverMuonLink(page)

  await page.getByTestId('owner-hotspot-ssid').fill('Muon-Workshop')
  await page.getByTestId('owner-hotspot-generate').check()
  await page.getByTestId('owner-hotspot-ask').click()
  await expect(page.getByTestId('owner-hotspot-warning')).toContainText('Nothing changes until someone presses the knob')
  await page.getByTestId('owner-hotspot-proceed').click()

  await expect(page.getByTestId('owner-hotspot-waiting')).toContainText('Press the knob on the printer to approve.')
  expect(net.bodies.find(b => b.route === '/hotspot/change')?.body).toEqual({ ssid: 'Muon-Workshop', generate: true })
  await expect(page.getByTestId('owner-hotspot-outcome')).toHaveText('The hotspot has its new name and password.', { timeout: 20_000 })
  await expect(page.getByTestId('owner-hotspot-waiting')).toHaveCount(0)
})

test('a hotspot change that nobody approves says nothing changed', async ({ page, open }) => {
  await useOwnerNetwork(page, { path: 'ble', changeStates: ['expired'] })
  await open('/wifi')
  await reachOverMuonLink(page)

  await page.getByTestId('owner-hotspot-ssid').fill('Muon-Workshop')
  await page.getByTestId('owner-hotspot-ask').click()
  await page.getByTestId('owner-hotspot-proceed').click()
  await expect(page.getByTestId('owner-hotspot-outcome')).toContainText('Nobody approved it in time', { timeout: 20_000 })
})
