import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WifiManagerCard from '../WifiManagerCard.vue'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const wifiScan = vi.fn()
const wifiDetails = vi.fn()
const wifiConnect = vi.fn()
const wifiCurrent = vi.fn()
const wifiForget = vi.fn()
const apDeviceStatus = vi.fn()

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({
    wifi: {
      wifiScanWifiScanGet: wifiScan,
      getDetailsWifiShowGet: wifiDetails,
      wifiConnectWifiConnectPost: wifiConnect,
      wifiCurrentWifiCurrentGet: wifiCurrent,
      wifiForgetWifiForgetDelete: wifiForget
    },
    ap: {
      wifiStatusWifiApDeviceStatusGet: apDeviceStatus
    }
  })
}))

// A test sets `value` to put the page on the printer's hotspot. The card
// reads it through a cached getter, so it is made reactive in place.
const hotspot = vi.hoisted(() => ({ value: false }))
vi.mock('@/aux_api/useHotspotCheck', async () => {
  const Vue = (await vi.importActual<typeof import('vue')>('vue')).default
  return { useHotspotCheck: () => ({ onHotspot: Vue.observable(hotspot) }) }
})

const emit = vi.fn()
vi.mock('@/eventBus', () => ({
  EventBus: { $emit: (...args: unknown[]) => emit(...args) }
}))

const dispatch = vi.fn()

/** `locked`: MuonOS network protection is on and this browser has no identity. */
const mocks = (locked = false) => ({
  $t: (key: string) => key,
  $route: { name: 'Dashboard' },
  $store: { getters: { 'protection/isLocked': locked }, dispatch }
})

/** Moonraker's refusal, as axios hands it to the card. */
const refused = (message: string) => Object.assign(new Error('Request failed with status code 403'), {
  response: { status: 403, statusText: 'Forbidden', data: { error: { code: 403, message } } }
})

// A card polls on a real interval until destroyed. Without this, a wrapper
// from one test keeps calling the Aux API during the next.
enableAutoDestroy(afterEach)

describe('WifiManagerCard under network protection (SEC-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    wifiScan.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('says it is protected in place of the network list, and scans nothing', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(true) })
    await vi.advanceTimersByTimeAsync(11000)

    expect(wrapper.find('protectednotice-stub').exists()).toBe(true)
    expect(wrapper.find('[data-tid=wifi-networks]').exists()).toBe(false)
    expect(wifiScan).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('scans as before when protection leaves this browser alone', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.find('[data-tid=wifi-networks]').exists()).toBe(true)
    expect(wifiScan).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('asks for the level again when a scan is refused', async () => {
    wifiScan.mockRejectedValueOnce(refused("'/server/aux/wifi/scan' is protected on this printer."))
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    await vi.advanceTimersByTimeAsync(0)

    expect(dispatch).toHaveBeenCalledWith('protection/onRefused')
    wrapper.destroy()
  })

  it("shows Moonraker's reason when a connection is refused", async () => {
    // The toast used to read `detail || statusText`, and `+` binds before
    // `||`, so it always said "... undefined" and never gave a reason.
    const reason = "'/server/aux/wifi/connect' is protected on this printer."
    wifiConnect.mockRejectedValueOnce(refused(reason))
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    const card = wrapper.vm as any
    card.selectedNetwork = { ssid: 'Workshop', security: 'WPA2' }

    await card.connectToSelected()

    expect(emit).toHaveBeenCalledWith(
      `app.wifi.msg.connect.error ${reason}`,
      { type: 'error', timeout: 5000 }
    )
    wrapper.destroy()
  })
})

describe('WifiManagerCard over Iroh (07 §3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    wifiScan.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    printerTransportBinding.remote = false
    vi.useRealTimers()
  })

  it('shows one line in place of the card, and asks the printer nothing', async () => {
    printerTransportBinding.remote = true
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    await vi.advanceTimersByTimeAsync(11000)

    expect(wrapper.text()).toContain('app.wifi.remote_read_only')
    expect(wrapper.find('[data-tid=wifi-networks]').exists()).toBe(false)
    expect(wifiScan).not.toHaveBeenCalled()
    expect(wifiDetails).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('scans once the printer is reached on its own network again', async () => {
    printerTransportBinding.remote = true
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    await vi.advanceTimersByTimeAsync(0)

    printerTransportBinding.remote = false
    await vi.advanceTimersByTimeAsync(0)

    expect(wifiScan).toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('app.wifi.remote_read_only')
    wrapper.destroy()
  })
})

