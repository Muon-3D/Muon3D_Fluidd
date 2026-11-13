import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bluetoothCarrying,
  bluetoothFellBack,
  bluetoothLinkUp,
  bluetoothOpening,
  CARRYING_WINDOW_MS,
  NOT_ON_BLUETOOTH_MS,
  NOT_ON_BLUETOOTH_REASON,
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

/** The printer sends a packet over the radio, and the next one-second check sees it (KAN-2531: only that is Bluetooth carrying the session). */
async function printerSpeaks (printer: ReturnType<typeof fakePrinter>) {
  await vi.advanceTimersByTimeAsync(100)
  printer.notify(new Uint8Array([7]))
  await vi.advanceTimersByTimeAsync(1500)
}

describe('the real route is the link that is up, not the click (KAN-1396)', () => {
  it('asking for Bluetooth is not carrying over Bluetooth', () => {
    useBluetoothFor(EID, fakePrinter().device)
    expect(wantsBluetoothFor(EID)).toBe(true)
    expect(bluetoothCarrying(EID)).toBe(false)
  })

  it('is carrying once the printer speaks over the link, and stops when it is hung up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      await bluetoothRouteFor(endpoint, EID)
      await printerSpeaks(printer)
      expect(bluetoothCarrying(EID)).toBe(true)
      await releaseBluetoothLink(EID)
      expect(bluetoothCarrying(EID)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a link that is up is not carrying until the printer speaks on it, and then says it is not on Bluetooth (KAN-2531)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      await bluetoothRouteFor(endpoint, EID)
      // The handshake crossed the radio, and nothing the printer sends since: the relay answered.
      expect(bluetoothCarrying(EID)).toBe(false)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
      expect(bluetoothFellBack(EID)).toBeNull()
      await vi.advanceTimersByTimeAsync(NOT_ON_BLUETOOTH_MS + 2000)
      expect(bluetoothCarrying(EID)).toBe(false)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
      expect(bluetoothFellBack(EID)).toBe(NOT_ON_BLUETOOTH_REASON)
      // The printer then speaks over the radio: it is on Bluetooth after all, and the note goes.
      printer.notify(new Uint8Array([7]))
      await vi.advanceTimersByTimeAsync(1500)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
      expect(bluetoothFellBack(EID)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
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

describe('Bluetooth, when chosen, is pinned (D-080)', () => {
  it('pins the printer on the endpoint when the route opens, and unpins when the person stops', async () => {
    const { endpoint } = fakeEndpoint()
    const pinBluetooth = vi.fn()
    const pinnable = Object.assign(endpoint, { pinBluetooth })
    useBluetoothFor(EID, fakePrinter().device)
    expect(pinBluetooth).not.toHaveBeenCalled()
    await bluetoothRouteFor(pinnable, EID)
    expect(pinBluetooth).toHaveBeenCalledWith(EID, true)
    await bluetoothRouteFor(pinnable, EID)
    expect(pinBluetooth).toHaveBeenCalledTimes(1)
    stopUsingBluetoothFor(EID)
    expect(pinBluetooth).toHaveBeenLastCalledWith(EID, false)
  })

  it('works with an older muon-link-web that cannot pin, and survives one that throws', async () => {
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, fakePrinter().device)
    expect(await bluetoothRouteFor(endpoint, EID)).not.toBeNull()
    stopUsingBluetoothFor(EID)
    const throwing = Object.assign(fakeEndpoint().endpoint, { pinBluetooth: vi.fn(() => { throw new Error('closed') }) })
    useBluetoothFor(EID, fakePrinter().device)
    expect(await bluetoothRouteFor(throwing, EID)).not.toBeNull()
  })

  it('keeps the pin when the person picks the printer again on a new device', async () => {
    const { endpoint } = fakeEndpoint()
    const pinBluetooth = vi.fn()
    const pinnable = Object.assign(endpoint, { pinBluetooth })
    useBluetoothFor(EID, fakePrinter().device)
    await bluetoothRouteFor(pinnable, EID)
    useBluetoothFor(EID, fakePrinter({ id: 'dev-walnut-2' }).device)
    stopUsingBluetoothFor(EID)
    expect(pinBluetooth).toHaveBeenLastCalledWith(EID, false)
  })
})

describe('one label for the route, from the link that is up (KAN-1566)', () => {
  it('says Through Muon3D until the Bluetooth link is up, then Via Bluetooth, then Through Muon3D once it is gone', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
      await bluetoothRouteFor(endpoint, EID)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
      await printerSpeaks(printer)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
      expect(remoteRouteLabel(EID.toUpperCase())).toBe('Via Bluetooth')
      await releaseBluetoothLink(EID)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a link that is up but idle is standby, not the route: the relay carries it (btmon, 5 Nov)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      await bluetoothRouteFor(endpoint, EID)
      await printerSpeaks(printer)
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

  it('is opening while the link comes up, and not once it is up or has failed', async () => {
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, fakePrinter().device)
    expect(bluetoothOpening(EID)).toBe(false)
    const opening = bluetoothRouteFor(endpoint, EID)
    expect(bluetoothOpening(EID)).toBe(true)
    await opening
    expect(bluetoothOpening(EID)).toBe(false)
    stopUsingBluetoothFor(EID)
    useBluetoothFor(EID, fakePrinter({ answers: false }).device)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const failing = bluetoothRouteFor(endpoint, EID).catch(() => null)
      expect(bluetoothOpening(EID)).toBe(true)
      await vi.advanceTimersByTimeAsync(11_000)
      await failing
    } finally {
      vi.useRealTimers()
    }
    expect(bluetoothOpening(EID)).toBe(false)
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
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      useBluetoothFor(EID, printer.device)
      await dialPrinter(relayOnly(), EID)
      await printerSpeaks(printer)
      expect(bluetoothCarrying(EID)).toBe(true)
      expect(bluetoothFellBack(EID)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
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
