import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import WifiManagerCard from '../WifiManagerCard.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

const api = vi.hoisted(() => ({
  wifiScanWifiScanGet: vi.fn(),
  wifiStatusWifiDeviceStatusGet: vi.fn(),
  wifiDeviceDownWifiDeviceDownPost: vi.fn(),
  wifiDeviceUpWifiDeviceUpPost: vi.fn(),
  getDetailsWifiShowGet: vi.fn()
}))
const emit = vi.hoisted(() => vi.fn())
vi.mock('@/aux_api/useAuxApi', () => ({ useAuxApi: () => ({ wifi: api }) }))
vi.mock('@/aux_api/useHotspotCheck', () => ({ useHotspotCheck: () => ({ onHotspot: { value: false } }) }))
vi.mock('@/eventBus', () => ({ EventBus: { $emit: emit } }))
const network = { ssid: 'Studio', bssid: 'aa:bb', signal: 80, in_use: true, security: 'WPA2', rate: 100, chan: 6, freq: 2437 }
const status = (on: boolean) => ({ data: { state: on ? 'connected' : 'disconnected', user_disconnected: !on } })
const settle = () => new Promise(resolve => setTimeout(resolve, 0))
function view () {
  return shallowMount(WifiManagerCard, { stubs: { 'toggle-switch': ToggleSwitch }, mocks: { $t: (s: string) => s, $store: { getters: { 'protection/isLocked': false }, dispatch: vi.fn() } } })
}
enableAutoDestroy(afterEach)
beforeEach(() => {
  vi.clearAllMocks()
  api.wifiScanWifiScanGet.mockResolvedValue({ data: [network] })
  api.wifiStatusWifiDeviceStatusGet.mockResolvedValue(status(true))
  api.getDetailsWifiShowGet.mockResolvedValue({ data: {} })
})

it('collapses immediately while a slow disable is pending, then rolls back on refusal', async () => {
  const wrapper = view()
  await settle()
  let refuse!: (e: Error) => void
  api.wifiDeviceDownWifiDeviceDownPost.mockImplementation(() => new Promise((resolve, reject) => { refuse = reject }))
  const started = performance.now()
  await wrapper.find('[data-tid="wifi-toggle"]').trigger('click')
  expect(performance.now() - started).toBeLessThan(200)
  expect(wrapper.text()).toContain('Wi-Fi is off')
  expect(wrapper.find('[data-tid="wifi-networks"]').exists()).toBe(false)
  refuse(new Error('refused'))
  await settle()
  expect(wrapper.find('[data-tid="wifi-networks"]').text()).toContain('Studio')
  expect(emit).toHaveBeenCalledWith(expect.stringContaining('Could not turn Wi-Fi off'), expect.anything())
})

it('keeps rows while Search again scans and replaces them only when results arrive', async () => {
  const wrapper = view()
  await settle()
  let finish!: (v: unknown) => void
  api.wifiScanWifiScanGet.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  await wrapper.find('[data-tid="wifi-refresh"]').trigger('click')
  await settle()
  expect(api.wifiScanWifiScanGet).toHaveBeenLastCalledWith(true, { params: { force: true } })
  expect(wrapper.text()).toContain('Scanning')
  expect(wrapper.find('[data-tid="wifi-networks"]').text()).toContain('Studio')
  finish({ data: [{ ...network, ssid: 'New network', bssid: 'cc:dd' }] })
  await settle()
  expect(wrapper.text()).toContain('New network')
  expect(wrapper.text()).not.toContain('Studio')
})

it('shows the off line after confirming a successful disable', async () => {
  const wrapper = view()
  await settle()
  api.wifiDeviceDownWifiDeviceDownPost.mockResolvedValue({ data: { status: 'down' } })
  api.wifiStatusWifiDeviceStatusGet.mockResolvedValue(status(false))
  await wrapper.find('[data-tid="wifi-toggle"]').trigger('click')
  await settle()
  expect(wrapper.text()).toContain('Wi-Fi is off')
  expect(wrapper.find('[data-tid="wifi-refresh"]').exists()).toBe(false)
})

it('turns on immediately, then confirms before starting a separate scan', async () => {
  api.wifiStatusWifiDeviceStatusGet.mockResolvedValue(status(false))
  const wrapper = view()
  await settle()
  expect(api.wifiScanWifiScanGet).not.toHaveBeenCalled()
  let finish!: (v: unknown) => void
  api.wifiDeviceUpWifiDeviceUpPost.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const started = performance.now()
  await wrapper.find('[data-tid="wifi-toggle"]').trigger('click')
  const elapsed = performance.now() - started
  console.info(`Control optimistic enable: ${elapsed.toFixed(1)} ms (API pending)`)
  expect(elapsed).toBeLessThan(200)
  expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
  api.wifiStatusWifiDeviceStatusGet.mockResolvedValue(status(true))
  finish({ data: { status: 'up' } })
  await settle()
  expect(api.wifiScanWifiScanGet).toHaveBeenLastCalledWith(true, { params: { force: true } })
})

it('keeps results and reports a failed manual scan', async () => {
  const wrapper = view()
  await settle()
  api.wifiScanWifiScanGet.mockRejectedValue(new Error('scan failed'))
  await wrapper.find('[data-tid="wifi-refresh"]').trigger('click')
  await settle()
  expect(wrapper.find('[data-tid="wifi-networks"]').text()).toContain('Studio')
  expect(wrapper.find('[role="alert"]').text()).toContain('Could not search')
  expect(wrapper.find('[data-tid="wifi-refresh"]').attributes('disabled')).toBeUndefined()
})
