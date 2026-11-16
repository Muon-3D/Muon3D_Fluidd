import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WifiManagerCard from '../WifiManagerCard.vue'
import { resetWifiProbe } from '@/services/wifi/saved-probe'

// KAN-3356: one /wifi/saved per poll, never a /wifi/show per SSID, and no
// polling while the tab is hidden.

const wifiScan = vi.fn()
const wifiSaved = vi.fn()
const wifiDetails = vi.fn()

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({
    wifi: {
      wifiScanWifiScanGet: wifiScan,
      wifiSavedWifiSavedGet: wifiSaved,
      getDetailsWifiShowGet: wifiDetails
    },
    ap: { wifiStatusWifiApDeviceStatusGet: vi.fn() }
  })
}))

const hotspot = vi.hoisted(() => ({ value: false }))
vi.mock('@/aux_api/useHotspotCheck', async () => {
  const Vue = (await vi.importActual<typeof import('vue')>('vue')).default
  return { useHotspotCheck: () => ({ onHotspot: Vue.observable(hotspot) }) }
})
vi.mock('@/eventBus', () => ({ EventBus: { $emit: vi.fn() } }))

const mocks = () => ({
  $t: (key: string) => key,
  $route: { name: 'Overview' },
  $store: { getters: { 'protection/isLocked': false }, dispatch: vi.fn() }
})

const SSIDS = ['A', 'B', 'C', 'D', 'E', 'F']
const notFound = () => Object.assign(new Error('404'), { response: { status: 404 } })

let visibility: 'visible' | 'hidden' = 'visible'
const setVisibility = (v: 'visible' | 'hidden') => {
  visibility = v
  document.dispatchEvent(new Event('visibilitychange'))
}

enableAutoDestroy(afterEach)

describe('WifiManagerCard polling (KAN-3356)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    resetWifiProbe()
    visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    wifiScan.mockResolvedValue({ data: SSIDS.map(ssid => ({ ssid, signal: 50, security: 'WPA2', in_use: false })) })
    wifiSaved.mockResolvedValue({ data: [{ name: 'A', uuid: 'u1', device: null }, { name: 'C', uuid: 'u2', device: null }] })
    wifiDetails.mockRejectedValue(notFound())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('makes one /wifi/saved call per poll and no /wifi/show calls (6 SSIDs, 3 polls)', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(10000) // mount + 2 ticks = 3 polls

    expect(wifiScan).toHaveBeenCalledTimes(3)
    expect(wifiSaved).toHaveBeenCalledTimes(3)
    expect(wifiDetails).not.toHaveBeenCalled()
    expect([...(wrapper.vm as any).knownSsids].sort()).toEqual(['A', 'C'])
  })

  it('asks each SSID once in total across 3 polls when /wifi/saved is a 404', async () => {
    wifiSaved.mockRejectedValue(notFound())
    shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(10000)

    expect(wifiScan).toHaveBeenCalledTimes(3)
    expect(wifiSaved).toHaveBeenCalledTimes(1) // remembered after the first 404
    expect(wifiDetails).toHaveBeenCalledTimes(SSIDS.length)
    for (const ssid of SSIDS) expect(wifiDetails).toHaveBeenCalledWith(ssid)
  })

  it('does not ask again after a remount in the same page session', async () => {
    wifiSaved.mockRejectedValue(notFound())
    const first = shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(0)
    first.destroy()
    shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(0)

    expect(wifiSaved).toHaveBeenCalledTimes(1)
    expect(wifiDetails).toHaveBeenCalledTimes(SSIDS.length)
  })

  it('makes no calls while hidden, and one refresh when it becomes visible', async () => {
    shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(0)
    expect(wifiScan).toHaveBeenCalledTimes(1)

    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(60000)
    expect(wifiScan).toHaveBeenCalledTimes(1)
    expect(wifiSaved).toHaveBeenCalledTimes(1)

    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(wifiScan).toHaveBeenCalledTimes(2)
    expect(wifiSaved).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(5000) // polling resumed at the 5 s cadence
    expect(wifiScan).toHaveBeenCalledTimes(3)
  })

  it('clears the interval and the visibility listener on destroy', async () => {
    const wrapper = shallowMount(WifiManagerCard, { mocks: mocks() })
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBe(1)

    wrapper.destroy()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(30000)
    setVisibility('hidden')
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(10000)
    expect(wifiScan).toHaveBeenCalledTimes(1)
  })
})
