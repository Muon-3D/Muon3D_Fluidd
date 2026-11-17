import type { Verb, AuxMethod } from './protocol'

/**
 * What the embedded printer screen (MuonUI's embed build at /panel/) may ask
 * Control to send on its behalf (control-mockups/v3/overview-3d/SCREEN-PLAN.md,
 * Jack 6 Nov, Opus-reviewed). Exact names only: anything not listed is refused
 * with ON_PRINTER and never reaches the printer.
 *
 * Every call goes out on Control's own connection, so it can never do more
 * than Control can. The lists are narrower still: until KAN-1764/1765/1766
 * close (aux PANEL_ONLY passing LAN callers, an unguarded hotspot route, and
 * presence gates for OTA and Wi-Fi), nothing that changes the network, the
 * printer's setup, its access, its power or its software goes through here.
 * Those stay on the printer itself.
 */

/** JSON-RPC methods forwarded as they are. */
export const RPC_FORWARD: ReadonlySet<string> = new Set([
  'printer.info',
  'printer.objects.list',
  'printer.objects.query',
  // Not printer.gcode.script: raw G-code would skip the no-go planner and could
  // run SAVE_CONFIG, SET_KINEMATIC_POSITION or any macro (Opus review, 6 Nov).
  // The panel's own move/heat buttons are refused until structured verbs exist.
  'printer.print.start',
  'printer.print.pause',
  'printer.print.resume',
  'printer.print.cancel',
  'printer.emergency_stop',
  'server.info',
  'server.config',
  'server.gcode_store',
  'server.files.list',
  'server.files.get_directory',
  'server.files.metadata',
  'server.history.list',
  'server.job_queue.status',
  'server.temperature_store'
])

/**
 * Answered by Control itself, never sent: a forwarded subscribe would replace
 * Control's own (one per connection), and identify would re-identify
 * Control's connection.
 */
export const RPC_LOCAL: ReadonlySet<string> = new Set([
  'printer.objects.subscribe',
  'server.connection.identify'
])

/** Aux reads (relative to /server/aux) forwarded as GET; no Aux write goes through. */
export const AUX_GET: ReadonlySet<string> = new Set([
  '/health',
  '/identity',
  '/update/status',
  '/wifi/current',
  // Not /wifi/show: it may carry the saved network's secret.
  '/wifi/device/status',
  '/wifi/ap/device/status'
])

/** Moonraker notifications passed on to the embed: status and Klippy's state, nothing else (no console, history or other users' events). */
export const NOTIFY_FORWARD: ReadonlySet<string> = new Set([
  'notify_status_update',
  'notify_klippy_ready',
  'notify_klippy_shutdown',
  'notify_klippy_disconnected'
])

/** Control's store actions for those notifications, mapped exactly (no case conversion). */
export const NOTIFY_ACTIONS: Readonly<Record<string, string>> = {
  'socket/notifyStatusUpdate': 'notify_status_update',
  'socket/notifyKlippyReady': 'notify_klippy_ready',
  'socket/notifyKlippyShutdown': 'notify_klippy_shutdown',
  'socket/notifyKlippyDisconnected': 'notify_klippy_disconnected'
}

/** What a refused call says, on the screen and in the error. */
export const ON_PRINTER = 'Do this on the printer itself'

export type Verdict = 'forward' | 'local' | 'refuse'

export function rpcVerdict (method: unknown): Verdict {
  if (typeof method !== 'string') return 'refuse'
  if (RPC_LOCAL.has(method)) return 'local'
  return RPC_FORWARD.has(method) ? 'forward' : 'refuse'
}

/** An Aux call's path without its query, if it is a plain path under /server/aux; else null. */
export function auxPath (path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  if (/[#\r\n]/.test(path)) return null
  const bare = path.split('?')[0]
  // No way out of /server/aux: no dot segments, encoded slashes or doubled slashes.
  if (/(^|\/)\.\.?(\/|$)|%2f|%5c|\\|\/\//i.test(bare)) return null
  return bare
}

export function auxVerdict (method: unknown, path: unknown): 'forward' | 'refuse' {
  const bare = auxPath(path)
  return method === 'GET' && bare !== null && AUX_GET.has(bare) ? 'forward' : 'refuse'
}

export const AUX_METHODS: readonly AuxMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

/** The most one jog may move, mm; the panel's own steps are 0.1 to 50. */
export const JOG_LIMIT_MM = 50

/**
 * A verb from the embed, checked field by field and rebuilt from known
 * values only (nothing of the request passes through as it came), or null.
 */
export function readVerb (raw: unknown): Verb | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  switch (r.verb) {
    case 'jog':
      if ((r.axis === 'X' || r.axis === 'Y' || r.axis === 'Z') && finite(r.by) && r.by !== 0 && Math.abs(r.by) <= JOG_LIMIT_MM) {
        return { verb: 'jog', axis: r.axis, by: Math.round(r.by * 1000) / 1000 }
      }
      return null
    case 'home':
      return r.axes === '' || r.axes === 'XY' || r.axes === 'Z' ? { verb: 'home', axes: r.axes } : null
    case 'heat':
      if ((r.heater === 'extruder' || r.heater === 'heater_bed') && finite(r.target) && r.target >= 0) {
        return { verb: 'heat', heater: r.heater, target: Math.round(r.target) }
      }
      return null
    case 'filament':
      return r.action === 'load' || r.action === 'unload' ? { verb: 'filament', action: r.action } : null
    default:
      return null
  }
}
