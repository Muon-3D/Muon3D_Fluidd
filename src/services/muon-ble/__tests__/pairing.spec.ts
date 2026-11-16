import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EID, fakeEndpoint, fakePrinter } from './fakes'
import { stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from '../link'

const held = vi.hoisted(() => ({ endpoint: null as any }))
vi.mock('@/services/muon-cloud/iroh', () => ({ browserEndpoint: vi.fn(async () => held.endpoint) }))
const activate = vi.hoisted(() => ({ activateCloudPrinter: vi.fn(async () => true), activationState: { switching: null, error: null, fallbackUrl: null, pairing: null } }))
vi.mock('@/services/muon-cloud/activate', () => activate)
const cloud = vi.hoisted(() => ({
  dropCloudConnection: vi.fn(),
  cloudState: { config: { relay_url: 'https://relay.example.test' }, account: null }
}))
vi.mock('@/services/muon-cloud/state', () => cloud)

const {
  cancelPairing, pairingMessage, pairingState, startPairing, submitPairingCode, PAIRING_WINDOW_MS, START_TIMEOUT_MS
} = await import('../pairing')

/** The wasm Error shape: a message and a `kind`. */
const wasmError = (kind: string, message: string, extra: Record<string, unknown> = {}) => Object.assign(new Error(message), { kind, ...extra })
/** What the client rejects with when the printer closes with 0x040a and a reason. */
const refused = (reason: string) => wasmError('refused', `the printer refused the pairing: ${reason}`, { code: 0x040a })

let session: { comparison: any, submitCode: any, free: any }
let beginPairing: any
let ble: ReturnType<typeof fakeEndpoint>
let printer: ReturnType<typeof fakePrinter>

const linksOpen = () => ble.links.filter(l => !l.isClosed()).length

beforeEach(() => {
  ble = fakeEndpoint()
  session = { comparison: vi.fn(() => 'F6Q TDH'), submitCode: vi.fn(), free: vi.fn() }
  beginPairing = vi.fn(async () => session)
  held.endpoint = { ...ble.endpoint, endpointId: () => 'me', beginPairing }
  // The person chose Bluetooth for this printer, so the route is known.
  printer = fakePrinter()
  useBluetoothFor(EID, printer.device)
})

afterEach(() => {
  cancelPairing()
  stopUsingBluetoothFor(EID)
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('pairing this browser over Bluetooth (KAN-1253)', () => {
  it('brings the Bluetooth link up, starts the pairing over it and shows the six symbols', async () => {
    await startPairing(EID)

    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
    expect(beginPairing).toHaveBeenCalledWith(EID, expect.any(String))
    expect(pairingState.phase).toBe('code')
    expect(pairingState.comparison).toBe('F6Q TDH')
  })

  it('sends the eight digits, and after the panel confirms it reconnects over the same link', async () => {
    session.submitCode.mockResolvedValue({ role: 'operator', fingerprint: 'ab' })
    await startPairing(EID)

    await submitPairingCode('1234 5678')

    expect(session.submitCode).toHaveBeenCalledWith(12345678)
    expect(cloud.dropCloudConnection).toHaveBeenCalledWith(EID)
    expect(activate.activateCloudPrinter).toHaveBeenCalledWith(EID)
    expect(pairingState.phase).toBe('idle')
    // The Bluetooth choice stays, and so does the link the reconnect uses.
    expect(wantsBluetoothFor(EID)).toBe(true)
    expect(linksOpen()).toBe(1)
    // The pairing object is let go once it has done its work.
    expect(session.free).toHaveBeenCalledTimes(1)
  })

  it('says how many tries are left after a wrong code, and lets the person type it again', async () => {
    session.submitCode.mockRejectedValueOnce(wasmError('code-rejected', 'the code was wrong; 2 attempts remain', { attemptsRemaining: 2 }))
    await startPairing(EID)

    await submitPairingCode('11112222')

    expect(pairingState.phase).toBe('code')
    expect(pairingState.message).toMatch(/Wrong code/)
    expect(pairingState.message).toMatch(/2 tries left/)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
  })

  it('stops after three wrong codes, names the 15 minute pause and stores nothing', async () => {
    session.submitCode.mockRejectedValue(wasmError('code-burned', 'three wrong codes'))
    await startPairing(EID)

    await submitPairingCode('11112222')

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/15 minutes/)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
    expect(linksOpen()).toBe(0)
  })

  describe('what the printer says when it refuses (all of them close with 0x040a)', () => {
    it('"no pairing window is open": tells the person to open Add a device', async () => {
      beginPairing.mockRejectedValue(refused('no pairing window is open'))

      await startPairing(EID)

      expect(pairingState.phase).toBe('error')
      expect(pairingState.message).toMatch(/No pairing window is open/)
      expect(pairingState.message).toMatch(/Settings > Add a device/)
    })

    it('"pairing is busy": says another pairing is in progress, not that no window is open', async () => {
      beginPairing.mockRejectedValue(refused('pairing is busy'))

      await startPairing(EID)

      expect(pairingState.message).toMatch(/busy with another pairing/)
      expect(pairingState.message).not.toMatch(/No pairing window is open/)
    })

    it('"pairing did not complete" at the start: says so, and that a wrong code or a slow one can cause it', async () => {
      beginPairing.mockRejectedValue(refused('pairing did not complete'))

      await startPairing(EID)

      expect(pairingState.message).toMatch(/did not complete/)
      expect(pairingState.message).toMatch(/new code/)
      expect(pairingState.message).toMatch(/three wrong codes.*15 minutes/i)
      expect(pairingState.message).not.toMatch(/No pairing window is open/)
    })

    it('"pairing did not complete" while the code is sent (a burn, or a code typed after 90 s)', async () => {
      session.submitCode.mockRejectedValue(refused('pairing did not complete'))
      await startPairing(EID)

      await submitPairingCode('12345678')

      expect(pairingState.phase).toBe('error')
      expect(pairingState.message).toMatch(/did not complete/)
      expect(linksOpen()).toBe(0)
    })

    it('a reason it does not know is shown as the printer said it', async () => {
      beginPairing.mockRejectedValue(refused('something new'))

      await startPairing(EID)

      expect(pairingState.message).toMatch(/something new/)
      expect(pairingState.message).not.toMatch(/No pairing window is open/)
    })

    it('another device already in the window: says to wait for it', async () => {
      beginPairing.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: another client is already using this pairing window'))

      await startPairing(EID)

      expect(pairingState.message).toMatch(/Another device is already pairing/)
    })
  })

  it('shows an error when the panel ends the pairing, and lets the radio go', async () => {
    session.submitCode.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: the pairing window is now Closed'))
    await startPairing(EID)

    await submitPairingCode('12345678')

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/printer ended the pairing/)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
    expect(linksOpen()).toBe(0)
  })

  it('says the window closed when the printer reports it expired', async () => {
    session.submitCode.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: the pairing window expired before it was confirmed'))
    await startPairing(EID)

    await submitPairingCode('12345678')

    expect(pairingState.message).toMatch(/2 minutes/)
  })

  it('no longer carries branches for a pause or window limits the printer never sends a client', async () => {
    beginPairing.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: pairing is refused for another 840s after three incorrect codes'))

    await startPairing(EID)

    expect(pairingState.message).not.toMatch(/14 minutes/)
    expect(pairingState.message).toMatch(/printer ended the pairing/)
  })

  it('when the panel never confirms, stops waiting and says Control may have been added', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    session.submitCode.mockReturnValue(new Promise(() => {}))
    await startPairing(EID)

    const waiting = submitPairingCode('12345678')
    await vi.advanceTimersByTimeAsync(PAIRING_WINDOW_MS + 15_000)
    await waiting

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/may have been added/)
    expect(pairingState.message).toMatch(/under Add a device/)
    expect(pairingState.message).not.toMatch(/nothing was added/i)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
    expect(linksOpen()).toBe(0)
  })

  it('gives up on a code nobody typed once the window must have closed, and nothing was added', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await startPairing(EID)

    await vi.advanceTimersByTimeAsync(PAIRING_WINDOW_MS + 15_000)

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/2 minutes/)
    expect(pairingState.message).toMatch(/nothing was added/)
    expect(linksOpen()).toBe(0)
  })

  it('cancelling while it waits for the panel lets the radio go, ignores a late answer and warns it may have been added', async () => {
    let confirm!: (value: unknown) => void
    session.submitCode.mockReturnValue(new Promise(resolve => { confirm = resolve }))
    await startPairing(EID)
    const waiting = submitPairingCode('12345678')

    cancelPairing()
    confirm({ role: 'owner' })
    await waiting

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/may have been added/)
    expect(linksOpen()).toBe(0)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
  })

  it('a code typed late whose Confirm never answers still says Control may have been added when the start timer runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    session.submitCode.mockReturnValue(new Promise(() => {}))
    await startPairing(EID)
    await vi.advanceTimersByTimeAsync(60_000)

    submitPairingCode('12345678').catch(() => {})
    await vi.advanceTimersByTimeAsync(75_000)

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/may have been added/)
    expect(pairingState.message).not.toMatch(/nothing was added/i)
  })

  it('frees the pairing object after a failure', async () => {
    session.submitCode.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: the pairing window is now Closed'))
    await startPairing(EID)

    await submitPairingCode('12345678')

    expect(session.free).toHaveBeenCalledTimes(1)
  })

  it('frees the pairing object when the window runs out before a code is typed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await startPairing(EID)

    await vi.advanceTimersByTimeAsync(PAIRING_WINDOW_MS + 15_000)

    expect(session.free).toHaveBeenCalledTimes(1)
  })

  it('frees the pairing object when the answer comes after a cancel while waiting, and not before', async () => {
    let confirm!: (value: unknown) => void
    session.submitCode.mockReturnValue(new Promise(resolve => { confirm = resolve }))
    await startPairing(EID)
    const waiting = submitPairingCode('12345678')

    cancelPairing()
    // The call is still in flight: freeing now would pull the object out from under it.
    expect(session.free).not.toHaveBeenCalled()
    confirm({ role: 'owner' })
    await waiting

    await vi.waitFor(() => expect(session.free).toHaveBeenCalledTimes(1))
  })

  it('cancelling at the code step simply closes', async () => {
    await startPairing(EID)

    cancelPairing()

    expect(pairingState.phase).toBe('idle')
    expect(linksOpen()).toBe(0)
  })

  it('cancelling while connecting leaves no link open and never starts the pairing', async () => {
    printer = fakePrinter({ answers: false })
    stopUsingBluetoothFor(EID)
    useBluetoothFor(EID, printer.device)

    const starting = startPairing(EID)
    await vi.waitFor(() => expect(printer.written.length).toBeGreaterThan(0))
    cancelPairing()
    // The printer answers HELLO after the person has cancelled.
    printer.notify(new Uint8Array([2]))
    await starting
    await vi.waitFor(() => expect(linksOpen()).toBe(0))

    expect(beginPairing).not.toHaveBeenCalled()
    expect(pairingState.phase).toBe('idle')
  })

  it('gives up if the printer does not answer within the start limit, and lets a late pairing go', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let begin!: (value: unknown) => void
    beginPairing.mockReturnValue(new Promise(resolve => { begin = resolve }))

    const starting = startPairing(EID)
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS + 1_000)
    await starting

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/did not answer/)
    expect(linksOpen()).toBe(0)

    // beginPairing answers after all: it must not leave this browser as the window's candidate.
    begin(session)
    await vi.waitFor(() => expect(session.free).toHaveBeenCalledTimes(1))
    expect(linksOpen()).toBe(0)
    expect(pairingState.phase).toBe('error')
  })

  it('refuses something that is not eight digits without asking the printer', async () => {
    await startPairing(EID)

    await submitPairingCode('1234')

    expect(session.submitCode).not.toHaveBeenCalled()
    expect(pairingState.phase).toBe('code')
    expect(pairingState.message).toMatch(/8 digits/)
  })

  it('can be tried again after a failure, without choosing Bluetooth again', async () => {
    beginPairing.mockRejectedValueOnce(refused('no pairing window is open'))
    await startPairing(EID)
    expect(pairingState.phase).toBe('error')

    await startPairing(EID)

    expect(pairingState.phase).toBe('code')
    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(2)
  })

  it('does not start without a Bluetooth choice for that printer', async () => {
    stopUsingBluetoothFor(EID)

    await startPairing(EID)

    expect(pairingState.phase).toBe('error')
    expect(beginPairing).not.toHaveBeenCalled()
  })
})

describe('the error kind "bluetooth" (KAN-2531)', () => {
  it('reads as the plain not-on-Bluetooth message, as the open path does, not the raw text', () => {
    const message = pairingMessage(wasmError('bluetooth', 'pinned printer has no bluetooth link'))
    expect(message).toMatch(/Bluetooth isn't connected to this printer/)
    expect(message).not.toMatch(/pinned printer/)
  })
})
