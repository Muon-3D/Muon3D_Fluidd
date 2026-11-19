import type { Verb, AuxMethod } from './protocol'

/**
 * What the embedded printer screen (MuonUI's embed build, loaded from the
 * printer over the active route) may ask Control to send on its behalf
 * (control-mockups/v3/overview-3d/SCREEN-PLAN.md). Exact names only: anything
 * not listed is refused with ON_PRINTER and never reaches the printer.
 *
 * Every call goes out on Control's own connection, so it can never do more
 * than Control can, and the printer's own gate (muon-link GATE-7,
 * crates/muon-link-device/src/policy.rs) still judges each one. The lists
 * follow what that gate gives an Operator, which is also what an Open
 * printer's Bluetooth guest is (Jack, 17 Nov: an open printer is fully usable
 * from Control over any route): reads, printing (start, pause, resume,
 * cancel), the queue and the emergency stop; with the
 * structured verbs (jog, home, heat, fan, filament) for the panel's own
 * buttons. What stays on the printer is what the gate keeps to the Owner:
 * protection and access, linking an account, updates, power, Wi-Fi, and the
 * developer-mode warranty release.
 */

/** JSON-RPC methods forwarded as they are. */
export const RPC_FORWARD: ReadonlySet<string> = new Set([
  'printer.info',
  'printer.objects.list',
  'printer.objects.query',
  // Raw G-code is Operator in muon-link, so it goes, but only for the few
  // command words in GCODE_WORDS (an exact list, checked in M1Screen). Moves,
  // homing and heating are the jog, home and heat verbs. Restarts (RPC and
  // G-code alike) stay on the printer: they would end a print.
  'printer.gcode.script',
  'printer.gcode.help',
  'printer.query_endstops.status',
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
  'server.files.roots',
  'server.files.thumbnails',
  'server.history.list',
  'server.job_queue.status',
  'server.job_queue.post_job',
  'server.job_queue.start',
  'server.job_queue.pause',
  'server.job_queue.jump',
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

/** What a refused call says in the error the screen gets (the screen tags it "Confirm on the printer"). */
export const ON_PRINTER = 'Do this on the printer itself'

const PLAIN: ReadonlyArray<readonly [RegExp, string]> = [
  [/dev_?mode|developer|warranty/i, 'Developer mode'],
  [/protection|access|consent|passcode|pairing/i, 'Changing who can use the printer'],
  [/link|account|cloud/i, 'Linking an account'],
  [/update|install|upgrade|recover/i, 'Installing an update'],
  [/wifi|network|hotspot|\bap\b/i, 'Changing the Wi-Fi'],
  [/reboot|shutdown|power|services|sudo|restart/i, 'Restarting or powering off the printer'],
  [/gcode/i, 'Running G-code'],
  [/identity|rename/i, 'Renaming the printer']
]

/**
 * What a refused call was, in plain words, for the note on the screen:
 * `what` is the method, or "METHOD /path" for an Aux call. Never raw names.
 */
export function refusalNote (what: string): string {
  const hit = PLAIN.find(([re]) => re.test(what))
  const name = hit ? hit[1] : 'That'
  return `${name} is done on the printer itself. Control can't do it for you.`
}

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

/**
 * The only command words a raw G-code script from the screen may use: fans,
 * the speed and flow factors, lights and pins, and the screen's own saved
 * variables (muon_*). Everything else is refused, so there is no list of bad
 * words to get around. Moves, homing and heating are the jog, home and heat
 * verbs (the no-go planner and the heater limits); a user macro, a probe, a
 * calibration or a hand-written move never goes through here.
 */
export const GCODE_WORDS: ReadonlySet<string> = new Set([
  'M106', 'M107', 'M220', 'M221', 'SET_FAN_SPEED', 'SET_LED', 'SET_PIN', 'SAVE_VARIABLE'
])

const GCODE_REFUSED = "Control doesn't run that G-code from the screen. Use the screen's own buttons."

/** A line's command word: comment and line number and checksum off, upper case, "G 1" and "G01" as G1; '' for a blank line. */
export function gcodeWord (line: string): string {
  let cmd = line.split(';')[0].split('*')[0].trim().toUpperCase()
  cmd = cmd.replace(/^N\s*\d+\s*/, '')
  const coded = /^([A-Z])\s*0*(\d+)(?![A-Z0-9_])/.exec(cmd)
  if (coded) return coded[1] + coded[2]
  return /^[A-Z_][A-Z0-9_]*/.exec(cmd)?.[0] ?? (cmd ? cmd.split(/\s/)[0] : '')
}

/** Why a raw G-code script from the screen is not run, '' when it may: every line's command word must be in GCODE_WORDS. */
export function gcodeRefusal (script: unknown): string {
  if (typeof script !== 'string' || !script.trim() || script.length > 500) return 'That is not a G-code line Control can run.'
  const lines = script.split(/[\r\n]+/)
  if (lines.length > 8) return GCODE_REFUSED
  for (const line of lines) {
    const word = gcodeWord(line)
    if (!word) {
      if (line.split(';')[0].trim()) return GCODE_REFUSED
      continue
    }
    if (!GCODE_WORDS.has(word)) return GCODE_REFUSED
    // The screen's own saved variables only (the material colour and the like), never another.
    if (word === 'SAVE_VARIABLE' && !/^SAVE_VARIABLE\s+VARIABLE=MUON_[A-Z0-9_]+\s+VALUE=/.test(line.split(';')[0].trim().toUpperCase())) return GCODE_REFUSED
  }
  return ''
}

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
    case 'fan':
      if (typeof r.fan === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(r.fan) && finite(r.percent) && r.percent >= 0 && r.percent <= 100) {
        return { verb: 'fan', fan: r.fan, percent: Math.round(r.percent) }
      }
      return null
    case 'filament':
      return r.action === 'load' || r.action === 'unload' ? { verb: 'filament', action: r.action } : null
    default:
      return null
  }
}
