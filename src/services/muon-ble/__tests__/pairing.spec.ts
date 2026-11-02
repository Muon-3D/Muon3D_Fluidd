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
  cancelPairing, pairingState, startPairing, submitPairingCode, PAIRING_WINDOW_MS
} = await import('../pairing')

/** The wasm Error shape: a message and a `kind`. */
const wasmError = (kind: string, message: string, extra: Record<string, unknown> = {}) => Object.assign(new Error(message), { kind, ...extra })

let session: { comparison: ReturnType<typeof vi.fn>, submitCode: ReturnType<typeof vi.fn> }
let beginPairing: ReturnType<typeof vi.fn>
let ble: ReturnType<typeof fakeEndpoint>

beforeEach(() => {
  ble = fakeEndpoint()
  session = { comparison: vi.fn(() => 'F6Q TDH'), submitCode: vi.fn() }
  beginPairing = vi.fn(async () => session)
  held.endpoint = { ...ble.endpoint, endpointId: () => 'me', beginPairing }
  // The person chose Bluetooth for this printer, so the route is known.
  useBluetoothFor(EID, fakePrinter().device)
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

  it('sends the eight digits, and after the panel confirms it reconnects the printer', async () => {
    session.submitCode.mockResolvedValue({ role: 'operator', fingerprint: 'ab' })
    await startPairing(EID)

    await submitPairingCode('1234 5678')

    expect(session.submitCode).toHaveBeenCalledWith(12345678)
    expect(cloud.dropCloudConnection).toHaveBeenCalledWith(EID)
    expect(activate.activateCloudPrinter).toHaveBeenCalledWith(EID)
    expect(pairingState.phase).toBe('idle')
    // The Bluetooth choice stays, so the reconnect uses the radio.
    expect(wantsBluetoothFor(EID)).toBe(true)
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
    expect(wantsBluetoothFor(EID)).toBe(false)
  })

  it('shows the printer\'s remaining pause in minutes when it is still cooling down', async () => {
    beginPairing.mockRejectedValue(wasmError('pairing', 'pairing protocol error: the printer ended the pairing: pairing is refused for another 840s after three incorrect codes'))

    await startPairing(EID)

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/14 minutes/)
  })

  it('says there is no pairing window when the printer refuses the connection', async () => {
    beginPairing.mockRejectedValue(wasmError('refused', 'the printer refused the pairing: no pairing window is open', { code: 0x040a }))

    await startPairing(EID)

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/No pairing window is open/)
    expect(pairingState.message).toMatch(/Settings > Add a device/)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
  })

  it('shows an error and stores nothing when the panel ends the pairing', async () => {
    session.submitCode.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: the pairing window is now Closed'))
    await startPairing(EID)

    await submitPairingCode('12345678')

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/printer/i)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
    expect(wantsBluetoothFor(EID)).toBe(false)
  })

  it('says the window closed when the printer reports it expired', async () => {
    session.submitCode.mockRejectedValue(wasmError('pairing', 'the printer ended the pairing: the pairing window expired before it was confirmed'))
    await startPairing(EID)

    await submitPairingCode('12345678')

    expect(pairingState.message).toMatch(/2 minutes/)
  })

  it('gives up when the panel never confirms, and stores nothing', async () => {
    vi.useFakeTimers()
    session.submitCode.mockReturnValue(new Promise(() => {}))
    await startPairing(EID)

    const waiting = submitPairingCode('12345678')
    await vi.advanceTimersByTimeAsync(PAIRING_WINDOW_MS + 15_000)
    await waiting

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/2 minutes/)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
    expect(wantsBluetoothFor(EID)).toBe(false)
  })

  it('gives up on a code nobody typed once the window must have closed', async () => {
    vi.useFakeTimers()
    await startPairing(EID)

    await vi.advanceTimersByTimeAsync(PAIRING_WINDOW_MS + 15_000)

    expect(pairingState.phase).toBe('error')
    expect(pairingState.message).toMatch(/2 minutes/)
  })

  it('can be cancelled while it waits for the panel: the radio is let go and a late answer changes nothing', async () => {
    let confirm!: (value: unknown) => void
    session.submitCode.mockReturnValue(new Promise(resolve => { confirm = resolve }))
    await startPairing(EID)
    const waiting = submitPairingCode('12345678')

    cancelPairing()
    confirm({ role: 'owner' })
    await waiting

    expect(pairingState.phase).toBe('idle')
    expect(wantsBluetoothFor(EID)).toBe(false)
    expect(activate.activateCloudPrinter).not.toHaveBeenCalled()
  })

  it('refuses something that is not eight digits without asking the printer', async () => {
    await startPairing(EID)

    await submitPairingCode('1234')

    expect(session.submitCode).not.toHaveBeenCalled()
    expect(pairingState.phase).toBe('code')
    expect(pairingState.message).toMatch(/8 digits/)
  })

  it('does not start without a Bluetooth choice for that printer', async () => {
    stopUsingBluetoothFor(EID)

    await startPairing(EID)

    expect(pairingState.phase).toBe('error')
    expect(beginPairing).not.toHaveBeenCalled()
  })
})
