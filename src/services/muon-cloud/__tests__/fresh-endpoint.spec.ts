import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BLUETOOTH_NOT_CONNECTED_MESSAGE, bluetoothUnavailable, pinnedBluetoothError } from '@/services/muon-ble/refusal'
import { EID, OTHER_EID, fakeEndpoint, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

// The muon-link-web module, mocked: every endpoint it binds writes to one log, in order.
const wasm = vi.hoisted(() => ({
  log: [] as string[],
  made: [] as any[],
  connect: null as null | ((n: number, id: string) => Promise<unknown>),
  /** Holds close() until a test lets it go. */
  closeGate: null as null | Promise<void>,
  closeFails: false,
  create: null as any
}))
vi.mock('../vendor/muon-link-web/1608e20/muon_link_web.js', () => ({
  default: async () => {},
  MuonEndpoint: { create: (...args: unknown[]) => wasm.create(...args) }
}))

// Stand-ins for what pairing, setup and state register in endpoint-hooks (iroh.ts imports none of them: KAN-2531 cycle check).
const others = { pairing: false, setup: false, dropped: [] as string[] }

const RELAY = 'https://relay.example.test'
const session = (printerId: string) => ({ relayUrl: RELAY, printerId, tenantId: 't', expiresAt: '' }) as any

beforeEach(() => {
  others.pairing = false
  others.setup = false
  others.dropped.length = 0
  wasm.closeGate = null
  wasm.closeFails = false
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
      async close () {
        wasm.log.push(`close#${n}`)
        if (wasm.closeGate) await wasm.closeGate
        if (wasm.closeFails) throw new Error('close failed')
        ep.closed = true
        wasm.log.push(`closed#${n}`)
      },
      free: vi.fn(() => { wasm.log.push(`free#${n}`) })
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
  const hooks = await import('../endpoint-hooks')
  hooks.resetEndpointHooks()
  hooks.registerEndpointBusy(() => others.pairing)
  hooks.registerEndpointBusy(() => others.setup)
  hooks.onEndpointRebound(id => { others.dropped.push(id) })
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
      'close#1', 'closed#1', 'free#1', 'bind#2',
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
    expect((wasm.create.mock.calls[1] as unknown[])[0]).toBe(RELAY)
    // The second endpoint is made from the first one's secret key, so the console still knows it.
    const firstKey = wasm.made[0].secretKey()
    expect(firstKey).toEqual(new Uint8Array(32).fill(7))
    expect((wasm.create.mock.calls[1] as unknown[])[1]).toEqual(firstKey)
  })

  it('binds the new endpoint only after the old one has finished closing', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    let release: () => void = () => {}
    wasm.closeGate = new Promise<void>(resolve => { release = resolve })
    useBluetoothFor(EID, fakePrinter().device)
    const opening = factory.openRelay(session(EID))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(wasm.log).toContain('close#1')
    expect(wasm.log).not.toContain('closed#1')
    expect(wasm.log).not.toContain('bind#2')
    release()
    await opening
    expect(wasm.log.indexOf('bind#2')).toBeGreaterThan(wasm.log.indexOf('closed#1'))
  })

  it('a close that fails is logged and the old endpoint abandoned; the new one still binds', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { managedEndpointFactory } = await load()
      const factory = await managedEndpointFactory()
      await factory.openRelay(session(EID))
      wasm.closeFails = true
      useBluetoothFor(EID, fakePrinter().device)
      await factory.openRelay(session(EID))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('closing the old endpoint failed'))
      expect(wasm.log).toContain('bind#2')
      expect(wasm.log.indexOf('bind#2')).toBeGreaterThan(wasm.log.indexOf('close#1'))
      expect(wasm.made[0].free).toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('a retry after the session landed on the relay gets another fresh endpoint', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    // "Connect over Bluetooth again": this endpoint dialled the printer already, whatever route that took.
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(3)
    expect(wasm.made[1].closed).toBe(true)
    expect(wasm.made[2].closed).toBe(false)
  })

  it('does not replace the endpoint while a pairing runs, and says why', async () => {
    const { managedEndpointFactory, REBIND_BUSY_MESSAGE } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(EID))
    useBluetoothFor(EID, fakePrinter().device)
    others.pairing = true
    await expect(factory.openRelay(session(EID))).rejects.toThrow(REBIND_BUSY_MESSAGE)
    expect(wasm.made).toHaveLength(1)
    expect(wasm.made[0].closed).toBe(false)
    others.pairing = false
    others.setup = true
    await expect(factory.openRelay(session(EID))).rejects.toThrow(REBIND_BUSY_MESSAGE)
    expect(wasm.made).toHaveLength(1)
    others.setup = false
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(2)
  })

  it('two printers: A on the cloud, then Bluetooth for B that the endpoint never dialled, touches nothing', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(OTHER_EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    expect(wasm.made).toHaveLength(1)
    expect(others.dropped).toEqual([])
  })

  it('two printers: Bluetooth for B that was dialled too replaces the endpoint, drops the others, and A recovers on the new one', async () => {
    const { managedEndpointFactory } = await load()
    const factory = await managedEndpointFactory()
    await factory.openRelay(session(OTHER_EID))
    await factory.openRelay(session(EID))
    useBluetoothFor(EID, fakePrinter().device)
    await factory.openRelay(session(EID))
    expect(wasm.made[0].closed).toBe(true)
    // Everything but B is told to dial again, B's own dial is the one in progress.
    expect(others.dropped).toEqual([EID])
    const again = await factory.openRelay(session(OTHER_EID))
    expect(again).toBeDefined()
    expect(wasm.log[wasm.log.length - 1]).toBe(`connect#2 ${OTHER_EID.slice(0, 4)}`)
    expect(wasm.made).toHaveLength(2)
    expect(wasm.made[1].closed).toBe(false)
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
