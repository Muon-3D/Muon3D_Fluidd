/**
 * Plan and emailed data export, from the console (APP-FEEDBACK-CLOUD 1b and 3):
 * `GET /v1/me/plan`, `POST /v1/me/exports` and `GET /v1/me/exports`. The field
 * handling mirrors the app's (muon3d-app PR 260, packages/cloud-client): times
 * arrive as seconds since 1970 or as ISO 8601 text, and the export list as an
 * array or as `{exports: []}`.
 */
import { dayText } from './model'

export interface ExportRequest {
  id: string;
  status: 'queued' | 'building' | 'ready' | 'failed' | 'expired';
  requested_at?: number | string | null;
  ready_at?: number | string | null;
  expires_at?: number | string | null;
  size_bytes?: number | null;
}

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

export interface PlanSummary {
  plan: { id?: string, name: string, renews_at?: string | number | null, will_renew?: boolean };
  credits?: {
    balance: number | null;
    unit?: string;
    weekly?: { used: number, limit: number, resets_at?: string | number | null };
    monthly?: { left: number, allowance: number };
  };
  /** Where the full credit history can be read. */
  ledger_url?: string | null;
  limits?: { jobs_at_once?: number };
  source?: 'model-service' | 'unavailable';
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
