/**
 * Plan and emailed data export, from the console (APP-FEEDBACK-CLOUD 1b and 3):
 * `GET /v1/me/plan`, `POST /v1/me/exports` and `GET /v1/me/exports`. The field
 * handling mirrors the app's (muon3d-app PR 260, packages/cloud-client): times
 * arrive as seconds since 1970 or as ISO 8601 text, and the export list as an
 * array or as `{exports: []}`.
 */
import type { ExportRequest, PlanSummary } from './api'
import { dayText } from './model'

export type { ExportRequest, PlanSummary }

/** An export that has been asked for and not yet delivered. */
export function exportIsOpen (e: Pick<ExportRequest, 'status'>): boolean {
  return e.status === 'queued' || e.status === 'building'
}

/** A console time (seconds since 1970, or an ISO 8601 string) as seconds, or null. */
export function exportTime (t: number | string | null | undefined): number | null {
  if (typeof t === 'number') return Number.isFinite(t) ? t : null
  if (typeof t === 'string') {
    const ms = Date.parse(t)
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000)
  }
  return null
}

/** `GET /v1/me/exports` answers a list or `{exports: [...]}`. */
export function exportsFrom (answer: ExportRequest[] | { exports?: ExportRequest[] } | null | undefined): ExportRequest[] {
  if (Array.isArray(answer)) return answer
  return Array.isArray(answer?.exports) ? answer!.exports! : []
}

export interface PlanView {
  name: string;
  /** Credits left, or null when the model service is off or sent none. */
  credits: number | null;
  /** Seconds, or null. */
  renews: number | null;
  willRenew: boolean | undefined;
  /** Only an https link. */
  link: string | null;
}

/** The plan as the card shows it. */
export function planView (p: PlanSummary): PlanView {
  return {
    name: p.plan?.name ?? '',
    credits: p.source === 'unavailable' ? null : (p.credits?.balance ?? null),
    renews: exportTime(p.plan?.renews_at),
    willRenew: p.plan?.will_renew,
    link: typeof p.ledger_url === 'string' && /^https:\/\//.test(p.ledger_url) ? p.ledger_url : null
  }
}

/** "Plus · renews 24 Oct", "Plus · ends 24 Oct" when it will not renew, or "Plus" with no date. */
export function planLine (v: Pick<PlanView, 'name' | 'renews' | 'willRenew'>): string {
  if (!v.renews) return v.name
  return `${v.name} · ${v.willRenew === false ? 'ends' : 'renews'} ${dayText(v.renews)}`
}

/** What a copy holds: the storyboard's "Ask for a copy" choices. */
export type ExportPart = 'account' | 'library' | 'history'
export type ExportFormat = 'zip' | 'json'
export const EXPORT_PARTS: Array<{ id: ExportPart, label: string, text?: string }> = [
  { id: 'account', label: 'Account and access' },
  { id: 'library', label: 'Library', text: 'Includes your uploaded models' },
  { id: 'history', label: 'Print history' }
]

/** Requested → Confirmed → Gathering → Ready (settings/account-data, frame 4). */
export const EXPORT_STAGES = ['Requested', 'Confirmed', 'Gathering', 'Ready'] as const

/**
 * The stage a request has reached, as an index into EXPORT_STAGES, or null
 * when it has left them (failed or expired). A request only exists once it
 * passed "Check it's you", so a queued one is already confirmed.
 */
export function exportStage (e: Pick<ExportRequest, 'status'>): number | null {
  switch (e.status) {
    case 'queued': return 1
    case 'building': return 2
    case 'ready': return 3
    default: return null
  }
}

/** The pill on a request's row. */
export function exportStatusText (e: Pick<ExportRequest, 'status'>): string {
  switch (e.status) {
    case 'queued': return 'Confirmed'
    case 'building': return 'Preparing'
    case 'ready': return 'Ready'
    case 'failed': return "Couldn't finish"
    default: return 'Expired'
  }
}

/** The requests list, newest first. */
export function exportsNewestFirst (list: ExportRequest[]): ExportRequest[] {
  return [...list].sort((a, b) => (exportTime(b.requested_at) ?? 0) - (exportTime(a.requested_at) ?? 0))
}
