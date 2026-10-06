/**
 * Joining a printer with an invite link (AB-CON-1, muon-link-cloud#14). The
 * console sends `/j/<code>` to `/#/join?code=<code>`; the page signs in if
 * it must, and `POST /v1/links/join/:code` answers `joined` at once, or
 * `pending` when the owner approves each join, which is then followed at
 * `GET /v1/approvals/:id` until the owner answers or it expires (a day).
 *
 * Pure, so the states can be tested without the page.
 */
import { CloudError, type Approval, type JoinAnswer } from './api'

/**
 * A link code: ten Crockford base32 symbols. The console reads one without
 * regard to case, hyphens or spaces, with O as 0 and I and L as 1; this does
 * the same so the page can say a pasted code is incomplete before asking.
 */
export function normalizeJoinCode (raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
  return /^[0-9A-HJKMNP-TV-Z]{10}$/.test(code) ? code : null
}

export type JoinState =
  | { kind: 'joined', printerId: string }
  | { kind: 'pending', printerId: string, approvalId: string, printerName: string, expiresAt: number }
  | { kind: 'refused', printerName: string }
  | { kind: 'expired', printerName: string }
  | { kind: 'error', reason: JoinFailure, message: string }

export type JoinFailure = 'unverified' | 'unknown' | 'owner' | 'ended' | 'busy' | 'signed_out' | 'failed'

const MESSAGES: Record<JoinFailure, string> = {
  unverified: 'Confirm your email address first: open the link the Muon3D service sent you, then try again.',
  unknown: 'This invite link does not exist. Ask the printer\'s owner for a new one.',
  owner: 'You linked this printer, so you have it already.',
  ended: 'This invite link has expired or been used up. Ask the printer\'s owner for a new one.',
  busy: 'Too many tries. Wait a while and try again.',
  signed_out: 'Sign in again to join.',
  failed: 'Could not join. Try again.'
}

export function fromApproval (approval: Approval): JoinState {
  switch (approval.state) {
    case 'allowed':
      return { kind: 'joined', printerId: approval.printer_id }
    case 'refused':
      return { kind: 'refused', printerName: approval.printer_name }
    case 'expired':
      return { kind: 'expired', printerName: approval.printer_name }
    default:
      return {
        kind: 'pending',
        printerId: approval.printer_id,
        approvalId: approval.id,
        printerName: approval.printer_name,
        expiresAt: approval.expires_at
      }
  }
}

export function fromJoinAnswer (answer: JoinAnswer): JoinState {
  return answer.state === 'joined'
    ? { kind: 'joined', printerId: answer.printer_id }
    : fromApproval(answer.approval)
}

/** The console's refusals of a join, as the page says them. */
export function fromJoinError (error: unknown): JoinState {
  const status = error instanceof CloudError ? error.status : 0
  const reason: JoinFailure =
    status === 403
      ? 'unverified'
      : status === 404
        ? 'unknown'
        : status === 409
          ? 'owner'
          : status === 410
            ? 'ended'
            : status === 429
              ? 'busy'
              : status === 401
                ? 'signed_out'
                : 'failed'
  const message = reason === 'failed' && error instanceof Error && error.message ? error.message : MESSAGES[reason]
  return { kind: 'error', reason, message }
}

/** Whether to keep asking about the approval. */
export const isWaiting = (state: JoinState | null): boolean => state?.kind === 'pending'
