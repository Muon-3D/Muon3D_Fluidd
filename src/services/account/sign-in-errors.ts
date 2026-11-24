/**
 * What the sign-in card says when something fails (spec 4.10, "Alerts").
 *
 * The console's error bodies have no stable code yet: they are
 * `{"error": "<sentence>"}`. This prefers `AccountError.errorCode` when the
 * body carries one, and otherwise tells the cases apart by status and the
 * console's sentence, which is fragile and is the reason the codes in
 * `CODES` are wanted server-side (KAN-6114).
 */
import { AccountError } from './client'

/** The codes this client reads when the console sends them. */
export const CODES = {
  wrongPassword: 'invalid_credentials',
  passkeyUnknown: 'passkey_not_registered',
  passkeyExpired: 'passkey_ceremony_expired',
  wrongCode: 'mfa_code_invalid',
  codeStepExpired: 'mfa_token_expired',
  codeLocked: 'mfa_locked',
  accountExists: 'account_exists',
  rateLimited: 'rate_limited',
  linkInvalid: 'link_invalid_or_expired'
} as const

export type AlertKind = 'error' | 'warning' | 'info'
export type Flow = 'password' | 'passkey' | 'code' | 'sign-up' | 'forgot' | 'other'

export interface AuthAlert {
  kind: AlertKind;
  title: string;
  body: string;
  /** What the card does besides showing it. */
  action?: 'restart' | 'sign-in' | 'retry';
  /** Seconds to wait (429). */
  waitS?: number;
}

/** The code matches, or there is no code and the sentence does. */
const is = (error: AccountError, code: string, pattern: RegExp) =>
  error.errorCode === code || (error.errorCode === null && pattern.test(error.message))

export function isOffline (): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/** The seconds in "try again in 42 seconds", for when the header was not readable. */
function waitFromSentence (message: string): number | null {
  const match = /in (\d+) seconds?/i.exec(message)
  return match ? Number(match[1]) : null
}

export function waitText (seconds: number): string {
  return seconds >= 90 ? `Try again in about ${Math.ceil(seconds / 60)} minutes.` : `Try again in ${seconds} seconds.`
}

export function alertFor (error: unknown, flow: Flow): AuthAlert {
  if (!(error instanceof AccountError)) {
    return { kind: 'error', title: 'Something went wrong.', body: error instanceof Error ? error.message : 'Try again.' }
  }
  if (error.status === 0) {
    return isOffline()
      ? { kind: 'info', title: 'You\'re offline', body: 'Reconnect to sign in.', action: 'retry' }
      : { kind: 'error', title: 'Muon3D can\'t be reached right now.', body: 'Try again in a moment.' }
  }
  if (error.status === 429 || error.errorCode === CODES.rateLimited) {
    const waitS = error.retryAfterS ?? waitFromSentence(error.message) ?? 60
    return { kind: 'warning', title: 'Too many attempts', body: waitText(waitS), waitS }
  }
  if (flow === 'passkey') {
    if (is(error, CODES.passkeyUnknown, /not registered/i)) {
      return { kind: 'error', title: 'That passkey isn\'t set up for Muon3D.', body: 'Try a different passkey, or continue with your email.' }
    }
    if (is(error, CODES.passkeyExpired, /expired/i)) {
      return { kind: 'error', title: 'That took too long.', body: 'Try your passkey again.' }
    }
    return { kind: 'error', title: 'That passkey didn\'t work.', body: 'Try again, or continue with your email.' }
  }
  if (flow === 'code') {
    if (is(error, CODES.wrongCode, /not right/i)) {
      return { kind: 'error', title: 'That code isn\'t right.', body: 'Check your authenticator app and try again.' }
    }
    if (error.errorCode === CODES.codeStepExpired || error.errorCode === CODES.codeLocked || (error.errorCode === null && /sign in again/i.test(error.message))) {
      return { kind: 'error', title: 'That sign-in has expired.', body: 'Sign in again.', action: 'restart' }
    }
  }
  if (flow === 'password' && error.status === 401 && is(error, CODES.wrongPassword, /do not match|don't match/i)) {
    return { kind: 'error', title: 'That email and password don\'t match.', body: 'Check them and try again, or reset your password.' }
  }
  if (flow === 'sign-up' && error.status === 409) {
    return { kind: 'error', title: 'There\'s already an account for that email.', body: 'Sign in instead.', action: 'sign-in' }
  }
  return { kind: 'error', title: 'Something went wrong.', body: error.message }
}

/** The step-up sheet's error line (spec 4.10, "Step-up sheet"). */
export function stepUpMessage (error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Passkey confirmation cancelled. No action was sent.'
  if (error instanceof AccountError && error.status === 401 && is(error, CODES.wrongPassword, /password/i)) return 'That password isn\'t right.'
  return 'That didn\'t work. Try your passkey again.'
}
