import { afterEach, describe, expect, it } from 'vitest'
import {
  bluetoothAvailable,
  bluetoothSupport,
  choosePrinter,
  chooserDismissed,
  decodeAdvert,
  decodeInfo,
  displayName,
  MUON_BLE_COMPANY_ID,
  MUON_BLE_SERVICE,
  rememberedDevices
} from '../webBluetooth'
import { advert, EID, fakeBluetooth, fakePrinter, info, removeBluetooth } from './fakes'

afterEach(removeBluetooth)

describe('decodeInfo (Iroh_BLE INFO)', () => {
  it('reads the EndpointId, the segment size and the capability bits', () => {
    expect(decodeInfo(info(0x02, 244))).toEqual({
      version: 1, maxSegment: 244, endpointId: EID, l2cap: false, writeWithResponse: true
    })
    expect(decodeInfo(info(0x01))?.l2cap).toBe(true)
  })

  it('refuses a short value and another version', () => {
    expect(decodeInfo(info().slice(0, 37))).toBeNull()
    const v2 = info()
    v2[0] = 2
    expect(decodeInfo(v2)).toBeNull()
  })

  it('accepts a longer value, as later versions may add fields', () => {
    const longer = new Uint8Array(45)
    longer.set(info())
    expect(decodeInfo(longer)?.endpointId).toBe(EID)
  })
})

describe('decodeAdvert (manufacturer data after the company id)', () => {
  it('reads the flags and the EndpointId prefix', () => {
    expect(decodeAdvert(advert(0x01))).toEqual({ unclaimed: true, busy: false, endpointPrefix: EID.slice(0, 16) })
    expect(decodeAdvert(advert(0x02))).toEqual({ unclaimed: false, busy: true, endpointPrefix: EID.slice(0, 16) })
  })

  it('refuses nothing, a short value and another version', () => {
    expect(decodeAdvert(undefined)).toBeNull()
    expect(decodeAdvert(new DataView(new Uint8Array([1, 1, 0]).buffer))).toBeNull()
    const v2 = advert(0)
    v2.setUint8(0, 2)
    expect(decodeAdvert(v2)).toBeNull()
  })
})

describe('displayName', () => {
  it("shows an advertised name as the printer's screen does (ADR 0032 D6)", () => {
    expect(displayName('walnut-8987')).toBe('Walnut · 8987')
    expect(displayName('Muon-boxwood-367A')).toBe('Boxwood · 367a')
  })

  it("leaves a name that is not an M1's alone", () => {
    expect(displayName('Muon3D-3fa9x')).toBeNull()
    expect(displayName(null)).toBeNull()
  })
})

describe('choosePrinter', () => {
  it('asks the chooser for the Muon service and its manufacturer data, reads INFO once and hangs up', async () => {
    const printer = fakePrinter()
    const { requests } = fakeBluetooth({ chosen: printer.device })
    const chosen = await choosePrinter()
    expect(chosen.name).toBe('walnut-8987')
    expect(chosen.info.endpointId).toBe(EID)
    expect(requests).toEqual([{
      filters: [{ services: [MUON_BLE_SERVICE] }],
      optionalManufacturerData: [MUON_BLE_COMPANY_ID]
    }])
    expect(printer.calls).toEqual(['connect', `service ${MUON_BLE_SERVICE}`, 'read INFO', 'disconnect'])
  })

  it('hangs up even when INFO cannot be decoded', async () => {
    const printer = fakePrinter({ infoValue: new Uint8Array([9, 9, 9]) })
    fakeBluetooth({ chosen: printer.device })
    await expect(choosePrinter()).rejects.toThrow(/INFO/)
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })

  it('tells a dismissed chooser apart from a failure', async () => {
    fakeBluetooth()
    const error = await choosePrinter().catch(e => e)
    expect(chooserDismissed(error)).toBe(true)
    expect(chooserDismissed(new Error('GATT failed'))).toBe(false)
  })
})

describe('what the browser offers', () => {
  it('needs Web Bluetooth', () => {
    expect(bluetoothSupport()).toEqual({ supported: false, reason: 'unsupported' })
    fakeBluetooth()
    expect(bluetoothSupport()).toEqual({ supported: true })
  })

  it("says the adapter's state only where the browser can tell", async () => {
    fakeBluetooth()
    expect(await bluetoothAvailable()).toBeNull()
    fakeBluetooth({ available: false })
    expect(await bluetoothAvailable()).toBe(false)
    removeBluetooth()
    expect(await bluetoothAvailable()).toBe(false)
  })

  it('lists remembered devices only where the browser keeps them', async () => {
    fakeBluetooth()
    expect(await rememberedDevices()).toEqual([])
    const printer = fakePrinter()
    fakeBluetooth({ remembered: [printer.device] })
    expect(await rememberedDevices()).toEqual([printer.device])
  })
})
