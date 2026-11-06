import type { AuxMethod } from './protocol'

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
  'printer.gcode.script',
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
  '/wifi/show',
  '/wifi/device/status',
  '/wifi/ap/device/status'
])

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
