import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount as vueMount } from '@vue/test-utils'
import BluetoothFallbackBanner from '../BluetoothFallbackBanner.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { bluetoothDropped, noteBluetoothDropped, noteBluetoothFellBack, stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { autoRetryDelay, chooseRouteMode, noteUserOpen, routeMode } from '@/services/muon-cloud/route-choice'
import { clearRelayChoice, relayChosen } from '@/services/secure-origin/hosted'
import { EID, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

vi.mock('@/services/muon-cloud/activate', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/muon-cloud/activate')>(),
  activateCloudPrinter: vi.fn(async () => {})
}))

const OTHER = '9b1e44a0'.repeat(8)

const store = { state: { socket: { open: false }, config: { apiUrl: '' }, printer: { printer: {} } }, getters: new Proxy({}, { get: () => undefined }), dispatch: () => Promise.resolve() }
type Options = Parameters<typeof vueMount>[1]
const mount = (c: typeof BluetoothFallbackBanner, options: Options = {}) =>
  vueMount(c, { ...options, mocks: { $store: store, $filters: { prettyCase: (s: string) => s } } })

afterEach(() => {
  stopUsingBluetoothFor(EID)
  cloudState.activePrinterId = null
})

describe('the Bluetooth fallback banner (KAN-1396)', () => {
  it('says plainly that Muon3D carries the session when Bluetooth did not connect', () => {
    cloudState.activePrinterId = EID
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothFellBack(EID, 'The Bluetooth handshake timed out')
    const text = mount(BluetoothFallbackBanner, { stubs: { RouterLink: true } }).text()
    expect(text).toContain("Bluetooth didn't connect, using Muon3D instead")
    expect(text).toContain('The Bluetooth handshake timed out')
  })

  it('shows nothing when Bluetooth did connect, or for another printer', async () => {
    cloudState.activePrinterId = EID
    expect(mount(BluetoothFallbackBanner).text()).toBe('')
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothFellBack(EID, 'x')
    cloudState.activePrinterId = 'other'
    expect(mount(BluetoothFallbackBanner).text()).toBe('')
  })

  it('says the chosen Bluetooth route dropped, and offers no silent switch (KAN-1913)', () => {
    cloudState.activePrinterId = EID
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothDropped(EID, 'The Bluetooth link dropped.')
    const text = mount(BluetoothFallbackBanner, { stubs: { RouterLink: true } }).text()
    expect(text).toContain('Bluetooth dropped')
    expect(text).toContain('Choose how to connect')
    expect(text).not.toContain('using Muon3D instead')
  })

  it('offers the cloud and another try, and the local network only when it is reachable (KAN-2080)', () => {
    cloudState.activePrinterId = EID
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothDropped(EID, 'Nothing came over Bluetooth for 15 seconds.')
    const w = mount(BluetoothFallbackBanner)
    expect(w.find('[data-tid="bluetooth-dropped-cloud"]').text()).toBe('Connect via cloud')
    expect(w.find('[data-tid="bluetooth-dropped-ble"]').text()).toBe('Try Bluetooth again')
    expect(w.find('[data-tid="bluetooth-dropped-lan"]').exists()).toBe(false)
    expect(w.text()).toContain('Nothing came over Bluetooth for 15 seconds.')
  })

  it('keeps the sheet when the printer is no longer the open one, so a failed try never dead-ends', () => {
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothDropped(EID, 'The Bluetooth link dropped.')
    cloudState.activePrinterId = null
    const w = mount(BluetoothFallbackBanner)
    expect(w.text()).toContain('Bluetooth dropped')
    expect(w.find('[data-tid="bluetooth-dropped-ble"]').exists()).toBe(true)
  })
  it('keeps looking after a printer in auto mode when its dead session cleared the open printer (KAN-1913)', () => {
    const w = mount(BluetoothFallbackBanner)
    const vm = w.vm as any
    vm.entryFor = () => ({ cloud: { id: EID, online: true } })
    cloudState.activePrinterId = EID
    expect(vm.autoId).toBe(EID)
    vm.autoTick()
    // The relay went away; the failed reopen cleared the open printer.
    cloudState.activePrinterId = null
    expect(vm.autoId).toBe(EID)
    // A printer chosen explicitly is never taken over, and another open printer ends the watch.
    chooseRouteMode(EID, 'cloud')
    expect(vm.autoId).toBeNull()
    chooseRouteMode(EID, 'auto')
    chooseRouteMode('other', 'ble')
    cloudState.activePrinterId = 'other'
    vm.autoTick()
    cloudState.activePrinterId = null
    expect(vm.autoId).toBeNull()
  })

  it('retries a dropped route by itself only for the open printer, never one the person left (#370 review)', () => {
    const vm = mount(BluetoothFallbackBanner).vm as any
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothDropped(EID, 'The Bluetooth link dropped.')
    // Another printer is open: the dropped one is not dialled, and does not replace the open one.
    cloudState.activePrinterId = OTHER
    expect(vm.mayAutoRetry(EID)).toBe(false)
    // It is the open printer: it may be retried.
    cloudState.activePrinterId = EID
    expect(vm.mayAutoRetry(EID)).toBe(true)
  })

  it('forgets the dropped routes of other printers when the person opens a different printer', async () => {
    const w = mount(BluetoothFallbackBanner)
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothDropped(EID, 'The Bluetooth link dropped.')
    cloudState.activePrinterId = null
    noteUserOpen(OTHER)
    await w.vm.$nextTick()
    expect(bluetoothDropped(EID)).toBeNull()
    expect(w.text()).not.toContain('Bluetooth dropped')
  })

  it('backs off automatic retries: 30 s, then longer after each failure, reset by a success', () => {
    expect(autoRetryDelay(1)).toBe(30_000)
    expect(autoRetryDelay(2)).toBe(60_000)
    expect(autoRetryDelay(3)).toBe(120_000)
    expect(autoRetryDelay(99)).toBe(600_000)
    const vm = mount(BluetoothFallbackBanner).vm as any
    cloudState.activePrinterId = EID
    const t0 = Date.now()
    vm.noteAutoRetry(EID, true)
    expect(vm.mayAutoRetry(EID, t0 + 29_000)).toBe(false)
    expect(vm.mayAutoRetry(EID, t0 + 31_000)).toBe(true)
    vm.noteAutoRetry(EID, true)
    expect(vm.mayAutoRetry(EID, t0 + 31_000)).toBe(false)
    expect(vm.mayAutoRetry(EID, t0 + 61_000)).toBe(true)
    vm.noteAutoRetry(EID, false)
    expect(vm.mayAutoRetry(EID, t0)).toBe(true)
  })

  it('an auto move to the relay records no held choice and keeps no relay choice (#370 review)', async () => {
    const vm = mount(BluetoothFallbackBanner).vm as any
    const e = { key: 'k', name: 'M1', cloud: { id: EID, online: true } }
    vm.run = (_key: string, work: () => Promise<boolean>) => work()
    clearRelayChoice(EID)
    chooseRouteMode(EID, 'auto')
    await vm.openAuto(e, 'relay')
    expect(routeMode(EID)).toBe('auto')
    expect(relayChosen(EID)).toBe(false)
    // The person's own choice still is held.
    await vm.connectCloud(e, 'relay')
    expect(routeMode(EID)).toBe('cloud')
    expect(relayChosen(EID)).toBe(true)
    clearRelayChoice(EID)
    chooseRouteMode(EID, 'auto')
  })
})
