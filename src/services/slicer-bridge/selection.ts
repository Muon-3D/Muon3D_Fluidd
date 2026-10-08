/**
 * The printer Fluidd has selected, as printer-bridge/1 names it to the
 * slicer in /slice (a BridgePrinter): its key, name, model, route, role and
 * whether Fluidd can reach it now.
 *
 * - A cloud printer (reached over Iroh) is keyed by its EndpointId, the id
 *   the account lists it by. Its role is the account's: a printer shared to
 *   watch is a Viewer; one shared to operate an Operator; one the account
 *   linked its Owner.
 * - A printer on the network is keyed by the EndpointId its
 *   /server/muon/identity reports, else by `origin:<its API origin>`. It has
 *   no account role: whoever has this Fluidd on the network already starts
 *   any file from its own list, so the host reports it as an Operator (the
 *   slicer refuses a role it does not know on a host route).
 * - While Fluidd switches printer, or before a network printer's identity has
 *   been asked, nothing is selected: a request for the old printer is refused
 *   with `printer-changed`, and none can reach the new one before the slicer
 *   has been told of it.
 *
 * A printer that answers /server/muon/identity is a Muon3D M1, the only model
 * (as the slicer decides for its own copy); a cloud printer's model is the
 * account's, read the same way.
 */
import type { BridgePrinter } from './vendor/printer-client/bridge/protocol'

/** The model name the slicer's profiles know the M1 by. */
export const MUON_M1 = 'Muon3D M1'

const ENDPOINT_ID_RE = /^[0-9a-f]{64}$/

/** An EndpointId in the bridge's form (64 lowercase hex), or null. */
export function endpointKey (id: unknown): string | null {
  if (typeof id !== 'string') return null
  const key = id.trim().toLowerCase()
  return ENDPOINT_ID_RE.test(key) ? key : null
}

