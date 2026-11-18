import Vue from 'vue'
import { httpClientActions } from '@/api/httpClientActions'

/**
 * A developer-mode change, asked for through Moonraker's one route for it,
 * `/server/muon/dev_mode/request` (KAN-547).
 *
 * Jack's rule (17 Nov): the first release of the warranty is confirmed on the
 * printer's screen; after that it is an ordinary setting, from Control over any
 * route. A printer nobody owns takes a request from anyone; a linked
 * printer only from its owning account, which is one of the owner's own
 * devices (the phone app, or a browser enrolled as theirs), from anywhere.
 * The printer decides: its Aux API refuses everyone else and names the
 * account. Moonraker's route is what tells it a request is the owner's, and
 * it is the only route a remote session may use: muon-link keeps
 * `/server/aux/` closed to every one of them.
 *
 * What MuonOS train 17 ships is POST only (Moonraker aux_api_proxy.py registers
 * `["POST"]`, and muon-link's policy.rs admits POST alone, for an Operator):
 *  - `POST {enabled}`: the change itself. Off is taken at once; on is taken at
 *    once after the first release, and before it opens a challenge on the
 *    printer's screen (`{challenge_id}`).
 * Newer printers also answer two GETs on the same route, and Control uses them
 * when they are there:
 *  - `GET` with nothing: who may ask, and the waiver turning on agrees to;
 *  - `GET {challenge_id}`: has the person there answered;
 *  - `POST {enabled, challenge_id, ...}`: make the change, once confirmed.
 * A GET on a POST-only route is a 405 locally and a 403 over Bluetooth or the
 * relay (muon-link's default for a path it has no GET rule for). Neither means
 * "no": Control then lets the printer decide when it is asked (KAN-4351).
 *
 * Moonraker answers a refusal as `dev-mode:<code>: <why>`, so the code is
 * read here and the words are the printer's own.
 */

export const DEV_MODE_REQUEST_PATH = '/server/muon/dev_mode/request'

export interface DevModeWaiver {
  version: string;
  text: string;
}

export interface DevModeOwner {
  /** null when the printer can't tell. */
  linked: boolean | null;
  account: string | null;
}

export interface DevModeAsking {
  /** This connection counts as the printer's owner. */
  asOwner: boolean;
  owner: DevModeOwner;
  /** The owner, or anyone while nobody owns the printer. */
  mayAsk: boolean;
  waiver: DevModeWaiver | null;
}

export interface DevModeChallenge {
  challengeId: string;
  enabled: boolean;
  expiresInSeconds: number;
  instruction: string;
  waiver: DevModeWaiver | null;
}

export interface DevModeAnswer {
  confirmed: boolean;
  refused: boolean;
  /** The printer did it itself (a POST-only printer): there is nothing left to complete. */
  applied?: boolean;
}

export interface DevModeCompletion {
  enabled: boolean;
  challengeId: string;
  waiverVersion?: string;
}

/** A refusal the printer explained, with its code (owner_required, no_change, ...). */
export class DevModeRefused extends Error {
  constructor (readonly code: string, message: string, readonly status: number) {
    super(message)
    this.name = 'DevModeRefused'
  }
}

/** The printer has no request route: its software predates KAN-547. */
export class DevModeRequestUnavailable extends Error {
  readonly status = 404

  constructor () {
    super("This printer's software can't take a developer-mode request. Update it, then try again.")
    this.name = 'DevModeRequestUnavailable'
  }
}

/** A challenge id as the Aux API makes them. Anything else is never sent. */
const CHALLENGE_ID = /^[A-Za-z0-9_-]{16,128}$/
const DEFAULT_WAIT_SECONDS = 120
const REFUSAL = /^dev-mode:([a-z_]+):\s*([\s\S]*)$/

function messageOf (data: unknown): string | undefined {
  if (typeof data === 'string') return data
  const message = (data as { error?: { message?: unknown } } | null)?.error?.message
  return typeof message === 'string' ? message : undefined
}

/** What a failed call means, as an error a person can be shown. */
export function refusalOf (error: unknown): Error {
  const response = (error as { response?: { status: number, data?: unknown } } | null)?.response
  if (!response) return error instanceof Error ? error : new Error(String(error))
  const message = messageOf(response.data)
  const match = message ? REFUSAL.exec(message) : null
  if (match) return new DevModeRefused(match[1], match[2].trim(), response.status)
  // Moonraker's own 404: no such route on this printer.
  if (response.status === 404) return new DevModeRequestUnavailable()
  return new DevModeRefused('refused', message || `The printer refused (HTTP ${response.status}).`, response.status)
}

function unwrap (data: unknown): Record<string, unknown> {
  const body = data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data
  if (!body || typeof body !== 'object') throw new Error('the printer gave no answer')
  return body as Record<string, unknown>
}

function waiverOf (value: unknown): DevModeWaiver | null {
  const { version, text } = (value ?? {}) as { version?: unknown, text?: unknown }
  return typeof version === 'string' && version && typeof text === 'string' && text ? { version, text } : null
}

async function send (method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const response = method === 'GET'
      ? await Vue.$httpClient.get(DEV_MODE_REQUEST_PATH, { params: body })
      : await Vue.$httpClient.post(DEV_MODE_REQUEST_PATH, body ?? {})
    return unwrap(response.data)
  } catch (error) {
    throw refusalOf(error)
  }
}

