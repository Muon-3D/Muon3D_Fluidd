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
export const START_TIMEOUT_MS = 30_000
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
  /** Frees the wasm object. Never while a `submitCode` is in flight. */
  free? (): void;
}

interface PairingEndpoint {
  beginPairing? (printerId: string, label: string): Promise<PairingSession>;
}

let generation = 0
let session: PairingSession | null = null
/** True while a `submitCode` is in flight: the object must not be freed under it. */
let submitting = false
const freed = new WeakSet<object>()

function freeOnce (pairing: PairingSession | null) {
  if (!pairing || freed.has(pairing)) return
  freed.add(pairing)
  try { pairing.free?.() } catch { /* already gone */ }
}
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

const NO_WINDOW = 'No pairing window is open on the printer. On its screen, open Settings > Add a device, then try again.'
const BUSY = 'The printer is busy with another pairing. Wait for it to finish, or cancel it on the printer, then try again.'
const DID_NOT_COMPLETE = 'The pairing did not complete. The code may have been wrong, or it took longer than about a minute and a half. After three wrong codes the printer pauses pairing for 15 minutes. Otherwise, on the printer, open Add a device for a new code and try again.'
const ANOTHER_DEVICE = 'Another device is already pairing with this printer. Wait for it to finish, then try again.'
const ENDED = 'The printer ended the pairing, so nothing was added. On its screen, open Add a device and try again.'
const WINDOW_CLOSED = 'The pairing window closed after 2 minutes, so nothing was added. On the printer, open Settings > Add a device and try again.'
/** Said whenever Control stops waiting for Confirm: the panel may still be about to write the record. */
const MAY_HAVE_BEEN_ADDED = 'Control stopped waiting. If you pressed Confirm on the printer, Control may have been added. You can remove it under Add a device.'

/** Control's own time limit ran out; `waiting` is true once the code was sent. */
class Closed extends Error {
  constructor (readonly waiting: boolean) { super(waiting ? MAY_HAVE_BEEN_ADDED : WINDOW_CLOSED) }
}

/** The attempt was cancelled or timed out; whatever it opened is let go. */
class Stale extends Error {}

/**
 * Plain words for what the wasm client or the printer said. The printer
 * closes with 0x040a and a reason for every refusal, so the reason decides.
 */
export function pairingMessage (error: unknown): string {
  const kind = kindOf(error)
  const text = textOf(error)
  if (error instanceof Closed) return error.message
  if (kind === 'code-burned') {
    return 'Three wrong codes. The printer has paused adding devices for 15 minutes, and nothing was added.'
  }
  if (kind === 'comparison-mismatch') {
    return "The six symbols didn't match, so Control stopped. Something may be between this computer and the printer. Nothing was added."
  }
  if (/no pairing window is open/i.test(text)) return NO_WINDOW
  if (/pairing is busy/i.test(text)) return BUSY
  if (/pairing did not complete/i.test(text)) return DID_NOT_COMPLETE
  if (/another client is already using/i.test(text)) return ANOTHER_DEVICE
  if (/expired/i.test(text)) return WINDOW_CLOSED
  if (/window is now|ended the pairing/i.test(text)) return ENDED
  if (kind === 'refused') {
    return `The printer refused the pairing: ${text.replace(/^.*refused the pairing:\s*/i, '')}`
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
  if (!submitting) freeOnce(session)
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
    let abandoned = false
    const opened = await within(
      (async () => {
        // A late answer from a cancelled or timed-out start must not leave
        // the radio up or this browser as the window's candidate.
        const stale = () => abandoned || mine !== generation
        const letGo = () => {
          if (mine === generation || pairingState.printerId === null) hangingUp = releaseBluetoothLink(printerId)
        }
        await bluetoothRouteFor(endpoint, printerId)
        if (stale()) { letGo(); throw new Stale() }
        if (typeof endpoint.beginPairing !== 'function') throw new Error("this version of Control can't pair over Bluetooth")
        const begun = await endpoint.beginPairing(printerId, LABEL)
        if (stale()) {
          try { begun.free?.() } catch { /* already gone */ }
          letGo()
          throw new Stale()
        }
        return begun
      })(),
      START_TIMEOUT_MS,
      () => { abandoned = true; return new Error('The printer did not answer over Bluetooth in time.') }
    )
    if (mine !== generation) return
    session = opened
    pairingState.comparison = opened.comparison()
    pairingState.phase = 'code'
    pairingState.message = null
    // The printer's window began about now; past it, nothing can finish.
    expiry = setTimeout(() => { if (mine === generation) fail(new Closed(pairingState.phase === 'waiting')) }, PAIRING_WINDOW_MS + SLACK_MS)
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
  // Settled, the object is no longer in use: free it unless the code step still needs it.
  const sent = asked.submitCode(Number(digits))
  submitting = true
  const settled = () => {
    submitting = false
    if (asked !== session) freeOnce(asked)
  }
  sent.then(settled, settled)
  try {
    await within(
      sent,
      PAIRING_WINDOW_MS + SLACK_MS,
      () => new Closed(true)
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
  freeOnce(asked)
  pairingState.phase = 'idle'
  pairingState.message = null
  pairingState.printerId = null
  dropCloudConnection(printerId)
  try {
    await activateCloudPrinter(printerId)
  } catch { /* activationState holds the reason */ }
}

/**
 * Stops, whatever step it is on, and lets the radio go. Cancelling while the
 * panel may still be asked to Confirm is not "nothing was added": the dialog
 * then says Control may have been added.
 */
export function cancelPairing (): void {
  const waiting = pairingState.phase === 'waiting'
  generation += 1
  release()
  pairingState.comparison = ''
  if (waiting) {
    pairingState.phase = 'error'
    pairingState.message = MAY_HAVE_BEEN_ADDED
    return
  }
  pairingState.phase = 'idle'
  pairingState.message = null
  pairingState.printerId = null
}
