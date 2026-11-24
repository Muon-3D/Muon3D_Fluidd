/**
 * The admin portal's session (KAN-6100, spec section 3; Jack's D-204): one staff
 * session of 60 minutes, which 15 minutes without activity also ends. The console
 * enforces both on every call; this file only displays them and keeps the page
 * alive across the end (phase `ended`) so one passkey tap picks up where it was.
 * Memory only: nothing here is stored.
 */
import Vue from 'vue'
import { AdminError, adminAvailable, setSessionProbe, confirmStaff, endStaffSession, staffSession, touchStaffSession, type StaffSession } from './client'
import { storedToken } from '@/services/muon-cloud/api'

export type Phase = 'loading' | 'wrong-origin' | 'signed-out' | 'not-staff' | 'not-confirmed' | 'no-passkey' | 'open' | 'ended' | 'unreachable'
export type EndReason = '' | 'idle' | 'absolute' | 'ended'

export const IDLE_WARN_S = 120
export const ABSOLUTE_WARN_S = 300
export const TOUCH_EVERY_MS = 60_000
/** In `ended`, in-memory page data is dropped after this long. */
export const KEEP_DATA_MS = 10 * 60_000

export interface PortalState {
  phase: Phase;
  actor: string;
  /** Local-clock ms at which each limit ends. */
  absoluteEnd: number;
  idleEnd: number;
  now: number;
  endReason: EndReason;
  endedAt: number;
  busy: boolean;
  /** The passkey ceremony was cancelled or failed. */
  failed: boolean;
  /** Bumped on every successful (re)confirmation: views resume when it changes. */
  epoch: number;
}

export const portal: PortalState = Vue.observable({
  phase: 'loading', actor: '', absoluteEnd: 0, idleEnd: 0, now: Date.now(), endReason: '', endedAt: 0, busy: false, failed: false, epoch: 0
} as PortalState)

setSessionProbe(() => portal.phase === 'open' && portal.absoluteEnd > Date.now())

let inputSeen = false
let lastTouch = 0

/** Whether the shell may show the portal's sections (and so fetch their data). */
export const showsPortal = (phase: Phase): boolean => phase === 'open' || phase === 'ended'

export function absoluteLeft (state: Pick<PortalState, 'absoluteEnd' | 'now'> = portal): number { return Math.max(0, (state.absoluteEnd - state.now) / 1000) }
export function idleLeft (state: Pick<PortalState, 'idleEnd' | 'now'> = portal): number { return Math.max(0, (state.idleEnd - state.now) / 1000) }

/** Which banner to show. Idle wins: it can be gone in under two minutes with no other sign. */
export function warning (state: Pick<PortalState, 'phase' | 'absoluteEnd' | 'idleEnd' | 'now'> = portal): '' | 'idle' | 'absolute' {
  if (state.phase !== 'open') return ''
  if (idleLeft(state) < IDLE_WARN_S) return 'idle'
  if (absoluteLeft(state) < ABSOLUTE_WARN_S) return 'absolute'
  return ''
}

/** Which limit a lapsed session hit, when the console did not say: whichever the clocks passed first. */
export function inferReason (state: Pick<PortalState, 'absoluteEnd' | 'idleEnd'>): 'idle' | 'absolute' {
  return state.absoluteEnd && state.absoluteEnd <= state.idleEnd ? 'absolute' : 'idle'
}

export function apply (session: StaffSession, received = Date.now()): void {
  const skew = session.server_time ? session.server_time * 1000 - received : 0
  portal.actor = session.actor
  portal.absoluteEnd = session.staff_expires_at * 1000 - skew
  // A console from before the idle limit sends none: only the absolute limit is shown.
  portal.idleEnd = session.staff_idle_expires_at ? session.staff_idle_expires_at * 1000 - skew : Number.MAX_SAFE_INTEGER
  portal.now = received
  portal.phase = 'open'; portal.endReason = ''; portal.failed = false
  portal.epoch++
  lastTouch = received; inputSeen = false
}

export function expire (reason: EndReason): void {
  if (portal.phase === 'ended') return
  portal.phase = 'ended'
  portal.endReason = reason || inferReason(portal)
  portal.endedAt = Date.now()
}

/** What a failed call means for the portal. Returns true when it was an authority failure the shell handled. */
export function noteFailure (error: unknown): boolean {
  if (!(error instanceof AdminError)) return false
  if (error.status === 401) { portal.phase = 'signed-out'; return true }
  if (error.code === 'console.staff.required') { portal.phase = 'not-staff'; return true }
  if (error.expired || error.code === 'console.staff.reauth_required') {
    const reason = error.reason === 'idle' || error.reason === 'absolute' || error.reason === 'ended' ? error.reason : ''
    if (portal.phase === 'open') expire(reason)
    else if (portal.phase !== 'ended') portal.phase = 'not-confirmed'
    return true
  }
  return false
}

/** Reads the session without counting as activity, and settles the phase. */
export async function load (): Promise<void> {
  if (!adminAvailable()) { portal.phase = 'wrong-origin'; return }
  if (!storedToken()) { portal.phase = 'signed-out'; return }
  try {
    apply(await staffSession())
  } catch (error) {
    if (noteFailure(error)) return
    if (portal.phase === 'loading') portal.phase = 'unreachable'
  }
}

/** A tab that comes back, or the minute check: adopt the console's view of both limits (another tab may have confirmed or ended it). */
export async function sync (): Promise<void> {
  if (portal.phase !== 'open' && portal.phase !== 'ended') return
  try { apply(await staffSession()) } catch (error) { noteFailure(error) }
}

export async function confirm (): Promise<void> {
  if (portal.busy) return
  portal.busy = true; portal.failed = false
  try {
    apply(await confirmStaff())
  } catch (error) {
    if (error instanceof AdminError && error.status === 409) portal.phase = 'no-passkey'
    else if (error instanceof AdminError && (error.status === 401 || error.code === 'console.staff.required')) noteFailure(error)
    else portal.failed = true
  } finally { portal.busy = false }
}

export async function end (): Promise<void> {
  try { await endStaffSession() } catch (error) { if (noteFailure(error)) return }
  portal.phase = 'ended'; portal.endReason = 'ended'; portal.endedAt = Date.now()
}

export function noteInput (): void { inputSeen = true }

/** Sent at most once a minute, and only if the person did something in that minute. */
export async function touchIfActive (now = Date.now()): Promise<void> {
  if (portal.phase !== 'open' || !inputSeen || now - lastTouch < TOUCH_EVERY_MS) return
  inputSeen = false; lastTouch = now
  try { apply(await touchStaffSession()) } catch (error) { noteFailure(error) }
}

/** "Stay signed in": counts now, whatever the minute says. */
export async function stay (): Promise<void> {
  inputSeen = true; lastTouch = 0
  await touchIfActive(Date.now())
}

/** Once a second. Ends the session on the client clock when a limit passes; the console decides for real. */
export function tick (now = Date.now()): void {
  portal.now = now
  if (portal.phase !== 'open') return
  if (now >= portal.absoluteEnd) expire('absolute')
  else if (now >= portal.idleEnd) expire('idle')
}

export function resetForTests (): void {
  Object.assign(portal, { phase: 'loading', actor: '', absoluteEnd: 0, idleEnd: 0, now: Date.now(), endReason: '', endedAt: 0, busy: false, failed: false, epoch: 0 })
  inputSeen = false; lastTouch = 0
}
