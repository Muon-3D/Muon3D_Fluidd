/**
 * The admin portal's data client (KAN-6100, spec section 5.1). The browser asks
 * for panels by id; it never sends PromQL or LogQL. The endpoints belong to a
 * console PR (KAN-6115) and may not exist yet: callers treat a missing endpoint
 * as "not available", never as a crash.
 */
import { AdminError, consoleRequest } from './client'

export type PanelStatus = 'real' | 'placeholder'
export type ChartKind = 'tile' | 'line' | 'stacked_bar' | 'bar' | 'heatmap' | 'state_timeline' | 'table' | 'log_list'
export const RANGES = ['15m', '1h', '6h', '24h', '7d', '30d'] as const
export type Range = typeof RANGES[number]
export const REFRESHES = ['off', '30s', '1m', '5m'] as const
export type Refresh = typeof REFRESHES[number]

export interface Threshold { value: number; level: 'warning' | 'critical'; label?: string }
export interface PanelNeeds { metric: string; type?: string; labels?: string[]; emitter?: string }
export interface CatalogPanel {
  id: string; title: string; chart: ChartKind | string; unit?: string
  thresholds?: Threshold[]; status: PanelStatus; query?: string; needs?: PanelNeeds
  /** Spans both columns. */
  wide?: boolean
}
export interface CatalogSection { id: string; title: string; grafana_uid?: string; panels: CatalogPanel[] }
export interface Catalog { grafana_url?: string; sections: CatalogSection[] }

export interface Series { labels: Record<string, string>; points: Array<[number, number | null]> }
export interface PanelResult {
  status: 'ok' | 'unavailable' | 'placeholder'
  reason?: string
  series?: Series[]
  rows?: Array<Record<string, unknown>>
  /** Tiles: the headline figure and its note. */
  value?: number | null
  /** A tile that reads "n of m". */
  of?: number
  /** The scrape job or source that had no data (panel body: "No data from <job>"). */
  job?: string
  note?: string
  /** Server's verdict on the tile's thresholds. */
  level?: 'good' | 'warning' | 'critical'
}
export interface QueryResponse { step_s: number; results: Record<string, PanelResult> }
export interface QueryRequest { panels: string[]; range: Range; end?: number; vars?: { job?: string; vhost?: string; instance?: string } }

export interface LogLine { ts_ns: string; service: string; level: string; source: string; vhost?: string; message: string; fields: Record<string, unknown> }
export interface LogsRequest { service?: string[]; level?: string[]; source?: string; vhost?: string; q?: string; rid?: string; range: Range; end?: number; after_ns?: string; limit: number }
export interface LogsResponse { lines: LogLine[]; histogram: Array<{ t: number; level: string; n: number }>; next_before_ns?: string; dropped?: number }

export interface AlertItem { name: string; severity: 'critical' | 'warning' | 'info'; state: 'firing' | 'pending' | 'silenced' | 'inhibited'; labels: Record<string, string>; summary: string; since: number }
export interface AlertRule { name: string; severity: string; expr: string; for_s: number; state: 'ok' | 'pending' | 'firing' }
export interface AlertsResponse { alerts: AlertItem[]; rules: AlertRule[]; watchdog_ok: boolean; delivery: { email: 'pending' | 'ok' } }

export interface StatusFile { schema: string; age_s: number; [key: string]: unknown }

export const LOG_SERVICES = ['muon-console', 'iroh-relay', 'muon-models', 'machine-queue', 'tracker', 'backup', 'nginx', 'postgresql', 'ssh', 'prometheus', 'alertmanager', 'node', 'blackbox', 'grafana', 'loki', 'vector', 'backup-age', 'muon-top', 'other']
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace']
export const LOG_SOURCES = ['journal', 'nginx-access', 'nginx-error']

/** The console has no such endpoint yet (KAN-6115): not a failure of the person's session. */
export function endpointMissing (error: unknown): boolean {
  return error instanceof AdminError && [404, 405, 501].includes(error.status)
}

const call = <T>(path: string, body: unknown, background: boolean): Promise<T> => consoleRequest<T>(`/v1/admin/obs/${path}`, body, true, background)

export const obs = {
  catalog: (): Promise<Catalog> => call('catalog', {}, false),
  status: (background = false): Promise<StatusFile> => call('status', {}, background),
  query: (request: QueryRequest, background = false): Promise<QueryResponse> => call('query', request, background),
  logs: (request: LogsRequest, background = false): Promise<LogsResponse> => call('logs', request, background),
  alerts: (background = false): Promise<AlertsResponse> => call('alerts', {}, background)
}

/** A sentence for a page-level failure of the data service. */
export function obsFailure (error: unknown): { missing: boolean; text: string } {
  if (endpointMissing(error)) return { missing: true, text: 'The admin data endpoints are not available on this console yet.' }
  if (error instanceof AdminError && error.status === 429) return { missing: false, text: 'Too many requests. Try again in a minute.' }
  return { missing: false, text: 'The admin data service did not answer.' }
}
