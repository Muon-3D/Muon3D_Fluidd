import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BLUETOOTH_NOT_CONNECTED_MESSAGE, bluetoothUnavailable, pinnedBluetoothError } from '@/services/muon-ble/refusal'
import { EID, OTHER_EID, fakeEndpoint, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

// The muon-link-web module, mocked: every endpoint it binds writes to one log, in order.
const wasm = vi.hoisted(() => ({
  log: [] as string[],
  made: [] as any[],
  connect: null as null | ((n: number, id: string) => Promise<unknown>),
  create: null as any
}))
vi.mock('../vendor/muon-link-web/2273ba0/muon_link_web.js', () => ({
  default: async () => {},
  MuonEndpoint: { create: (...args: unknown[]) => wasm.create(...args) }
}))

const RELAY = 'https://relay.example.test'
const session = (printerId: string) => ({ relayUrl: RELAY, printerId, tenantId: 't', expiresAt: '' }) as any

beforeEach(() => {
  wasm.log.length = 0
  wasm.made.length = 0
  wasm.connect = async (_n, id) => ({ printerId: () => id, close () {} })
  wasm.create = vi.fn(async () => {
    const n = wasm.made.length + 1
    const ble = fakeEndpoint()
    const ep: any = {
      ...ble.endpoint,
      n,
      closed: false,
      endpointId: () => 'browser',
      secretKey: () => new Uint8Array(32).fill(7),
      pinBluetooth: vi.fn((id: string, pinned: boolean) => { wasm.log.push(`pin#${n} ${pinned}`) }),
      connect: vi.fn(async (id: string) => { wasm.log.push(`connect#${n} ${id.slice(0, 4)}`); return wasm.connect!(n, id) }),
      async close () { ep.closed = true; wasm.log.push(`close#${n}`) }
    }
    const addLink = ep.addLink
    ep.addLink = vi.fn((...a: any[]) => { wasm.log.push(`addLink#${n}`); return addLink(...a) })
    wasm.log.push(`bind#${n}`)
    wasm.made.push(ep)
    return ep
  })
  vi.resetModules()
})

// Fresh modules per test: the tab's endpoint and the Bluetooth choices are module state.
let ble: typeof import('@/services/muon-ble/link')

afterEach(() => {
  ble?.stopUsingBluetoothFor(EID)
  ble?.stopUsingBluetoothFor(OTHER_EID)
  localStorage.clear()
})

async function load () {
  ble = await import('@/services/muon-ble/link')
  return await import('../iroh')
}
const useBluetoothFor = (id: string, device: any) => ble.useBluetoothFor(id, device)
const stopUsingBluetoothFor = (id: string) => ble.stopUsingBluetoothFor(id)

describe('an explicit Bluetooth connect after a cloud session (KAN-2531)', () => {
  it('closes the endpoint and binds a new one before the link and the dial', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    expect(wasm.log).toEqual(['bind#1', `connect#1 ${EID.slice(0, 4)}`])

    // The person chose Connect over Bluetooth; the cloud session was dropped.
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))

    expect(wasm.log).toEqual([
      'bind#1', `connect#1 ${EID.slice(0, 4)}`,
      'close#1', 'bind#2',
      'pin#2 true', 'addLink#2', `connect#2 ${EID.slice(0, 4)}`
    ])
    expect(wasm.made[0].closed).toBe(true)
    expect(wasm.made[1].closed).toBe(false)
  })

  it('keeps the same key on the new endpoint', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    expect(wasm.create).toHaveBeenCalledTimes(2)
    expect((wasm.create.mock.calls[0] as unknown[])[0]).toBe(RELAY)
  })

  it('negative control: a printer with no cloud session before keeps the tab endpoint', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    expect(wasm.log).toEqual(['bind#1', 'pin#1 true', 'addLink#1', `connect#1 ${EID.slice(0, 4)}`])
  })

  it('a cloud session of another printer does not cost this one a new endpoint, and is not dropped by it', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(OTHER_EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(1)
    expect(wasm.made[0].closed).toBe(false)
  })

  it('a plain cloud open never rebinds the endpoint', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(1)
  })

  it('a later cloud dial after the Bluetooth one lands on the new endpoint', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    stopUsingBluetoothFor(EID)
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(2)
    expect(wasm.log[wasm.log.length - 1]).toBe(`connect#2 ${EID.slice(0, 4)}`)
  })
})

describe('the error kind "bluetooth" (muon-link#145)', () => {
  it('is recognised, and only that kind', () => {
    expect(bluetoothUnavailable({ kind: 'bluetooth' })).toBe(true)
    expect(bluetoothUnavailable({ kind: 'refused', code: 1033 })).toBe(false)
    expect(bluetoothUnavailable(new Error('x'))).toBe(false)
    expect(bluetoothUnavailable(null)).toBe(false)
  })

  it('becomes a plain message that says Muon3D was not used; other errors pass through', () => {
    const mapped = pinnedBluetoothError({ kind: 'bluetooth', message: 'pinned printer has no link' }) as Error
    expect(mapped.message).toBe(BLUETOOTH_NOT_CONNECTED_MESSAGE)
    expect(mapped.message).toMatch(/try again/i)
    const other = new Error('boom')
    expect(pinnedBluetoothError(other)).toBe(other)
  })

  it('reaches the person from an open: the dial rejects with that message', async () => {
    const { managedEndpointFactory } = await load()
    wasm.connect = async () => { throw Object.assign(new Error('no link'), { kind: 'bluetooth' }) }
    const factory = await managedEndpointFactory()
    await expect(factory.openRelay(session(EID))).rejects.toThrow(BLUETOOTH_NOT_CONNECTED_MESSAGE)
  })
})
