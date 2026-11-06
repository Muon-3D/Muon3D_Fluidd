import { enableAutoDestroy, mount } from '@vue/test-utils'
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import OwnerNetworkSettings from '../OwnerNetworkSettings.vue'
import { resetOwnerNetwork, detectOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import { FakeOwnerPrinter, flushPromises } from './fakeOwnerPrinter'

let printer: FakeOwnerPrinter
enableAutoDestroy(afterEach)

const tid = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-tid=${id}]`)

async function open (path: string) {
  printer.path = path
  await detectOwnerNetwork()
  const w = mount(OwnerNetworkSettings)
  await tid(w, 'owner-network-toggle').trigger('click')
  return w
}

beforeEach(() => {
  printer = new FakeOwnerPrinter()
  resetOwnerNetwork()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request: printer.request }
})

describe('who can change the network', () => {
  it('is closed until asked for, behind one expander', async () => {
    printer.path = 'local'
    await detectOwnerNetwork()
    const w = mount(OwnerNetworkSettings)
    expect(w.text()).toBe('Who can change the network+')
    expect(tid(w, 'owner-network-fromBle').exists()).toBe(false)
  })

  it('shows the three choices, open as the device defaults: allow, allow, reauth', async () => {
    const w = await open('local')
    expect((tid(w, 'owner-network-fromBle').element as HTMLSelectElement).value).toBe('allow')
    expect((tid(w, 'owner-network-fromLocal').element as HTMLSelectElement).value).toBe('allow')
    expect((tid(w, 'owner-network-fromRelay').element as HTMLSelectElement).value).toBe('reauth')
    const labels = tid(w, 'owner-network-fromRelay').findAll('option').wrappers.map(o => o.text())
    expect(labels).toEqual(['Allow', 'Ask me to sign in again', 'Block'])
    expect(w.text()).toContain('Over Bluetooth')
    expect(w.text()).toContain('On the same network')
    expect(w.text()).toContain('Over the internet')
  })

  it('marks the connection the owner is on', async () => {
    const w = await open('ble')
    expect(w.findAll('.ons__label small').wrappers.map(s => s.text())).toEqual(['You are here'])
    expect(w.find('.ons__label small').element.closest('label')!.textContent).toContain('Over Bluetooth')
  })

  it('saves a change straight away', async () => {
    const w = await open('local')
    await tid(w, 'owner-network-fromRelay').setValue('deny')
    await flushPromises()
    expect(printer.sent('PUT', '/settings')[0].data).toEqual({ network_from_relay: 'deny' })
    expect(printer.rules.network_from_relay).toBe('deny')
  })

  it('over the internet it is read-only, and says why', async () => {
    const w = await open('relay')
    expect(tid(w, 'owner-network-readonly').text()).toContain('can only be changed from Bluetooth or from the printer\'s own network')
    for (const key of ['fromBle', 'fromLocal', 'fromRelay']) {
      expect(tid(w, `owner-network-${key}`).attributes('disabled')).toBeDefined()
    }
    expect(w.findAll('.ons__label small').wrappers.map(s => s.text())).toEqual(['You are here'])
  })

  it('direct_wan is read-only too', async () => {
    const w = await open('direct_wan')
    expect(tid(w, 'owner-network-readonly').exists()).toBe(true)
  })

  it('a refused save says why in plain words', async () => {
    const w = await open('local')
    printer.refuseAll = { status: 403, data: { error: 'reauth_required' } }
    await tid(w, 'owner-network-fromBle').setValue('deny')
    await flushPromises()
    expect(tid(w, 'owner-network-error').text()).toBe('Sign in again required to change Wi-Fi over the internet.')
    expect(printer.rules.network_from_ble).toBe('allow')
  })
})
