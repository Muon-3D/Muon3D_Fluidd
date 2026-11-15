import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SILENT_DROP_MS,
  bluetoothCarrying,
  bluetoothDeviceFor,
  bluetoothDropped,
  bluetoothDroppedAt,
  droppedBluetoothPrinters,
  reconnectBluetooth,
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
import { notifyEndpointReplacing } from '@/services/muon-cloud/endpoint-hooks'
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

  it('an idle but alive Bluetooth route keeps its label', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      await bluetoothRouteFor(endpoint, EID)
      await printerSpeaks(printer)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
      // Idle, but alive: QUIC's keep-alive crosses the radio every 5 s.
      for (let i = 0; i < 12; i++) {
        printer.notify(new Uint8Array([1]))
        await vi.advanceTimersByTimeAsync(5_000)
      }
      expect(bluetoothDropped(EID)).toBeNull()
      expect(bluetoothLinkUp(EID)).toBe(true)
      expect(bluetoothCarrying(EID)).toBe(true)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
      printer.notify(new Uint8Array([7]))
      await vi.advanceTimersByTimeAsync(1500)
      expect(remoteRouteLabel(EID)).toBe('Via Bluetooth')
    } finally {
      vi.useRealTimers()
    }
  })

  it('says Through Muon3D once the printer has been quiet on the radio past the window, until the silent drop is called (KAN-2531, KAN-1913)', async () => {
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
      expect(bluetoothDropped(EID)).toBeNull()
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

  it('fails an explicit Bluetooth open rather than using Muon3D', async () => {
    const printer = fakePrinter({ answers: false })
    useBluetoothFor(EID, printer.device)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const endpoint = relayOnly()
      const dialled = expect(dialPrinter(endpoint, EID)).rejects.toThrow(/Bluetooth/)
      await vi.advanceTimersByTimeAsync(11_000)
      await dialled
      expect(endpoint.connect).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
    expect(bluetoothCarrying(EID)).toBe(false)
    expect(bluetoothFellBack(EID)).toBeNull()
    expect(bluetoothDropped(EID)).toMatch(/handshake timed out/)
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
      const dialled = expect(dialPrinter(relayOnly(), EID)).rejects.toThrow(/Bluetooth/)
      await vi.advanceTimersByTimeAsync(11_000)
      await dialled
    } finally {
      vi.useRealTimers()
    }
    stopUsingBluetoothFor(EID)
    expect(bluetoothFellBack(EID)).toBeNull()
  })
})

