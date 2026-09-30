/**
 * A fake Web Bluetooth printer and a fake muon-link-web link, for the
 * muon-ble specs. The printer answers a `HELLO` written to RX (byte 1) with a
 * reply notified on TX (byte 2); the fake link resolves `connected()` when it
 * hears that reply, so the driver's pump is exercised in both directions.
 */
import { vi } from 'vitest'
import { MUON_BLE_INFO, MUON_BLE_RX, MUON_BLE_SERVICE, MUON_BLE_TX } from '../webBluetooth'

export const EID = '3fa9c0de'.repeat(8)
export const OTHER_EID = '9b1e44a0'.repeat(8)

/** An Iroh_BLE INFO value: version 1, caps, psm 0, max segment, EndpointId. */
export function info (caps = 0, maxSegment = 182, eid = EID): Uint8Array {
  const bytes = new Uint8Array(38)
  bytes[0] = 1
  bytes[1] = caps
  bytes[4] = maxSegment & 0xff
  bytes[5] = maxSegment >> 8
  for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt(eid.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

/** Muon's manufacturer data after the company id: version, flags, EndpointId prefix. */
export function advert (flags: number, eid = EID): DataView {
  const bytes = new Uint8Array(10)
  bytes[0] = 1
  bytes[1] = flags
  for (let i = 0; i < 8; i++) bytes[2 + i] = parseInt(eid.slice(i * 2, i * 2 + 2), 16)
  return new DataView(bytes.buffer)
}

export interface FakePrinterOptions {
  id?: string;
  name?: string | null;
  infoValue?: Uint8Array;
  /** Whether the printer answers HELLO. */
  answers?: boolean;
  /** Offer `watchAdvertisements`. */
  watch?: boolean;
}

export function fakePrinter (opts: FakePrinterOptions = {}) {
  const calls: string[] = []
  const written: Uint8Array[] = []
  const device = new EventTarget() as EventTarget & Record<string, any>
  const tx = new EventTarget() as EventTarget & Record<string, any>
  let connected = false
  const notify = (bytes: Uint8Array) => {
    tx.value = new DataView(bytes.slice().buffer)
    tx.dispatchEvent(new Event('characteristicvaluechanged'))
  }
  tx.readValue = async () => new DataView(new ArrayBuffer(0))
  tx.startNotifications = async () => { calls.push('notify') }
  const rx = {
    properties: { writeWithoutResponse: true, write: true },
    readValue: async () => new DataView(new ArrayBuffer(0)),
    writeValueWithoutResponse: async (value: Uint8Array) => {
      const bytes = new Uint8Array(value)
      written.push(bytes)
      if (bytes[0] === 1 && opts.answers !== false) setTimeout(() => notify(new Uint8Array([2])), 0)
    }
  }
  const infoChar = {
    readValue: async () => {
      calls.push('read INFO')
      const v = opts.infoValue ?? info()
      return new DataView(v.slice().buffer)
    }
  }
  const server = {
    get connected () { return connected },
    connect: async () => { calls.push('connect'); connected = true; return server },
    disconnect: () => {
      calls.push('disconnect')
      if (!connected) return
      connected = false
      device.dispatchEvent(new Event('gattserverdisconnected'))
    },
    getPrimaryService: async (uuid: string) => {
      calls.push(`service ${uuid}`)
      if (uuid !== MUON_BLE_SERVICE) throw new Error('no such service')
      return {
        getCharacteristic: async (c: string) => {
          if (c === MUON_BLE_INFO) return infoChar
          if (c === MUON_BLE_RX) return rx
          if (c === MUON_BLE_TX) return tx
          throw new Error('no such characteristic')
        }
      }
    }
  }
  device.id = opts.id ?? 'dev-walnut'
  device.name = opts.name === undefined ? 'walnut-8987' : opts.name
  device.gatt = server
  if (opts.watch) {
    device.watchAdvertisements = vi.fn(async () => { calls.push('watch') })
  }
  /** Sends an advertisement, as the browser does for a watched device. */
  const advertise = (manufacturer: DataView | null, name = device.name) => {
    const event = new Event('advertisementreceived') as Event & Record<string, any>
    event.device = device
    event.name = name
    event.manufacturerData = new Map(manufacturer ? [[0xffff, manufacturer]] : [])
    device.dispatchEvent(event)
  }
  return { device: device as any, calls, written, notify, advertise, drop: () => server.disconnect() }
}

/** Installs `navigator.bluetooth`, choosing `chosen` from the chooser. */
export function fakeBluetooth (opts: { chosen?: any, remembered?: any[], available?: boolean | null } = {}) {
  const requests: unknown[] = []
  const bt = new EventTarget() as EventTarget & Record<string, any>
  bt.requestDevice = vi.fn(async (options: unknown) => {
    requests.push(options)
    if (!opts.chosen) throw Object.assign(new Error('User cancelled'), { name: 'NotFoundError' })
    return opts.chosen
  })
  if (opts.remembered) bt.getDevices = async () => opts.remembered
  if (opts.available !== null && opts.available !== undefined) bt.getAvailability = async () => opts.available
  Object.defineProperty(navigator, 'bluetooth', { value: bt, configurable: true })
  return { bt, requests }
}

export function removeBluetooth () {
  delete (navigator as unknown as { bluetooth?: unknown }).bluetooth
}

/** A muon-link-web endpoint whose links finish HELLO when the printer's reply arrives. */
export function fakeEndpoint (printerId = EID) {
  const links: any[] = []
  const endpoint = {
    addLink: vi.fn((role: string, maxSegment?: number) => {
      const queue: Uint8Array[] = []
      let wake: (() => void) | null = null
      let closed = false
      let resolveConnected: (id: string) => void = () => {}
      const connected = new Promise<string>(resolve => { resolveConnected = resolve })
      const push = (s: Uint8Array) => { queue.push(s); wake?.() }
      const link = {
        role,
        maxSegment,
        received: [] as Uint8Array[],
        onSegment (s: Uint8Array) {
          link.received.push(s)
          if (s[0] === 2) resolveConnected(printerId)
        },
        async nextSegment () {
          for (;;) {
            if (queue.length) return queue.shift()
            if (closed) return undefined
            await new Promise<void>(resolve => { wake = resolve })
            wake = null
          }
        },
        connected: () => connected,
        retryHandshake: () => { if (!closed) push(new Uint8Array([1])); return !closed },
        isClosed: () => closed,
        close () { if (!closed) { push(new Uint8Array([3])); closed = true } },
        onDisconnected () { closed = true; wake?.() }
      }
      links.push(link)
      return link
    })
  }
  return { endpoint, links }
}
