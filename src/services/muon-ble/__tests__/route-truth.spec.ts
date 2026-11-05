import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bluetoothCarrying,
  bluetoothFellBack,
  bluetoothLinkUp,
  CARRYING_WINDOW_MS,
  bluetoothRouteFor,
  releaseBluetoothLink,
  remoteRouteLabel,
  stopUsingBluetoothFor,
  useBluetoothFor,
  wantsBluetoothFor
} from '../link'
import { dialPrinter } from '@/services/muon-cloud/iroh'
import { EID, fakeEndpoint, fakePrinter } from './fakes'

afterEach(() => stopUsingBluetoothFor(EID))

describe('the real route is the link that is up, not the click (KAN-1396)', () => {
  it('asking for Bluetooth is not carrying over Bluetooth', () => {
    useBluetoothFor(EID, fakePrinter().device)
    expect(wantsBluetoothFor(EID)).toBe(true)
    expect(bluetoothCarrying(EID)).toBe(false)
  })

  it('is carrying once the link is up, and stops when it is hung up', async () => {
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, fakePrinter().device)
    await bluetoothRouteFor(endpoint, EID)
    expect(bluetoothCarrying(EID)).toBe(true)
    await releaseBluetoothLink(EID)
    expect(bluetoothCarrying(EID)).toBe(false)
  })

  it('stops when the printer drops the link', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, printer.device)
    const link = await bluetoothRouteFor(endpoint, EID)
    printer.drop()
    await link!.closed
    await Promise.resolve()
    expect(bluetoothCarrying(EID)).toBe(false)
  })
})

describe('one label for the route, from the link that is up (KAN-1566)', () => {
  it('says Through Muon3D until the Bluetooth link is up, then Via Bluetooth, then Through Muon3D once it is gone', async () => {
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, fakePrinter().device)
    expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
    await bluetoothRouteFor(endpoint, EID)
    expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
    expect(remoteRouteLabel(EID.toUpperCase())).toBe('Via Bluetooth')
    await releaseBluetoothLink(EID)
    expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
  })

  it('a link that is up but idle is standby, not the route: the relay carries it (btmon, 5 Nov)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      await bluetoothRouteFor(endpoint, EID)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
      // iroh moved the connection onto the relay: no segments cross the radio.
      await vi.advanceTimersByTimeAsync(CARRYING_WINDOW_MS + 2000)
      expect(bluetoothLinkUp(EID)).toBe(true)
      expect(bluetoothCarrying(EID)).toBe(false)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
      // The relay went; iroh moved back, and bytes cross the radio again.
      printer.notify(new Uint8Array([7]))
      await vi.advanceTimersByTimeAsync(1500)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
    } finally {
      vi.useRealTimers()
    }
  })

  it('says Through Muon3D with no printer', () => {
    expect(remoteRouteLabel(null)).toBe('Through Muon3D')
  })
})

describe('a Bluetooth link that fails is never swallowed (KAN-1396)', () => {
  const relayOnly = (ble = fakeEndpoint()) => ({
    ...ble.endpoint,
    connect: vi.fn(async (id: string) => ({ printerId: () => id }))
  }) as any

  it('records that the open went on through Muon3D, with the reason', async () => {
    const printer = fakePrinter({ answers: false })
    useBluetoothFor(EID, printer.device)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const dialled = dialPrinter(relayOnly(), EID)
      await vi.advanceTimersByTimeAsync(11_000)
      await dialled
    } finally {
      vi.useRealTimers()
    }
    expect(bluetoothCarrying(EID)).toBe(false)
    expect(bluetoothFellBack(EID)).toMatch(/handshake timed out/)
  })

  it('records nothing when the link comes up', async () => {
    useBluetoothFor(EID, fakePrinter().device)
    await dialPrinter(relayOnly(), EID)
    expect(bluetoothCarrying(EID)).toBe(true)
    expect(bluetoothFellBack(EID)).toBeNull()
  })

  it('forgets the note when the choice is undone', async () => {
    const printer = fakePrinter({ answers: false })
    useBluetoothFor(EID, printer.device)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const dialled = dialPrinter(relayOnly(), EID)
      await vi.advanceTimersByTimeAsync(11_000)
      await dialled
    } finally {
      vi.useRealTimers()
    }
    stopUsingBluetoothFor(EID)
    expect(bluetoothFellBack(EID)).toBeNull()
  })
})
