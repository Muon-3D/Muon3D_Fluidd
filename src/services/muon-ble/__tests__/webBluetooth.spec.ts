import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bluetoothAvailable,
  advertMatch,
  bluetoothSupport,
  choosePrinter,
  chooserOptions,
  chooserDismissed,
  decodeAdvert,
  decodeInfo,
  displayName,
  MUON_BLE_COMPANY_ID,
  MUON_BLE_SERVICE,
  rememberedDevices
} from '../webBluetooth'
import { advert, EID, fakeBluetooth, fakePrinter, info, OTHER_EID, removeBluetooth } from './fakes'

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

describe('choosePrinter after the pairing prompt (KAN-1396)', () => {
  it('reads INFO again once when the first read fails while the browser finishes pairing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      let first = true
      const connect = printer.device.gatt.connect
      printer.device.gatt.connect = async () => {
        if (first) { first = false; throw Object.assign(new Error('GATT Error: pairing in progress'), { name: 'NetworkError' }) }
        return connect()
      }
      fakeBluetooth({ chosen: printer.device })
      const chosen = choosePrinter()
      await vi.advanceTimersByTimeAsync(2000)
      expect((await chosen).info.endpointId).toBe(EID)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('chooserOptions (KAN-2470)', () => {
  const only = (o: Record<string, any>) => { expect(o.filters).toHaveLength(1); return o.filters[0] }

  it('with neither id nor name lists every Muon printer, as before', () => {
    expect(chooserOptions()).toEqual({ filters: [{ services: [MUON_BLE_SERVICE] }], optionalManufacturerData: [MUON_BLE_COMPANY_ID] })
    expect(chooserOptions({})).toEqual(chooserOptions())
  })

  it("with an EndpointId ANDs the service with that printer's manufacturer data, ignoring the flags", () => {
    const f = only(chooserOptions({ endpointId: EID, name: 'walnut-8987' }))
    expect(f.services).toEqual([MUON_BLE_SERVICE])
    expect(f.name).toBeUndefined()
    expect(f.manufacturerData).toHaveLength(1)
    const m = f.manufacturerData[0]
    expect(m.companyIdentifier).toBe(0xffff)
    expect(Array.from(m.mask)).toEqual([0, 0, ...Array(8).fill(0xff)])
    expect(m.dataPrefix).toHaveLength(10)
  })

  it('builds the prefix in the layout decodeAdvert reads (bytes 2 to 9)', () => {
    const { dataPrefix, mask } = advertMatch(EID)!
    const matches = (view: DataView) => {
      const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
      return bytes.every((b, i) => (b & mask[i]) === (dataPrefix[i] & mask[i]))
    }
    // A real advertisement matches under the mask whatever its flags.
    for (const flags of [0, 1, 2, 3]) expect(matches(advert(flags))).toBe(true)
    expect(decodeAdvert(advert(1))!.endpointPrefix).toBe(Array.from(dataPrefix.slice(2), b => b.toString(16).padStart(2, '0')).join(''))
    // Another printer's advertisement does not.
    expect(matches(advert(1, OTHER_EID))).toBe(false)
  })

  it('with only a name matches that name exactly', () => {
    expect(only(chooserOptions({ name: 'walnut-8987' }))).toEqual({ services: [MUON_BLE_SERVICE], name: 'walnut-8987' })
  })

  it('falls back to the name, or to every printer, when the id is not usable', () => {
    expect(only(chooserOptions({ endpointId: 'zz', name: 'walnut-8987' })).name).toBe('walnut-8987')
    expect(only(chooserOptions({ endpointId: 'zz' }))).toEqual({ services: [MUON_BLE_SERVICE] })
  })
})

describe('choosePrinter with a target', () => {
  it('asks the browser for only that printer, and reads INFO from the pick', async () => {
    const printer = fakePrinter()
    const { requests } = fakeBluetooth({ chosen: printer.device })
    const chosen = await choosePrinter({ endpointId: EID })
    expect(requests).toEqual([chooserOptions({ endpointId: EID })])
    expect(chosen.info.endpointId).toBe(EID)
  })

  it('asks for every Muon printer with no target', async () => {
    const { requests } = fakeBluetooth({ chosen: fakePrinter().device })
    await choosePrinter()
    expect(requests).toEqual([chooserOptions()])
    expect((requests[0] as any).filters[0].manufacturerData).toBeUndefined()
  })
})
