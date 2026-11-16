/**
 * System › Restart or stop (KAN-1726, KAN-1972): the four rows, mildest
 * first, what each says while it runs, and when one is refused. Pure, so
 * the page and its tests share the words.
 */
import Vue from 'vue'
import { HOT_C } from '@/services/updates/policy'

export type RestartRowId = 'klipper' | 'boards' | 'computer' | 'shutdown'

export interface RestartRow {
  id: RestartRowId
  title: string
  line: string
  button: string
  /** Seconds it usually takes, for the progress line. */
  eta: number
  danger?: boolean
}

export const RESTART_ROWS: RestartRow[] = [
  { id: 'klipper', title: 'Restart Klipper', line: "Reloads the printer's configuration. Back in about 10 s.", button: 'Restart', eta: 10 },
  { id: 'boards', title: 'Restart Klipper and the boards', line: 'After an error that says "firmware restart". Back in about 20 s.', button: 'Restart', eta: 20 },
  { id: 'computer', title: 'Restart the computer', line: 'Everything restarts. This page reconnects by itself in 1–2 minutes.', button: 'Restart', eta: 120 },
  { id: 'shutdown', title: 'Shut down', line: "It stays off until it's switched off and on at the printer.", button: 'Shut down…', eta: 0, danger: true }
]

/** Why the computer can't be restarted or shut down now; null when it can. */
export function hostRefusal (printing: boolean, paused = false): string | null {
  if (printing) return 'Not while printing: it would stop the print. Wait for it to finish, or cancel it first.'
  if (paused) return 'Not while a print is paused: it would lose the print. Resume or cancel it first.'
  return null
}

/** While printing, a Klipper restart stops the print: what the confirm says. */
export function printStopWarning (file: string | null, progress: number | null): string {
  const what = file ? file.replace(/\.gcode$/i, '') : 'The print'
  const at = progress !== null && Number.isFinite(progress) ? ` at ${Math.round(progress * 100)}%` : ''
  return `${what} stops${at} and can't be resumed. The heaters turn off.`
}

export type RunPhase = 'running' | 'back' | 'failed' | 'cooling'

export interface RowRun {
  phase: RunPhase
  title: string
  line: string
  startedAt: number
}

/** "took 8 s", "took 1 min 12 s". */
export function took (ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `took ${s} s`
  return `took ${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`
}

export function clock (at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function runningLine (eta: number): string {
  if (eta >= 60) return `Usually ${Math.round(eta / 60)}–${Math.round(eta / 60) + 1} min. This page reconnects by itself.`
  return `Usually ${eta} s. Controls come back when it answers.`
}

/** The hotend's line in the Shut down confirm (open question 1, recommended answer). */
export function shutdownHeatLine (temp: number | null): string {
  if (temp === null || !Number.isFinite(temp)) return ''
  const t = Math.round(temp)
  if (temp <= HOT_C) return `Hotend is ${t} °C: safe to shut down.`
  return `Hotend is ${t} °C: the fan cools it to ${HOT_C} °C first, then it shuts down, so heat doesn't creep up the heatsink.`
}

export function needsCooling (temp: number | null): boolean {
  return temp !== null && Number.isFinite(temp) && temp > HOT_C
}

/** Moonraker has no Stop (it is this page); Muon link has none while this page reaches the printer through it. */
export function canStopService (name: string, away: boolean): boolean {
  const n = name.toLowerCase()
  if (n.includes('moonraker')) return false
  if (away && (n.includes('link') || n.includes('iroh'))) return false
  return true
}

/** The log a program writes, when there is one to download. */
export function serviceLog (name: string): string | null {
  const n = name.toLowerCase()
  if (n === 'klipper') return 'klippy.log'
  if (n === 'moonraker') return 'moonraker.log'
  if (n.includes('crowsnest')) return 'crowsnest.log'
  return null
}

/**
 * The computer was shut down from here: until it answers again, the page
 * and the printer chip say "Off", not "Offline" or "Disconnected".
 */
export const hostPower = Vue.observable({ offAt: null as number | null })

export function markHostOff (at = Date.now()) {
  hostPower.offAt = at
}

export function clearHostOff () {
  hostPower.offAt = null
}
