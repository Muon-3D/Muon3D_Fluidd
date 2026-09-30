/**
 * Setting a new printer up over Bluetooth from the hosted page (ADR 0032 D7,
 * KAN-436).
 *
 * A new M1 is on no Wi-Fi, and before setup completes muon-link admits an
 * unknown key to `muon/gateway/1` when, and only when, the connection came in
 * over Bluetooth. So this page links the printer's radio to its own Iroh
 * endpoint, dials the gateway over it, and reads the session's SEC-7
 * comparison value: the six characters the printer's screen shows for the
 * same connection. The person checks the two match before anything but a
 * read of the setup state is sent; a lookalike device in the middle holds two
 * connections with two different values, so it cannot make them agree.
 *
 * What a setup session reaches is only `/server/muon/setup[/…]` and
 * `/server/muon/link[/…]`, with no websocket, and muon-link hangs it up when
 * setup completes.
 */
import { cloudApi } from '@/services/muon-cloud/api'
import { browserEndpoint, IrohPrinter } from '@/services/muon-cloud/iroh'
import { cloudState } from '@/services/muon-cloud/state'
import { SETUP_PATH, type SetupTransport } from '@/services/muon-setup/client'
import type { SetupState } from '@/services/muon-setup/types'
import { openBleLink, takesBleLinks, type BleCapableEndpoint, type BleLinkHandle } from './link'
import type { NearbyPrinter } from './nearby'

/** A live setup session over Bluetooth. */
export interface BleSetupSession {
  printerId: string;
  /** The comparison value, six symbols with no space: `F6QTDH`. */
  code: string;
  transport: SetupTransport;
  /** The state as the first read found it. */
  state: SetupState;
  /** Hangs up the session and the radio. */
  close (): Promise<void>;
  /** Resolves when the radio connection ends, whoever ended it. */
  closed: Promise<void>;
}

/**
 * Why a session did not start:
 * - `unsupported`: the console's muon-link-web takes no Bluetooth links, or has no comparison value (before muon-link#31 and #33).
 * - `busy`: another device holds the printer's one Bluetooth slot.
 * - `unreachable`: out of range, off, or it stopped answering.
 * - `set-up`: the printer is set up already, so it refuses a stranger.
 */
export type BleSetupFailure = 'unsupported' | 'busy' | 'unreachable' | 'set-up'

export type BleSetupResult =
  | { ok: true, session: BleSetupSession }
  | { ok: false, reason: BleSetupFailure, message: string }

interface SessionPrinter {
  printerId (): string;
  comparison? (): string;
  fetch (method: string, path: string, headers: string[], body: Uint8Array): Promise<{ status: number, headers: string[], body: Uint8Array }>;
  openWebSocket (path: string): Promise<never>;
  close (): void;
}

interface SetupEndpoint {
  connect (printerId: string): Promise<SessionPrinter>;
}

export interface ConnectForSetupOptions {
  /** The tab's endpoint; the console's by default. */
  endpoint?: () => Promise<unknown>;
  log?: (line: string) => void;
}

async function consoleEndpoint (): Promise<unknown> {
  // A stranger's endpoint needs no account: only the relay the console names.
  if (!cloudState.config) cloudState.config = await cloudApi.config()
  return browserEndpoint(cloudState.config.relay_url)
}

const errorKind = (error: unknown) => (error as { kind?: string } | null)?.kind
const message = (error: unknown) => (error as Error)?.message ?? String(error)

/** The comparison value as the printer's screen and the state carry it: no space, upper case. */
export function plainCode (code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

/** "F6QTDH" as "F6Q TDH". */
export function groupedCode (code: string): string {
  const plain = plainCode(code)
  return plain.length === 6 ? `${plain.slice(0, 3)} ${plain.slice(3)}` : plain
}

export async function connectForSetup (printer: NearbyPrinter, options: ConnectForSetupOptions = {}): Promise<BleSetupResult> {
  const log = options.log ?? (() => {})
  const name = printer.display || printer.localName || 'The printer'
  let endpoint: unknown
  try {
    endpoint = await (options.endpoint ?? consoleEndpoint)()
  } catch (error) {
    return { ok: false, reason: 'unreachable', message: `Couldn't start this page's connection: ${message(error)}` }
  }
  if (!takesBleLinks(endpoint)) {
    return { ok: false, reason: 'unsupported', message: "This page's connection can't use Bluetooth yet." }
  }

  let link: BleLinkHandle
  try {
    link = await openBleLink(endpoint as BleCapableEndpoint, printer.device, { log })
  } catch (error) {
    log(`bluetooth setup: ${message(error)}`)
    return printer.advert?.busy
      ? { ok: false, reason: 'busy', message: `Another device is connected to ${name}.` }
      : { ok: false, reason: 'unreachable', message: `${name} stopped answering over Bluetooth.` }
  }

  let session: SessionPrinter | null = null
  const hangUp = async () => {
    try {
      session?.close()
    } catch { /* already closed */ }
    await link.disconnect()
  }
  try {
    session = await (endpoint as unknown as SetupEndpoint).connect(link.printerId)
    if (typeof session.comparison !== 'function') {
      await hangUp()
      return { ok: false, reason: 'unsupported', message: "This page's connection has no code to check yet." }
    }
    const code = plainCode(session.comparison())
    const transport = new IrohPrinter(session)
    // A read only: it carries the code to the printer's screen, and gives a
    // lookalike nothing it could use.
    const answer = await transport.fetch(SETUP_PATH)
    if (answer.status === 401 || answer.status === 403) {
      await hangUp()
      return { ok: false, reason: 'set-up', message: `${name} is set up already.` }
    }
    const json = await answer.json().catch(() => null) as { result?: SetupState } | SetupState | null
    const state = (json && 'result' in json ? json.result : json) as SetupState | null
    if (!answer.ok || !state || typeof state.rev !== 'number') {
      await hangUp()
      return { ok: false, reason: 'unreachable', message: `${name} answered, but not with its setup.` }
    }
    if (state.state === 'complete') {
      await hangUp()
      return { ok: false, reason: 'set-up', message: `${name} is set up already.` }
    }
    return {
      ok: true,
      session: {
        printerId: link.printerId,
        code,
        transport,
        state,
        close: hangUp,
        closed: link.closed
      }
    }
  } catch (error) {
    log(`bluetooth setup: ${message(error)}`)
    await hangUp()
    // muon-link refuses a stranger once setup is complete (ADR 0032 D4).
    if (errorKind(error) === 'refused') return { ok: false, reason: 'set-up', message: `${name} is set up already.` }
    return { ok: false, reason: 'unreachable', message: `${name} stopped answering over Bluetooth.` }
  }
}
