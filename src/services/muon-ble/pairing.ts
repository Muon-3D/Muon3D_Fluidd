/**
 * Pairing this browser with a printer over Bluetooth (KAN-1253; SEC-7).
 *
 * A printer that is set up admits a stranger's key over Bluetooth for one
 * thing only: the `muon/pair/1` ceremony, and only while someone has opened a
 * pairing window at its panel (Settings > Add a device). So this page:
 *
 *   1. brings the Bluetooth link up (the route the person chose),
 *   2. `beginPairing` over it, and shows the six comparison symbols,
 *   3. sends the eight digits the panel shows (`submitCode`),
 *   4. waits while the person compares the symbols, picks a role and presses
 *      Confirm on the panel,
 *   5. reconnects the printer over the same link.
 *
 * Control never asks for a role and keeps nothing: the printer stores the
 * key, with the role chosen at its panel. Every failure and every cancel lets
 * the radio go, so nothing half-paired is left on either side.
 */
import Vue from 'vue'
import { browserEndpoint } from '@/services/muon-cloud/iroh'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import { cloudState, dropCloudConnection } from '@/services/muon-cloud/state'
import { bluetoothRouteFor, releaseBluetoothLink, wantsBluetoothFor } from './link'

/** The printer closes its window after 120 s (muon-link `WINDOW_TTL`). */
export const PAIRING_WINDOW_MS = 120_000
/** A little over the window, so the printer's own "expired" answer arrives first. */
const SLACK_MS = 10_000
/** Bringing the link up and starting the ceremony. */
const START_TIMEOUT_MS = 30_000
/** What the panel lists beside the six symbols. */
const LABEL = 'Control in a browser'

export type PairingPhase = 'idle' | 'connecting' | 'code' | 'waiting' | 'error'

export const pairingState = Vue.observable({
  phase: 'idle' as PairingPhase,
  printerId: null as string | null,
  /** The six symbols to compare with the panel, as `F6Q TDH`. */
  comparison: '',
  /** What to tell the person: a hint in `code`, the reason in `error`. */
  message: null as string | null
})

interface PairingSession {
  comparison (): string;
  submitCode (code: number): Promise<unknown>;
}

interface PairingEndpoint {
  beginPairing? (printerId: string, label: string): Promise<PairingSession>;
}

let generation = 0
let session: PairingSession | null = null
let expiry: ReturnType<typeof setTimeout> | undefined
/** The last hang-up, so a retry never meets a link that is still closing. */
let hangingUp: Promise<void> = Promise.resolve()

const kindOf = (error: unknown) => (error as { kind?: string } | null)?.kind
const textOf = (error: unknown) => (error as Error)?.message ?? String(error)

function within<T> (promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), ms)
    promise.then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) }
    )
  })
}

const WINDOW_CLOSED = 'The pairing window closed after 2 minutes, so nothing was added. On the printer, open Settings > Add a device and try again.'

class Closed extends Error {
  constructor () { super(WINDOW_CLOSED) }
}

