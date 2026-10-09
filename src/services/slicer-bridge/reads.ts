/**
 * The Moonraker route of each read printer-bridge/1 allows (moonraker.read's
 * allowlist), with every parameter the host puts in the URL encoded, so a
 * name such as "a.gcode&print=true" stays one name. The bridge's helper has
 * already checked the parameters; this only places them.
 */
import type { BridgeObjects, ReadMethod } from './vendor/printer-client/bridge/protocol'

const enc = encodeURIComponent

/** Klipper's objects as a query string: `print_stats=state,filename&webhooks`. */
export const objectsQuery = (objects: BridgeObjects): string =>
  Object.entries(objects)
    .map(([object, fields]) => fields ? `${enc(object)}=${fields.map(enc).join(',')}` : enc(object))
    .join('&')

const ROUTES: Record<ReadMethod, (p: Record<string, unknown>) => string> = {
  'printer.objects.query': (p) => `/printer/objects/query?${objectsQuery(p.objects as BridgeObjects)}`,
  'printer.info': () => '/printer/info',
  'server.info': () => '/server/info',
  'server.files.metadata': (p) => `/server/files/metadata?filename=${enc(String(p.filename))}`,
  'server.gcode_store': (p) => `/server/gcode_store?count=${enc(String(p.count))}`,
  'server.job_queue.status': () => '/server/job_queue/status',
  'server.history.list': (p) => `/server/history/list?limit=${enc(String(p.limit))}&order=${enc(String(p.order ?? 'desc'))}`
}

/** The route of an allowed read; throws for a method outside the allowlist (the helper never asks one). */
export function readRoute (method: ReadMethod, params: Record<string, unknown>): string {
  const route = Object.prototype.hasOwnProperty.call(ROUTES, method) ? ROUTES[method] : null
  if (!route) throw new Error(`not a read the bridge allows: ${String(method)}`)
  return route(params)
}
