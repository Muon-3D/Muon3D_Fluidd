import { enableAutoDestroy, mount } from '@vue/test-utils'
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OwnerWifiRemote from '../OwnerWifiRemote.vue'
import { resetOwnerNetwork, detectOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import { FakeOwnerPrinter, flushPromises } from './fakeOwnerPrinter'

const hotspot = vi.hoisted(() => ({ value: false }))
vi.mock('@/aux_api/useHotspotCheck', () => ({ useHotspotCheck: () => ({ onHotspot: hotspot }) }))

// The confirm route is not defined yet; a test turns it on to see the countdown.
const confirmRoute = vi.hoisted(() => ({ supported: false }))
vi.mock('@/services/muon-cloud/ownerNetwork', async () => ({
  ...(await vi.importActual<object>('@/services/muon-cloud/ownerNetwork')),
  confirmRouteSupported: () => confirmRoute.supported
}))

let printer: FakeOwnerPrinter
enableAutoDestroy(afterEach)

async function open (path = 'local') {
  printer.path = path
  await detectOwnerNetwork()
  const w = mount(OwnerWifiRemote)
  await flushPromises()
  return w
}

const tid = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-tid=${id}]`)
const row = (w: ReturnType<typeof mount>, ssid: string) => w.find(`[data-ssid="${ssid}"]`)
const button = (w: ReturnType<typeof mount>, ssid: string, name: string) =>
  row(w, ssid).findAll('button').wrappers.find(b => b.text() === name)!

beforeEach(() => {
  printer = new FakeOwnerPrinter()
  hotspot.value = false
  confirmRoute.supported = false
  resetOwnerNetwork()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request: printer.request }
})

describe('owner Wi-Fi over the printer connection', () => {
  it('lists the networks with the one it is on first, and what is saved', async () => {
    const w = await open()
    expect(w.text()).toContain('On Home · signal 80%')
    const names = w.findAll('.owr__row').wrappers.map(r => r.attributes('data-ssid'))
    expect(names).toEqual(['Home', 'Cafe', 'Neighbour', 'Old flat'])
    expect(row(w, 'Home').text()).toContain('Connected')
    expect(row(w, 'Cafe').text()).toContain('Open')
    expect(row(w, 'Neighbour').text()).toContain('Needs a password')
    expect(row(w, 'Old flat').text()).toContain('out of range')
  })

  it('on the local network, joining another Wi-Fi warns, then joins', async () => {
    const w = await open('local')
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-warning-title').text()).toBe('This may drop your connection')
    expect(tid(w, 'owner-wifi-warning').text()).toContain('can drop the connection you are using now')
    expect(printer.sent('POST', '/wifi/connect')).toHaveLength(0)
    await tid(w, 'owner-wifi-proceed').trigger('click')
    await flushPromises()
    expect(printer.sent('POST', '/wifi/connect')[0].data).toEqual({ ssid: 'Cafe' })
    expect(tid(w, 'owner-wifi-message').text()).toBe('Joining Cafe…')
  })

  it('over Bluetooth it says the change is safe', async () => {
    const w = await open('ble')
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-warning-title').text()).toBe('Safe over Bluetooth')
    expect(tid(w, 'owner-wifi-warning').text()).toContain('will not cut your connection')
  })

  it('asks for the password of a new secured network, sends it once, and clears it', async () => {
    const w = await open()
    await button(w, 'Neighbour', 'Connect').trigger('click')
    await flushPromises()
    const proceed = tid(w, 'owner-wifi-proceed')
    expect(proceed.attributes('disabled')).toBeDefined()
    await tid(w, 'owner-wifi-password').setValue('correct horse')
    await proceed.trigger('click')
    await flushPromises()
    expect(printer.sent('POST', '/wifi/connect')[0].data).toEqual({ ssid: 'Neighbour', password: 'correct horse' })
    expect(w.html()).not.toContain('correct horse')
    expect((w.vm as unknown as { password: string }).password).toBe('')
  })

  it('a saved network joins with no password asked', async () => {
    printer.scan.push({ ssid: 'Old flat', signal: 20, security: 'WPA2', in_use: false })
    const w = await open()
    await button(w, 'Old flat', 'Connect').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-password').exists()).toBe(false)
  })

  it('forgetting a saved network that is not the current one is safe, and sends the name', async () => {
    const w = await open()
    await button(w, 'Old flat', 'Forget').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-warning-title').text()).toBe('Not the network the printer is on')
    await tid(w, 'owner-wifi-proceed').trigger('click')
    await flushPromises()
    expect(printer.sent('DELETE', '/wifi/forget?ssid=Old%20flat')).toHaveLength(1)
    expect(tid(w, 'owner-wifi-message').text()).toBe('Forgot Old flat.')
  })

  it('forgetting the current network warns', async () => {
    const w = await open('local')
    await button(w, 'Home', 'Forget').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-warning-title').text()).toBe('This may drop your connection')
  })

  it('Cancel sends nothing', async () => {
    const w = await open()
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    await tid(w, 'owner-wifi-cancel').trigger('click')
    expect(tid(w, 'owner-wifi-confirm').exists()).toBe(false)
    expect(printer.sent('POST', '/wifi/connect')).toHaveLength(0)
  })

  it('re-reads the path before warning, so a link that moved is warned about', async () => {
    const w = await open('ble')
    printer.path = 'relay'
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-warning').text()).toContain('until the printer is back online')
  })

  it('over the internet with reauth, shows "Sign in again required" and no actions', async () => {
    printer.refuseAll = { status: 403, data: { error: 'reauth_required' } }
    printer.path = 'relay'
    const w = mount(OwnerWifiRemote)
    await flushPromises()
    expect(tid(w, 'owner-wifi-notice').text()).toBe('Sign in again required to change Wi-Fi over the internet.')
    expect(w.findAll('button')).toHaveLength(0)
  })

  it('with the path blocked, shows "Blocked in your network settings"', async () => {
    printer.refuseAll = { status: 403, data: { error: 'path_disabled' } }
    const w = mount(OwnerWifiRemote)
    await flushPromises()
    expect(tid(w, 'owner-wifi-notice').text()).toBe('Blocked in your network settings.')
  })

  it('a change that gets reauth_required swaps the list for the notice', async () => {
    const w = await open('relay')
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    printer.request.mockImplementationOnce(async () => {
      throw Object.assign(new Error('403'), { response: { status: 403, data: { error: 'reauth_required' } } })
    })
    await tid(w, 'owner-wifi-proceed').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-notice').text()).toContain('Sign in again required')
    expect(tid(w, 'owner-wifi-list').exists()).toBe(false)
  })

  it('says plainly when the printer is not answering', async () => {
    const w = await open()
    printer.refuseAll = { status: 504, data: { error: 'aux_timeout' } }
    await tid(w, 'owner-wifi-refresh').trigger('click')
    await flushPromises()
    expect(tid(w, 'owner-wifi-error').text()).toBe('The printer took too long to answer. Try again in a moment.')
  })

  it('never shows the countdown while the confirm route is undefined', async () => {
    const w = await open('local')
    await button(w, 'Cafe', 'Connect').trigger('click')
    await flushPromises()
    await tid(w, 'owner-wifi-proceed').trigger('click')
    await flushPromises()
    expect(w.find('[data-tid=change-countdown]').exists()).toBe(false)
  })

  it('shows the 90 second countdown after a change that can drop the link, once the route exists', async () => {
    confirmRoute.supported = true
    {
      const w = await open('local')
      await button(w, 'Cafe', 'Connect').trigger('click')
      await flushPromises()
      await tid(w, 'owner-wifi-proceed').trigger('click')
      await flushPromises()
      expect(w.find('[data-tid=change-countdown]').exists()).toBe(true)
      expect(w.find('[data-tid=change-countdown-left]').text()).toBe('90')
    }
  })
})