/** Plain words for what the wasm client or the printer said. */
export function pairingMessage (error: unknown): string {
  const kind = kindOf(error)
  const text = textOf(error)
  if (error instanceof Closed) return WINDOW_CLOSED
  if (kind === 'code-burned') {
    return 'Three wrong codes. The printer has paused adding devices for 15 minutes, and nothing was added.'
  }
  if (kind === 'comparison-mismatch') {
    return "The six symbols didn't match, so Control stopped. Something may be between this computer and the printer. Nothing was added."
  }
  if (kind === 'refused' || /no pairing window is open/i.test(text)) {
    return 'No pairing window is open on the printer. On its screen, open Settings > Add a device, then try again.'
  }
  const pause = /refused for another (\d+)s after three/i.exec(text)
  if (pause) {
    const minutes = Math.max(1, Math.ceil(Number(pause[1]) / 60))
    return `The printer has paused adding devices after three wrong codes. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
  }
  if (/expired/i.test(text)) return WINDOW_CLOSED
  if (/too recently|opened \d+ pairing windows/i.test(text)) {
    return 'The printer opened too many pairing windows just now. Wait a little, then open Add a device again.'
  }
  if (/window is now|ended the pairing/i.test(text)) {
    return 'The printer ended the pairing, so nothing was added. On its screen, open Add a device and try again.'
  }
  return `Control couldn't pair with the printer: ${text}`
}

function clearTimer () {
  clearTimeout(expiry)
  expiry = undefined
}

/** Lets the radio go, so nothing half-paired stays open. The person's Bluetooth choice stays, for a retry. */
function release () {
  clearTimer()
  session = null
  const id = pairingState.printerId
  if (id) hangingUp = releaseBluetoothLink(id)
}

function fail (error: unknown) {
  release()
  pairingState.phase = 'error'
  pairingState.message = pairingMessage(error)
}

/** Starts pairing with `printerId`, which the person already chose to open over Bluetooth. */
export async function startPairing (printerId: string): Promise<void> {
  const mine = ++generation
  release()
  pairingState.printerId = printerId
  pairingState.comparison = ''
  pairingState.message = null
  pairingState.phase = 'connecting'
  try {
    await hangingUp
    if (mine !== generation) return
    if (!wantsBluetoothFor(printerId)) throw new Error('Choose Connect over Bluetooth for this printer first.')
    const relay = cloudState.config?.relay_url
    if (!relay) throw new Error('Control has not reached Muon3D yet, so it has no address to start from.')
    const endpoint = await browserEndpoint(relay) as unknown as PairingEndpoint
    const opened = await within(
      (async () => {
        await bluetoothRouteFor(endpoint, printerId)
        if (typeof endpoint.beginPairing !== 'function') throw new Error("this version of Control can't pair over Bluetooth")
        return endpoint.beginPairing(printerId, LABEL)
      })(),
      START_TIMEOUT_MS,
      () => new Error('The printer did not answer over Bluetooth in time.')
    )
    if (mine !== generation) return
    session = opened
    pairingState.comparison = opened.comparison()
    pairingState.phase = 'code'
    pairingState.message = null
    // The printer's window began about now; past it, nothing can finish.
    expiry = setTimeout(() => { if (mine === generation) fail(new Closed()) }, PAIRING_WINDOW_MS + SLACK_MS)
  } catch (error) {
    if (mine === generation) fail(error)
  }
}

/** Sends the eight digits the panel shows, then waits for the panel's Confirm. */
export async function submitPairingCode (text: string): Promise<void> {
  const mine = generation
  const printerId = pairingState.printerId
  const digits = text.replace(/[\s-]/g, '')
  if (!session || !printerId || pairingState.phase === 'waiting') return
  if (!/^\d{8}$/.test(digits)) {
    pairingState.message = 'The code is 8 digits. Type it as the printer shows it.'
    return
  }
  const asked = session
  pairingState.phase = 'waiting'
  pairingState.message = null
  try {
    await within(
      asked.submitCode(Number(digits)),
      PAIRING_WINDOW_MS + SLACK_MS,
      () => new Closed()
    )
  } catch (error) {
    if (mine !== generation) return
    if (kindOf(error) === 'code-rejected') {
      const left = Number((error as { attemptsRemaining?: number }).attemptsRemaining ?? 0)
      pairingState.phase = 'code'
      pairingState.message = `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left. Check the printer's screen and type it again.`
      return
    }
    fail(error)
    return
  }
  if (mine !== generation) return
  // Paired: the panel confirmed, and the printer holds this key. Go in.
  clearTimer()
  session = null
  pairingState.phase = 'idle'
  pairingState.message = null
  pairingState.printerId = null
  dropCloudConnection(printerId)
  try {
    await activateCloudPrinter(printerId)
  } catch { /* activationState holds the reason */ }
}

/** Closes the dialog, whatever step it is on. Nothing is stored, and the radio is let go. */
export function cancelPairing (): void {
  generation += 1
  release()
  pairingState.phase = 'idle'
  pairingState.message = null
  pairingState.comparison = ''
  pairingState.printerId = null
}