function checkedId (challengeId: string): string {
  if (!CHALLENGE_ID.test(challengeId)) throw new Error('not a challenge id')
  return challengeId
}

/**
 * A printer whose route is POST only: 405 on a plain connection, 403 over
 * Bluetooth or the relay (a 404 is a printer without the route, and is said). The GET is not
 * refusing the person; there is just no such question to ask.
 */
export function noSuchQuestion (error: unknown): boolean {
  return error instanceof DevModeRefused && error.code === 'refused' && (error.status === 403 || error.status === 405)
}

/** What Control assumes when the printer can't be asked: the printer decides when it is asked to change. */
const LET_THE_PRINTER_DECIDE: DevModeAsking = {
  asOwner: false,
  owner: { linked: null, account: null },
  mayAsk: true,
  waiver: null
}

/** Who may ask on this printer, and what turning on agrees to. Asks nothing of its screen. */
export async function whoMayAsk (): Promise<DevModeAsking> {
  let body: Record<string, unknown>
  try {
    body = await send('GET')
  } catch (error) {
    if (noSuchQuestion(error)) return LET_THE_PRINTER_DECIDE
    throw error
  }
  const owner = (body.owner ?? {}) as { linked?: unknown, account?: unknown }
  return {
    asOwner: body.as_owner === true,
    owner: {
      linked: typeof owner.linked === 'boolean' ? owner.linked : null,
      account: typeof owner.account === 'string' && owner.account ? owner.account : null
    },
    mayAsk: body.may_ask === true,
    waiver: waiverOf(body.waiver)
  }
}

/** What the printer did with a request: opened a question at its screen, or just took it. */
export type DevModeRequested =
  | { kind: 'challenge', challenge: DevModeChallenge }
  | { kind: 'applied', enabled: boolean }

/**
 * Asks for a change. Only the first release of the warranty needs the person
 * at the printer (KAN-3604), so the printer decides: it opens a challenge
 * (`challenge_id`) that waits for its screen, or it takes the change at once
 * and answers `{enabled}` with no challenge. Control follows what it says and
 * never assumes either.
 */
export async function requestChange (enabled: boolean): Promise<DevModeRequested> {
  const body = await send('POST', { enabled })
  if (typeof body.challenge_id !== 'string') {
    if (typeof body.enabled === 'boolean') return { kind: 'applied', enabled: body.enabled }
    throw new Error('the printer opened no request')
  }
  return {
    kind: 'challenge',
    challenge: {
      challengeId: checkedId(body.challenge_id),
      enabled: typeof body.enabled === 'boolean' ? body.enabled : enabled,
      // A POST-only printer answers the id alone: say what to do, and wait a while.
      expiresInSeconds: typeof body.expires_in_seconds === 'number' ? body.expires_in_seconds : DEFAULT_WAIT_SECONDS,
      instruction: typeof body.instruction === 'string' && body.instruction ? body.instruction : "Confirm this on the printer's screen.",
      waiver: waiverOf(body.waiver)
    }
  }
}

/** Puts the question on the printer's screen; throws when the printer took the change without one. */
export async function askToChange (enabled: boolean): Promise<DevModeChallenge> {
  const asked = await requestChange(enabled)
  if (asked.kind !== 'challenge') throw new Error('the printer opened no request')
  return asked.challenge
}

/**
 * Whether the person at the printer has answered. A printer that can't be asked
 * (POST only) is watched instead: the change is done when it reads as made.
 */
export async function readAnswer (challengeId: string, enabled?: boolean): Promise<DevModeAnswer> {
  let body: Record<string, unknown>
  try {
    body = await send('GET', { challenge_id: checkedId(challengeId) })
  } catch (error) {
    if (!noSuchQuestion(error) || typeof enabled !== 'boolean') throw error
    const state = await readState()
    return { confirmed: state === enabled, refused: false, applied: state === enabled }
  }
  if (typeof body.confirmed !== 'boolean') throw new Error('the printer gave no answer')
  return { confirmed: body.confirmed, refused: body.refused === true }
}

/** The read-only state, `/server/muon/dev_mode` (a Viewer may read it over any route). */
async function readState (): Promise<boolean | null> {
  const response = await httpClientActions.serverMuonDevModeGet()
  const enabled = response.data?.result?.enabled
  return typeof enabled === 'boolean' ? enabled : null
}

/** Makes the confirmed change. Turning on acknowledges the waiver shown. */
export async function completeChange (change: DevModeCompletion): Promise<{ enabled: boolean }> {
  const body: Record<string, unknown> = { enabled: change.enabled, challenge_id: checkedId(change.challengeId) }
  if (change.enabled) {
    body.waiver_acknowledged = true
    body.waiver_version = change.waiverVersion
  }
  const answer = await send('POST', body)
  return { enabled: answer.enabled === true }
}

/** What to tell someone who may not ask, or null when they may. */
export function whyNot (asking: DevModeAsking | null): string | null {
  if (asking === null || asking.mayAsk) return null
  if (asking.owner.linked === null) {
    return "The printer can't tell yet whether an account owns it, so only its owner can change developer mode. Try again in a minute."
  }
  const who = asking.owner.account ?? "the printer's owner"
  return `Only ${who} can change developer mode on this printer, from one of their own devices. The first time it is turned on, the printer's screen confirms it.`
}
