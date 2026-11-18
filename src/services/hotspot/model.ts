import Vue from 'vue'
import { isHotspotOrigin } from '@/aux_api/useHotspotCheck'

/**
 * Who is on the printer's own hotspot (KAN-4297). The printer's
 * `GET /server/aux/wifi/ap/stations` (muon.aux-api v2) answers `up`, `count`
 * and `auto_off_at`. A later printer build adds, as optional fields,
 * `requester_on_ap` and `clients`; both are read only when they are there.
 */
export interface HotspotClient {
  name: string | null
  ip: string | null
  /** Already masked by the printer (aa:bb:cc:••:••:ef). */
  mac: string
  connectedSeconds: number | null
  signalDbm: number | null
  /** This browser. */
  you: boolean
}

export interface HotspotStations {
  up: boolean
  count: number
  autoOffAt: number | null
  /** Absent on a printer that predates the field. */
  requesterOnAp: boolean | null
  /** Absent on a printer that predates the field: show the count only. */
  clients: HotspotClient[] | null
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
const str = (v: unknown): string | null => typeof v === 'string' && v.trim() ? v : null

/** The printer's answer, or null when it is not one (so nothing is shown). */
export function normalizeStations (data: unknown): HotspotStations | null {
  if (!isRecord(data) || typeof data.up !== 'boolean') return null
  const clients = Array.isArray(data.clients)
    ? data.clients.filter(isRecord).map(c => ({
      name: str(c.name),
      ip: str(c.ip),
      mac: typeof c.mac === 'string' ? c.mac : '',
      connectedSeconds: num(c.connected_s),
      signalDbm: num(c.signal_dbm),
      you: c.you === true
    }))
    : null
  const count = num(data.count)
  return {
    up: data.up,
    count: count !== null ? Math.max(0, Math.round(count)) : clients?.length ?? 0,
    autoOffAt: num(data.auto_off_at),
    requesterOnAp: typeof data.requester_on_ap === 'boolean' ? data.requester_on_ap : null,
    clients
  }
}

/** The latest answer for the printer Control is on; null when there is none or the printer has no such route. */
export const hotspotState = Vue.observable({ stations: null as HotspotStations | null })

/** The number the bottom-left item shows, or null to hide it (down, unknown, or the printer has no route). */
export function hotspotDeviceCount (stations: HotspotStations | null = hotspotState.stations): number | null {
  return stations?.up ? stations.count : null
}

export function hotspotCountTitle (count: number): string {
  return `${count} ${count === 1 ? 'device' : 'devices'} on the printer's hotspot`
}

/**
 * How a browser that reaches the printer directly (not through Muon3D) says
 * so: "Through hotspot" when the printer says this request came from its
 * hotspot, or, from a printer that doesn't say, when the page is served from
 * the hotspot's own address. Everything that wrote "On this network" asks this.
 */
export function networkRouteLabel (
  requesterOnAp: boolean | null | undefined = hotspotState.stations?.requesterOnAp,
  hostname?: string
): 'Through hotspot' | 'On this network' {
  const onAp = typeof requesterOnAp === 'boolean' ? requesterOnAp : isHotspotOrigin(hostname)
  return onAp ? 'Through hotspot' : 'On this network'
}

/** "12 min", "45 s", "2 h 5 min": how long a device has been on the hotspot. */
export function connectedFor (seconds: number | null): string {
  if (seconds === null || seconds < 0) return ''
  if (seconds < 60) return `${Math.floor(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

/** Signal bars (1 to 4) for a client's strength in dBm. */
export function dbmLevel (dbm: number | null): 1 | 2 | 3 | 4 {
  if (dbm === null) return 1
  if (dbm >= -55) return 4
  if (dbm >= -65) return 3
  if (dbm >= -75) return 2
  return 1
}

/**
 * "Turns off in 25 min" from the printer's `auto_off_at` (epoch seconds), or
 * null when there is none, or it is already past.
 */
export function autoOffIn (autoOffAt: number | null, nowMs: number = Date.now()): string | null {
  if (autoOffAt === null) return null
  const at = autoOffAt > 1e12 ? autoOffAt : autoOffAt * 1000
  const seconds = Math.round((at - nowMs) / 1000)
  if (seconds <= 0) return null
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `Turns off in ${connectedFor(minutes * 60)}`
}
