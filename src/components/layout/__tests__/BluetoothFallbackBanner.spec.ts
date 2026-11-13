import { afterEach, describe, expect, it } from 'vitest'
import { mount as vueMount } from '@vue/test-utils'
import BluetoothFallbackBanner from '../BluetoothFallbackBanner.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { noteBluetoothDropped, noteBluetoothFellBack, stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { chooseRouteMode } from '@/services/muon-cloud/route-choice'
import { EID, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

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
})