/** `origin:<origin>` for an API address, or null when it is not an http(s) URL. */
export function originKey (apiUrl: string): string | null {
  try {
    const url = new URL(apiUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return `origin:${url.origin}`
  } catch {
    return null
  }
}

/** The account's model as the slicer's profiles name it: any M1 is "Muon3D M1"; anything else as it is. */
export function bridgeModel (model: unknown): string | null {
  if (typeof model !== 'string' || !model.trim()) return null
  return /(?:^|[^a-z0-9])m1(?:$|[^a-z0-9])/i.test(model) ? MUON_M1 : model.trim()
}

/** What the account says of a cloud printer (GET /v1/printers). */
export interface CloudEntry {
  id: string;
  name: string;
  model?: string | null;
  online: boolean;
  role?: string | null;
  shared?: boolean;
}

/**
 * The account's role, as the bridge names it: Viewer, Operator (shared to
 * operate) or Owner (linked). Only `operator` grants a role that may print;
 * a role the console did not send (an older console) is none (null), which
 * the slicer refuses on a host route, never an Owner.
 */
export function cloudRole (entry: Pick<CloudEntry, 'role' | 'shared'>): BridgePrinter['role'] {
  if (entry.role === 'viewer') return 'viewer'
  if (entry.role === 'operator') return entry.shared ? 'operator' : 'owner'
  return null
}

/** What Fluidd shows now: read at once, never waited for. */
export interface FluiddSelection {
  /** A switch is under way (a cloud printer being opened). */
  switching: boolean;
  /** The selected cloud printer, when a cloud printer is selected. */
  cloud: CloudEntry | null;
  /** The cloud printer's name as Fluidd shows it. */
  cloudName?: string;
  /** The API address of the selected network printer ('' for none, or for a cloud printer). */
  apiUrl: string;
  /** The network printer's name as Fluidd shows it. */
  displayName: string;
  /** The saved printer's EndpointId, if Fluidd recorded one. */
  savedEndpointId?: string | null;
  /** Fluidd's socket to the printer is open. */
  connected: boolean;
}

/** A network printer's identity as asked: whether it answered at all, its EndpointId and its name. */
export interface IdentityAnswer {
  answered: boolean;
  endpointId: string | null;
  /** The owner's rename, else the display name without the " · 8987" suffix Moonraker adds, else its name. */
  name?: string | null;
}

/** The trailing " · 8987" of a display name, or the bare " · " Moonraker writes when there is no suffix. */
const DISPLAY_SUFFIX_RE = /\s*·\s*[0-9A-Za-z]*$/

/** The name a printer's identity gives it, as the slicer's own copy reads it (adopt.ts identityName). */
export function identityName (r: Record<string, unknown>): string | null {
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  if (r.source === 'owner' && text(r.name)) return text(r.name)
  return text(r.display).replace(DISPLAY_SUFFIX_RE, '') || text(r.name) || null
}

/**
 * The BridgePrinter for what Fluidd shows. `identity` is the network
 * printer's answer for this `apiUrl`, or undefined while it is being asked
 * (then nothing is selected).
 */
export function bridgePrinterFor (selection: FluiddSelection, identity: IdentityAnswer | undefined): BridgePrinter | null {
  if (selection.switching) return null
  if (selection.cloud) {
    const key = endpointKey(selection.cloud.id)
    if (!key) return null
    return {
      key,
      name: (selection.cloudName || selection.cloud.name || key.slice(0, 8)).slice(0, 64),
      model: bridgeModel(selection.cloud.model) ?? MUON_M1,
      route: 'cloud',
      role: cloudRole(selection.cloud),
      online: selection.cloud.online && selection.connected,
      ...(selection.cloud.shared ? { shared: true } : {})
    }
  }
  if (!selection.apiUrl || identity === undefined) return null
  const key = identity.endpointId ?? endpointKey(selection.savedEndpointId) ?? originKey(selection.apiUrl)
  if (!key) return null
  return {
    key,
    name: (identity.name || selection.displayName || new URL(selection.apiUrl).host).slice(0, 64),
    model: identity.answered ? MUON_M1 : null,
    route: 'local',
    role: 'operator',
    online: selection.connected
  }
}

/** Two selections that tell the slicer the same thing. */
export function samePrinter (a: BridgePrinter | null, b: BridgePrinter | null): boolean {
  if (a === null || b === null) return a === b
  return a.key === b.key && a.name === b.name && a.model === b.model && a.route === b.route &&
    a.role === b.role && a.online === b.online && !!a.shared === !!b.shared
}

/** How long a failed identity stands before it is asked again: doubling from the first, up to the last. */
export const IDENTITY_RETRY_MS = { first: 2_000, max: 60_000 }

/**
 * Asks a network printer who it is, once per address while the answer is
 * kept. `fetchIdentity(apiUrl)` asks the printer at `apiUrl` its GET
 * /server/muon/identity (through Fluidd's own client, so with its sign-in)
 * and resolves to the parsed body, or rejects when the printer does not
 * answer it (an older image, its Aux service still starting, a sign-in not
 * done yet).
 *
 * Only an answer is kept. A failure stands for a while, so the printer is
 * still selected (keyed by its address, with no model), and is asked again
 * after IDENTITY_RETRY_MS (doubling) or at once after `forgetFailures()`
 * (Fluidd's socket reconnected): once it answers, the key moves to its
 * EndpointId.
 */
export function createIdentityCache (fetchIdentity: (apiUrl: string) => Promise<unknown>, now: () => number = Date.now) {
  const answers = new Map<string, IdentityAnswer>()
  const failures = new Map<string, { answer: IdentityAnswer, until: number, wait: number }>()
  const asking = new Map<string, Promise<IdentityAnswer>>()
  const notAnswered = (): IdentityAnswer => ({ answered: false, endpointId: null, name: null })

  // An answer, or null for a body that is not an identity (kept as a failure, asked again).
  const parse = (body: unknown): IdentityAnswer | null => {
    const outer = typeof body === 'object' && body !== null ? body as Record<string, unknown> : null
    const r = outer && typeof outer.result === 'object' && outer.result !== null ? outer.result as Record<string, unknown> : outer
    if (!r || (typeof r.name !== 'string' && typeof r.display !== 'string')) return null
    return { answered: true, endpointId: endpointKey(r.endpoint_id), name: identityName(r) }
  }

  return {
    /**
     * The answer for `apiUrl`: kept, or a failure standing until it is asked
     * again; undefined while it has never been asked or is first being asked.
     */
    get (apiUrl: string): IdentityAnswer | undefined {
      return answers.get(apiUrl) ?? failures.get(apiUrl)?.answer
    },
    /** Whether `apiUrl` should be asked now: never asked, or its failure has stood long enough. */
    due (apiUrl: string): boolean {
      if (answers.has(apiUrl) || asking.has(apiUrl)) return false
      const failed = failures.get(apiUrl)
      return !failed || now() >= failed.until
    },
    /** Asks `apiUrl` unless its answer is kept or on its way; resolves to the answer. */
    ask (apiUrl: string): Promise<IdentityAnswer> {
      const kept = answers.get(apiUrl)
      if (kept) return Promise.resolve(kept)
      let pending = asking.get(apiUrl)
      if (!pending) {
        pending = fetchIdentity(apiUrl)
          .then(parse, () => null)
          .then((answer) => {
            asking.delete(apiUrl)
            if (answer) {
              answers.set(apiUrl, answer)
              failures.delete(apiUrl)
              return answer
            }
            const wait = Math.min((failures.get(apiUrl)?.wait ?? IDENTITY_RETRY_MS.first / 2) * 2, IDENTITY_RETRY_MS.max)
            const failed = { answer: notAnswered(), until: now() + wait, wait }
            failures.set(apiUrl, failed)
            return failed.answer
          })
        asking.set(apiUrl, pending)
      }
      return pending
    },
    /** How long until a failure for `apiUrl` may be asked again (ms; 0 when it may now). */
    retryIn (apiUrl: string): number {
      const failed = failures.get(apiUrl)
      return failed ? Math.max(0, failed.until - now()) : 0
    },
    /** Lets every failure be asked again at once (Fluidd's socket came back). */
    forgetFailures () {
      for (const failed of failures.values()) failed.until = 0
    },
    clear () {
      answers.clear()
      failures.clear()
    }
  }
}