describe('WifiManagerCard joining another network', () => {
  const network = { ssid: 'HomeWiFi', security: 'WPA2', in_use: false }

  beforeEach(() => {
    vi.clearAllMocks()
    wifiScan.mockResolvedValue({ data: [] })
    hotspot.value = false
  })

  it('asks first from the LAN, where the printer leaves the network this page is on', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    const card = wrapper.vm as any

    card.onNetworkClick(network)
    await wrapper.vm.$nextTick()

    expect(card.showWarningDialog).toBe(true)
    expect(wifiConnect).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('app.wifi.modal.warning.message')
    wrapper.destroy()
  })

  it('asks first on the hotspot too, where joining moves the hotspot and drops the phone', async () => {
    hotspot.value = true
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks(false) })
    const card = wrapper.vm as any

    card.onNetworkClick(network)
    await wrapper.vm.$nextTick()

    expect(card.showWarningDialog).toBe(true)
    expect(wifiConnect).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('app.wifi.modal.warning.hotspot_message')
    wrapper.destroy()
  })
})

describe('WifiManagerCard forgetting a network', () => {
  const confirm = vi.fn()
  const withConfirm = () => ({ ...mocks(false), $confirm: confirm, $store: { ...mocks(false).$store, state: { printer: { printer: { info: {} } } } } })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    wifiScan.mockResolvedValue({ data: [] })
    wifiForget.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks first, saying the page may be lost and the printer drops off the network, and forgets nothing until yes', async () => {
    confirm.mockResolvedValueOnce(false)
    const wrapper = shallowMount(WifiManagerCard, { mocks: withConfirm() })
    await vi.advanceTimersByTimeAsync(0)
    await (wrapper.vm as any).forgetConfirm({ ssid: 'Workshop', in_use: true })

    expect(confirm).toHaveBeenCalledTimes(1)
    expect(confirm.mock.calls[0][0]).toMatch(/lose this page/)
    expect(confirm.mock.calls[0][0]).toMatch(/drop off this network/)
    expect(confirm.mock.calls[0][1]).toMatchObject({ danger: true })
    expect(wifiForget).not.toHaveBeenCalled()

    confirm.mockResolvedValueOnce(true)
    await (wrapper.vm as any).forgetConfirm({ ssid: 'Workshop', in_use: true })
    expect(wifiForget).toHaveBeenCalledWith('Workshop')
    wrapper.destroy()
  })

  it('shows the network it is on even when its name is hidden, as connected', async () => {
    wifiScan.mockResolvedValue({ data: [{ ssid: '', in_use: true, signal: 70, security: 'WPA2', chan: 36, freq: 5180, rate: 540 }, { ssid: '', in_use: false, signal: 40, security: 'WPA2', chan: 1, freq: 2412, rate: 65 }] })
    const wrapper = shallowMount(WifiManagerCard, { mocks: withConfirm() })
    await vi.advanceTimersByTimeAsync(0)
    const card = wrapper.vm as any

    expect(card.connectedNetwork?.ssid).toBe('Hidden network')
    // The other hidden one is still left out.
    expect(card.sortedNetworks).toHaveLength(1)
    expect(card.isHidden(card.connectedNetwork)).toBe(true)
    wrapper.destroy()
  })

  it('says the channel, speed and frequency in words a row can show', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: withConfirm() })
    const detail = (wrapper.vm as any).detail({ chan: 36, freq: 5180, rate: 540, chanList: '36', freqList: '5180' })
    expect(detail).toBe('channel 36 · 540 Mbps · 5180 MHz')
    wrapper.destroy()
  })
})
