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

/**
 * TODO(I-170 wire): the only place that reads `pending` and the close reason
 * from muon-link-web. Returns null while muon-link-web (pinned 4b2e45a)
 * exposes neither, so "waiting for approval" is not offered and today's
 * behaviour (the "coming soon" line) stays.
 *
 * Assumptions to confirm against the released muon-link-web:
 *  - the printer sends one `pending` notice, `{ code: <symbols> }`, on the
 *    connection that dialled `muon/gateway/1`; the symbols are 6 (I-172) or
 *    4 (first plan) and are shown as given;
 *  - an admitted device sees no further frame: the connection proceeds;
 *  - otherwise the connection closes with a reason that is one of
 *    `refused | timed_out | disabled | busy | cooldown`; any other reason is
 *    not an approval outcome and the normal connection error applies;
 *  - the hello carries this browser's device name (set when dialling).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function watchForApproval (printerId: string): ApprovalWatch | null {
  return null
}

/** Whether this build can wait for approval at all. */
export const approvalSupported = (): boolean => watchForApproval('') !== null

export const APPROVAL_WORDS: Record<ApprovalFailure, string> = {
  refused: 'The printer refused this device.',
  timed_out: 'Nobody answered at the printer in time.',
  disabled: "This printer isn't accepting new devices. Ask its owner.",
  busy: 'The printer already has requests waiting. Try again in a moment.',
  cooldown: 'Too many tries. Wait a little, then try again.'
}
