import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bluetoothSupport,
  chooserDismissed,
  decodeInfo,
  findPrinterOverBluetooth,
  MUON_BLE_INFO,
  MUON_BLE_SERVICE
} from '../webBluetooth'

const EID = '3fa9c0de'.repeat(8)

/** An Iroh_BLE INFO value: version 1, caps, psm 0, max segment, EndpointId. */
function info (caps = 0, maxSegment = 182, eid = EID): Uint8Array {
  const bytes = new Uint8Array(38)
  bytes[0] = 1
  bytes[1] = caps
  bytes[4] = maxSegment & 0xff
  bytes[5] = maxSegment >> 8
  for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt(eid.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function fakeBluetooth (value: Uint8Array, name: string | null = 'Muon3D-3fa9') {
  const calls: string[] = []
  const bt = {
    requestDevice: vi.fn(async (options: unknown) => {
      calls.push(`request ${JSON.stringify(options)}`)
      return {
        name,
        gatt: {
          connect: async () => {
            calls.push('connect')
            return {
              getPrimaryService: async (uuid: string) => {
                calls.push(`service ${uuid}`)
                return {
                  getCharacteristic: async (c: string) => {
                    calls.push(`characteristic ${c}`)
                    return { readValue: async () => new DataView(value.buffer) }
                  }
                }
              }
            }
          },
          disconnect: () => calls.push('disconnect')
        }
      }
    })
  }
  Object.defineProperty(navigator, 'bluetooth', { value: bt, configurable: true })
  return calls
}

afterEach(() => {
  delete (navigator as unknown as { bluetooth?: unknown }).bluetooth
})

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

describe('findPrinterOverBluetooth', () => {
  it('asks the chooser for the Muon service, reads INFO once and hangs up', async () => {
    const calls = fakeBluetooth(info())
    const found = await findPrinterOverBluetooth()
    expect(found).toEqual({ name: 'Muon3D-3fa9', info: expect.objectContaining({ endpointId: EID }) })
    expect(calls).toEqual([
      `request ${JSON.stringify({ filters: [{ services: [MUON_BLE_SERVICE] }] })}`,
      'connect',
      `service ${MUON_BLE_SERVICE}`,
      `characteristic ${MUON_BLE_INFO}`,
      'disconnect'
    ])
  })

  it('hangs up even when INFO cannot be decoded', async () => {
    const calls = fakeBluetooth(new Uint8Array([9, 9, 9]))
    await expect(findPrinterOverBluetooth()).rejects.toThrow(/INFO/)
    expect(calls[calls.length - 1]).toBe('disconnect')
  })

  it('tells a dismissed chooser apart from a failure', () => {
    expect(chooserDismissed(Object.assign(new Error('x'), { name: 'NotFoundError' }))).toBe(true)
    expect(chooserDismissed(new Error('GATT failed'))).toBe(false)
  })
})

describe('bluetoothSupport', () => {
  it('needs Web Bluetooth', () => {
    expect(bluetoothSupport()).toEqual({ supported: false, reason: 'unsupported' })
    fakeBluetooth(info())
    expect(bluetoothSupport()).toEqual({ supported: true })
  })
})
