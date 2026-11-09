/**
 * The printer's own choices about updates (KAN-1925), as Settings › Updates
 * shows them. Jack, 9 Nov: a new version always downloads into the spare
 * slot in the background; with automatic updates on, the printer boots into
 * it and commits it on its next restart, whenever that is. Control never
 * schedules a restart.
 *
 * - `auto_install` (KAN-1925, assumed shape): GET/POST /update/auto_install
 *   `{ "enabled": bool }`, ON on a fresh printer.
 * - The presence gate (MuonOS #492): GET/POST /update/presence
 *   `{ "required": bool }`, OFF on a fresh printer. With it on, an install
 *   from anyone but the printer's screen waits for a knob press.
 *
 * Both are the printer's: Control shows what it says and sends the owner's
 * choice, and the printer refuses what it won't allow.
 */
import type { AuxUpdateStatus } from './model'
import { commitPending, isStaged, stagedUnverified } from './model'

export const AUTO_INSTALL_PATH = '/server/aux/update/auto_install'
export const PRESENCE_PATH = '/server/aux/update/presence'

export const AUTO_ON_TEXT = 'Automatic updates: On. New versions download in the background and install the next time the printer restarts.'
export const AUTO_OFF_TEXT = 'Automatic updates: Off. New versions still download in the background. Install them here when you choose.'
export const STAGED_TEXT = 'Update ready, installs on next restart'
export const KNOB_TEXT = 'Press the knob on the printer to confirm'

/** What the printer reports beyond /update/status's long-standing fields. */
export interface PolicyStatus extends AuxUpdateStatus {
  auto_install?: boolean | null;
  install_presence_required?: boolean | null;
}

/** `{ enabled }` or `{ required }`, unwrapped from Moonraker's `result`, or null when it says nothing usable. */
export function flagOf (data: unknown, key: 'enabled' | 'required'): boolean | null {
  const body = (data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data) as Record<string, unknown> | null | undefined
  const value = body && typeof body === 'object' ? body[key] : undefined
  return typeof value === 'boolean' ? value : null
}

/** A staged version that matches what is ready to install and can be checked from here. */
export function stagedReady (status: AuxUpdateStatus | null): boolean {
  if (!isStaged(status)) return false
  if (stagedUnverified(status)) return false
  const staged = status?.stage?.version
  return !staged || staged === status?.target_version
}

export interface RestartGuardInput {
  status: AuxUpdateStatus | null;
  canControl: boolean;
  klippyConnected: boolean;
  printerState: string;
  /** Any heater set or still warm. */
  hot: boolean;
  /** An install already under way. */
  active: boolean;
}

/** Why "Restart now to update" can't be pressed now, or '' when it can. */
export function restartBlocked (i: RestartGuardInput): string {
  if (!i.canControl) return 'Connect to a printer you can control first.'
  if (!i.klippyConnected) return 'Klipper is not connected.'
  const state = i.printerState.toLowerCase()
  if (state === 'printing') return 'Not while printing.'
  if (state === 'paused') return 'Not while a print is paused.'
  if (i.active) return 'An update is already under way.'
  if (commitPending(i.status)) return 'The printer is still checking the last update.'
  if (state !== 'ready' && state !== 'standby' && state !== 'complete' && state !== 'cancelled' && state !== 'idle') return 'Wait until the printer is idle.'
  if (i.hot) return 'Wait until the heaters have cooled.'
  if (stagedUnverified(i.status)) return "An update is staged, but it can't be checked from here yet. Install it from the printer's screen."
  const staged = i.status?.stage?.version
  if (staged && staged !== i.status?.target_version) return "The staged update doesn't match the version that is ready. Check again."
  return ''
}

/** A heater that is on or still at least this warm counts as hot. */
export const HOT_C = 50

export function anyHot (heaters: Array<{ temperature?: number, target?: number }>): boolean {
  return heaters.some(h => (h.target ?? 0) > 0 || (h.temperature ?? 0) >= HOT_C)
}

/** The printer answered an install by asking for a knob press (MuonOS #492: 202 consent_required). */
export function needsKnob (data: unknown): boolean {
  const body = (data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data) as Record<string, unknown> | null | undefined
  return !!body && typeof body === 'object' && body.consent_required === true
}
