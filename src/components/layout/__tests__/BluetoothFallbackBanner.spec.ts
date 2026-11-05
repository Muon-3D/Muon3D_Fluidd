import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BluetoothFallbackBanner from '../BluetoothFallbackBanner.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { noteBluetoothFellBack, stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { EID, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

afterEach(() => {
  stopUsingBluetoothFor(EID)
  cloudState.activePrinterId = null
})

describe('the Bluetooth fallback banner (KAN-1396)', () => {
  it('says plainly that Muon3D carries the session when Bluetooth did not connect', () => {
    cloudState.activePrinterId = EID
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothFellBack(EID, 'The Bluetooth handshake timed out')
    const text = mount(BluetoothFallbackBanner).text()
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
})
