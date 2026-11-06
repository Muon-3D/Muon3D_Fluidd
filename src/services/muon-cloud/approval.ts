/**
 * Waiting for approval at the printer (I-170).
 *
 * A browser the printer does not know is held, not refused: the printer sends a
 * `pending` notice with the symbols its screen shows, and the owner taps Accept
 * or Reject there. This file is the typed shape of that wait, and the ONE
 * function that reads it from the wire. The dialog, its words and the tests
 * depend only on `ApprovalWatch`.
 */

export type ApprovalFailure = 'refused' | 'timed_out' | 'disabled' | 'busy' | 'cooldown'
/** `admitted`: the connection just carries on with its role. */
export type ApprovalOutcome = 'admitted' | ApprovalFailure

/** The printer holds a request for this long (120 s) before it closes with `timed_out`. */
export const APPROVAL_WINDOW_S = 120

export interface ApprovalWatch {
  /**
   * Resolves with the symbols the printer's screen shows, when the printer
   * says `pending`. Never resolves if the browser is admitted or refused
   * without being held.
   */
  readonly pending: Promise<string>;
  /** The end of the wait. Never rejects. */
  readonly outcome: Promise<ApprovalOutcome>;
  /** Stops waiting and closes the connection, which withdraws the request. */
  cancel (): void;
}

const FAILURES: readonly string[] = ['refused', 'timed_out', 'disabled', 'busy', 'cooldown']
const failureOf = (reason: unknown): ApprovalFailure | null =>
  typeof reason === 'string' && FAILURES.includes(reason) ? reason as ApprovalFailure : null

/** Told of each wait that starts, so the page can show the dialog for it. */
let listener: ((watch: ApprovalWatch) => void) | null = null
export function onApprovalWatch (next: ((watch: ApprovalWatch) => void) | null): void {
  listener = next
}

/** The part of muon-link-web's endpoint this file uses (muon-link#126; not released yet). */
export interface ApprovingEndpoint<Session> {
  connectAs?: (
    printerId: string,
    name: string,
    requestedRole: 'operator' | 'viewer',
    onPending: (notice: { code: string, expiresIn?: number }) => void,
    onClosed: (reason?: string) => void
  ) => Promise<Session>;
}

/**
 * TODO(I-170 wire): the ONE place that reads `pending` and the close reason
 * from muon-link-web. Dials with `endpoint.connectAs` when the endpoint has
 * it, and resolves null when it does not (an older package), so the caller
 * dials as today and "waiting for approval" is not offered.
 *
 * Assumptions, from muon-link#126 (draft, unreleased) and to confirm on release:
 *  - `connectAs(printerId, name, requestedRole, onPending, onClosed)`; the
 *    role asked for is 'operator', never owner;
 *  - `onPending({ code, expiresIn })` carries the FULL 6 symbols and is
 *    re-sent about every 2 s while held, so only the first call is acted on;
 *  - admission is the returned session: it just proceeds;
 *  - `onClosed(reason)` gets one of refused | timed_out | disabled | busy |
 *    cooldown, or undefined; a rejection carries `kind: 'refused'` and `reason`;
 *  - over Bluetooth the caller has called `addLink` first.
 */
export async function connectWithApproval<Session> (
  endpoint: ApprovingEndpoint<Session>,
  printerId: string,
  name: string
): Promise<Session | null> {
  if (typeof endpoint.connectAs !== 'function') return null
  let sawPending!: (symbols: string) => void
  let ended!: (outcome: ApprovalOutcome) => void
  let abandon!: (error: Error) => void
  let cancelled = false
  const watch: ApprovalWatch = {
    pending: new Promise<string>(resolve => { sawPending = resolve }),
    outcome: new Promise<ApprovalOutcome>(resolve => { ended = resolve }),
    cancel: () => {
      cancelled = true
      abandon(new Error('Cancelled'))
    }
  }
  const abandoned = new Promise<never>((_resolve, reject) => { abandon = reject })
  abandoned.catch(() => {})
  listener?.(watch)
  try {
    const session = await Promise.race([
      endpoint.connectAs(
        printerId,
        name,
        'operator',
        notice => { if (!cancelled) sawPending(notice.code) },
        reason => {
          const failure = failureOf(reason)
          if (failure && !cancelled) ended(failure)
        }
      ),
      abandoned
    ])
    ended('admitted')
    return session
  } catch (error) {
    const failure = failureOf((error as { reason?: unknown }).reason) ??
      ((error as { kind?: unknown }).kind === 'refused' ? 'refused' : null)
    if (failure && !cancelled) ended(failure)
    throw error
  }
}

export const APPROVAL_WORDS: Record<ApprovalFailure, string> = {
  refused: 'The printer refused this device.',
  timed_out: 'Nobody answered at the printer in time.',
  disabled: "This printer isn't accepting new devices. Ask its owner.",
  busy: 'The printer already has requests waiting. Try again in a moment.',
  cooldown: 'Too many tries. Wait a little, then try again.'
}
