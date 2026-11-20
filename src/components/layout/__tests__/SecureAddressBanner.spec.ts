/**
 * @vitest-environment-options { "url": "http://192.168.1.50/" }
 *
 * KAN-5110: a printer with a proven secure name is used by default. The banner moves this tab by itself for a
 * browser that never chose, and never for an unproven address, a "stay here", a late proof or a running upload.
 */
import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SecureAddressBanner from '../SecureAddressBanner.vue'
import { AUTO_SWITCH_WITHIN_MS, PROBE_MARKER, setSwitchesAutomatically } from '@/services/secure-origin'

const NAME = 'abcdefghijklmnopqrst.muonlan.net'
const replace = vi.fn()
const assign = vi.fn()

/** `lateByMs` moves the clock on while the probe runs, as a slow network would. */
function network (proven: boolean, lateByMs = 0) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url)
    if (u === '/muon/secure-origin.json') {
      return { ok: true, text: async () => JSON.stringify({ version: 1, name: NAME, not_after: 4_000_000_000 }) } as Response
    }
    if (u === `https://${NAME}/muon/secure-probe.txt` && proven) {
      vi.setSystemTime(Date.now() + lateByMs)
      return { ok: true, text: async () => PROBE_MARKER } as Response
    }
    throw new TypeError('Failed to fetch')
  }))
}

async function mountBanner (uploads: unknown[] = []) {
  const wrapper = shallowMount(SecureAddressBanner as any, {
    mocks: { $store: { state: { files: { uploads } } } },
    stubs: { 'frame-icon': true, 'app-btn': true }
  })
  await vi.advanceTimersByTimeAsync(0)
  await vi.advanceTimersByTimeAsync(0)
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  replace.mockClear()
  assign.mockClear()
  vi.stubGlobal('location', { ...window.location, protocol: 'http:', hostname: '192.168.1.50', pathname: '/', search: '', hash: '#/', replace, assign })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('SecureAddressBanner', () => {
  it('moves this tab to a proven address for a browser that never chose', async () => {
    network(true)
    const wrapper = await mountBanner()
    expect(replace).toHaveBeenCalledWith(`https://${NAME}/#/`)
    expect(assign).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="secure-address"]').exists()).toBe(false)
  })

  it('never moves to an address the probe did not prove', async () => {
    network(false)
    const wrapper = await mountBanner()
    expect(replace).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="secure-address"]').exists()).toBe(false)
  })

  it('stays when the person said stay here, and asks nothing', async () => {
    setSwitchesAutomatically(false)
    network(true)
    await mountBanner()
    expect(replace).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows the banner instead of moving when the proof arrives late', async () => {
    network(true, AUTO_SWITCH_WITHIN_MS + 500)
    const wrapper = shallowMount(SecureAddressBanner as any, {
      mocks: { $store: { state: { files: { uploads: [] } } } },
      stubs: { 'frame-icon': true, 'app-btn': true }
    })
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(replace).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="secure-address"]').exists()).toBe(true)
  })

  it('shows the banner instead of moving while an upload is running', async () => {
    network(true)
    const wrapper = await mountBanner([{ filepath: 'a.gcode', complete: false, cancelled: false }])
    expect(replace).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="secure-address"]').exists()).toBe(true)
  })
})
