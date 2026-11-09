/**
 * Maintenance's Checks tile: what the printer can tell about itself without
 * moving anything or running a test. With Moonraker not answering, the rows that
 * read live values say Unknown rather than OK. Each row says what was read, in a word
 * (OK, Re-run soon...) and a line of the reading behind it. A row appears only
 * when the printer has the thing to read.
 */
import type { CheckStatus } from './model'

export type HealthTone = 'ok' | 'warn' | 'err' | 'off'

export interface HealthRow {
  id: 'klipper' | 'mcu' | 'heaters' | 'bedMesh' | 'storage';
  /** A FrameIcon name. */
  icon: string;
  title: string;
  /** The reading behind the verdict. */
  sub: string;
  tone: HealthTone;
  /** The verdict in a word. */
  pill: string;
}

export interface HealthInput {
  socketConnected: boolean;
  /** Klipper's state: ready, startup, shutdown, error. */
  klippyState: string;
  klippyReady: boolean;
  /** Klipper's version, when it said. */
  version?: string;
  /** The boards Klipper talks to (mcu, mcu toolhead...). */
  mcus: Array<{ name: string, awake?: number }>;
  heaters: Array<{ name: string, temperature: number, maxTemp?: number }>;
  /** The bed mesh, when the printer has one: whether a measured mesh is loaded, how its check stands and how far apart its points are. */
  bedMesh: { loaded: boolean, status: CheckStatus, spread: number | null, measured: string } | null;
  /** The disk Moonraker keeps files on, in bytes. */
  disk: { used: number, total: number, free: number } | null;
}

const GB = 1024 ** 3

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** "Hotend", "Bed", or the heater's own name as it is written in the config. */
export function heaterName (name: string): string {
  if (name === 'extruder' || /^extruder\d+$/.test(name)) return name === 'extruder' ? 'Hotend' : `Hotend ${name.slice(8)}`
  if (name === 'heater_bed') return 'Bed'
  return name.replace(/^heater_generic /, '').replace(/_/g, ' ')
}

/** "18% used · 24 GB free". */
export function storageText (disk: { used: number, total: number, free: number }): string {
  const used = Math.round(100 * disk.used / disk.total)
  const free = disk.free >= 10 * GB ? Math.round(disk.free / GB) : Math.round(disk.free / GB * 10) / 10
  return `${used}% used · ${free} GB free`
}

function klipperRow (i: HealthInput): HealthRow {
  const base = { id: 'klipper', icon: 'check', title: 'Klipper and Moonraker' } as const
  if (!i.socketConnected) return { ...base, sub: 'Moonraker is not answering', tone: 'err', pill: 'Offline' }
  if (i.klippyReady) return { ...base, sub: i.version ? `Running · ${i.version}` : 'Running', tone: 'ok', pill: 'OK' }
  if (i.klippyState === 'startup') return { ...base, sub: 'Klipper is starting up', tone: 'warn', pill: 'Starting' }
  return { ...base, sub: `Klipper is ${i.klippyState || 'not ready'}`, tone: 'err', pill: 'Not ready' }
}

/** Not read: Moonraker is not answering, so what the printer last said is not a verdict. */
function unknown (base: Pick<HealthRow, 'id' | 'icon' | 'title'>): HealthRow {
  return { ...base, sub: 'Not read while Moonraker is not answering', tone: 'off', pill: 'Unknown' }
}

function mcuRow (i: HealthInput): HealthRow | null {
  if (!i.mcus.length) return null
  const base = { id: 'mcu', icon: 'chip', title: 'MCU and toolhead board' } as const
  if (!i.socketConnected) return unknown(base)
  if (!i.klippyReady) return { ...base, sub: 'Not connected while Klipper is not ready', tone: 'warn', pill: 'Waiting' }
  const loads = i.mcus.map(m => m.awake).filter(finite)
  const load = loads.length ? ` · load ${Math.round(100 * Math.max(...loads))}%` : ''
  const count = i.mcus.length
  const which = count === 1 ? 'Connected' : count === 2 ? 'Both connected' : `All ${count} connected`
  return { ...base, sub: `${which}${load}`, tone: 'ok', pill: 'OK' }
}

function heatersRow (i: HealthInput): HealthRow | null {
  if (!i.heaters.length) return null
  const base = { id: 'heaters', icon: 'thermometer', title: 'Heater sensors' } as const
  if (!i.socketConnected) return unknown(base)
  const bad = i.heaters.filter(h => !finite(h.temperature))
  if (bad.length) return { ...base, sub: `${bad.map(h => heaterName(h.name)).join(', ')} not reading`, tone: 'err', pill: 'No reading' }
  const hot = i.heaters.filter(h => finite(h.maxTemp) && h.temperature >= (h.maxTemp as number))
  if (hot.length) return { ...base, sub: `${hot.map(h => heaterName(h.name)).join(', ')} at its limit`, tone: 'err', pill: 'Too hot' }
  const shown = i.heaters.slice(0, 3).map(h => `${heaterName(h.name)} ${h.temperature.toFixed(1)} °C`).join(' · ')
  return { ...base, sub: shown, tone: 'ok', pill: 'OK' }
}

function bedMeshRow (i: HealthInput): HealthRow | null {
  if (!i.bedMesh) return null
  const { loaded, status, spread, measured } = i.bedMesh
  const base = { id: 'bedMesh', icon: 'mesh', title: 'Bed mesh' } as const
  if (!loaded) return { ...base, sub: 'No mesh loaded · calibrate the mesh to measure the plate', tone: 'warn', pill: 'Not levelled' }
  const spreadText = spread === null ? '' : ` · ${spread.toFixed(2)} mm spread`
  const when = measured ? `Last calibrated ${measured}` : 'Not calibrated from here yet'
  if (status.due) return { ...base, sub: `${when}${spreadText}`, tone: 'warn', pill: measured ? 'Re-run soon' : 'Run it' }
  return { ...base, sub: `${when}${spreadText}`, tone: status.tone === 'off' ? 'off' : 'ok', pill: status.tone === 'off' ? 'Not run' : 'OK' }
}

function storageRow (i: HealthInput): HealthRow | null {
  if (!i.disk || !finite(i.disk.total) || i.disk.total <= 0) return null
  const base = { id: 'storage', icon: 'plate', title: 'Storage' } as const
  if (!i.socketConnected) return unknown(base)
  const low = i.disk.free < GB
  return { ...base, sub: storageText(i.disk), tone: low ? 'warn' : 'ok', pill: low ? 'Low' : 'OK' }
}

/** The rows, in the order the tile lists them. */
export function healthRows (input: HealthInput): HealthRow[] {
  return [klipperRow(input), mcuRow(input), heatersRow(input), bedMeshRow(input), storageRow(input)]
    .filter((r): r is HealthRow => r !== null)
}

/** How many rows want a look. */
export function attentionCount (rows: HealthRow[]): number {
  return rows.filter(r => r.tone === 'warn' || r.tone === 'err').length
}

/** The line under the page title: how the printer stands, and when a check last ran here. */
export function healthSummary (name: string, rows: HealthRow[], lastRun: number | null, now: number): string {
  const count = attentionCount(rows)
  const state = count === 0 ? `${name} is in good shape` : count === 1 ? `${name} has 1 thing to look at` : `${name} has ${count} things to look at`
  if (!lastRun) return `${state} · no check run from here yet`
  const days = Math.floor((now - lastRun) / 86_400_000)
  return `${state} · last check ${days < 1 ? 'today' : days < 2 ? 'yesterday' : `${days} days ago`}`
}