describe('the chosen route is the only route, and a drop is said, not hidden (KAN-1913)', () => {
  it('chooses the Bluetooth route with chooseRoute where muon-link-web has it, and Auto when the person stops', async () => {
    const { endpoint } = fakeEndpoint()
    const chooseRoute = vi.fn()
    const pinBluetooth = vi.fn()
    const routed = Object.assign(endpoint, { chooseRoute, pinBluetooth })
    useBluetoothFor(EID, fakePrinter().device)
    await bluetoothRouteFor(routed, EID)
    expect(chooseRoute).toHaveBeenCalledWith(EID, 'ble')
    expect(pinBluetooth).not.toHaveBeenCalled()
    stopUsingBluetoothFor(EID)
    expect(chooseRoute).toHaveBeenLastCalledWith(EID, 'auto')
  })

  it('says the Bluetooth route dropped when the printer or the radio ends the link', async () => {
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, printer.device)
    const link = await bluetoothRouteFor(endpoint, EID)
    expect(bluetoothDropped(EID)).toBeNull()
    printer.drop()
    await link!.closed
    await Promise.resolve()
    expect(bluetoothDropped(EID)).not.toBeNull()
    expect(wantsBluetoothFor(EID)).toBe(true)
    expect(remoteRouteLabel(EID)).toBe('Bluetooth dropped')
  })

  it('does not call it a drop when the person hangs up', async () => {
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, fakePrinter().device)
    const link = await bluetoothRouteFor(endpoint, EID)
    await releaseBluetoothLink(EID)
    await link!.closed
    await Promise.resolve()
    expect(bluetoothDropped(EID)).toBeNull()
  })

  it('does not call it a drop when the tab replaces its endpoint under a link (#421 rebind, #370)', async () => {
    // An explicit Bluetooth connect for one printer closes the tab's endpoint,
    // and every other printer's link with it. Those are not drops: no "Bluetooth
    // dropped" sheet for a printer the person did nothing to.
    const printer = fakePrinter()
    const { endpoint } = fakeEndpoint()
    useBluetoothFor(EID, printer.device)
    const link = await bluetoothRouteFor(endpoint, EID)
    notifyEndpointReplacing()
    printer.drop()
    await link!.closed
    await Promise.resolve()
    expect(bluetoothDropped(EID)).toBeNull()
    expect(bluetoothLinkUp(EID)).toBe(false)
    expect(bluetoothCarrying(EID)).toBe(false)
  })

  it('says it dropped when muon-link reports the chosen route has no path', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const { endpoint } = fakeEndpoint()
      let unavailable = false
      const routed = Object.assign(endpoint, { chooseRoute: vi.fn(), routeUnavailable: vi.fn(() => unavailable) })
      useBluetoothFor(EID, fakePrinter().device)
      await bluetoothRouteFor(routed, EID)
      vi.advanceTimersByTime(1_500)
      expect(bluetoothDropped(EID)).toBeNull()
      unavailable = true
      vi.advanceTimersByTime(1_500)
      expect(bluetoothDropped(EID)).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('counts an open link that carries nothing as dropped, and hangs it up (KAN-2080: the radio can stay up)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      const link = await bluetoothRouteFor(endpoint, EID)
      // The printer spoke over the radio (KAN-2531), then went quiet.
      await printerSpeaks(printer)
      expect(bluetoothCarrying(EID)).toBe(true)
      await vi.advanceTimersByTimeAsync(SILENT_DROP_MS - 4_000)
      expect(bluetoothDropped(EID)).toBeNull()
      await vi.advanceTimersByTimeAsync(6_000)
      expect(bluetoothDropped(EID)).toMatch(/Nothing came over Bluetooth/)
      expect(bluetoothCarrying(EID)).toBe(false)
      expect(remoteRouteLabel(EID)).toBe('Bluetooth dropped')
      await vi.advanceTimersByTimeAsync(3_000)
      expect(link!.isOpen()).toBe(false)
      // The reason stays the one that was seen, not "the link dropped".
      expect(bluetoothDropped(EID)).toMatch(/Nothing came over Bluetooth/)
      expect(droppedBluetoothPrinters()).toEqual([EID.toLowerCase()])
      expect(bluetoothDroppedAt(EID)).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a link the printer never spoke on is not a drop: the session is on the relay, and that is said once (KAN-2531 with #370)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      const link = await bluetoothRouteFor(endpoint, EID)
      await vi.advanceTimersByTimeAsync(SILENT_DROP_MS + 5_000)
      expect(bluetoothDropped(EID)).toBeNull()
      expect(link!.isOpen()).toBe(true)
      expect(bluetoothFellBack(EID)).toBe(NOT_ON_BLUETOOTH_REASON)
      expect(remoteRouteLabel(EID)).toBe('Through Muon3D')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a fresh try after a silent drop opens a new link, not the stale one', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const printer = fakePrinter()
      const { endpoint } = fakeEndpoint()
      useBluetoothFor(EID, printer.device)
      const first = await bluetoothRouteFor(endpoint, EID)
      await printerSpeaks(printer)
      await vi.advanceTimersByTimeAsync(SILENT_DROP_MS + 5_000)
      expect(bluetoothDropped(EID)).not.toBeNull()
      await releaseBluetoothLink(EID)
      reconnectBluetooth(EID)
      const second = await bluetoothRouteFor(endpoint, EID)
      expect(second).not.toBe(first)
      expect(second!.isOpen()).toBe(true)
      expect(bluetoothDropped(EID)).toBeNull()
      expect(bluetoothDeviceFor(EID)).toBe(printer.device)
    } finally {
      vi.useRealTimers()
    }
  })
})
