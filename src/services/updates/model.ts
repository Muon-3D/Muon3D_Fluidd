/**
 * The printer's own software update (MuonOS's over-the-air update), as
 * Fluidd shows it: in Settings › Updates, on the Updating page, and while
 * the printer restarts into it and can't answer.
 *
 * The Aux API's /update/status says where an install stands. Its `session`
 * (MuonOS feat/updating-signal, KAN-512) follows one install from the press
 * to its outcome, across the reboot: preparing, installing, rebooting,
 * verifying, then updated, rolled_back or failed. Fluidd keeps the last
 * active session it saw (remember), so when the printer goes quiet in
 * `installing` or `rebooting` it says "updating", not "can't reach", for as
 * long as the printer said a restart may take (offline_budget_seconds).
 *
 * A printer whose image predates `session` reports none; then the versions
 * tell: running the version it was going to means updated, still the old
 * one means it didn't take.
 */

export type SessionPhase = 'idle' | 'preparing' | 'installing' | 'rebooting' | 'verifying' | 'updated' | 'rolled_back' | 'failed'

export const ACTIVE_PHASES: SessionPhase[] = ['preparing', 'installing', 'rebooting', 'verifying']

export interface UpdateSession {
  job_id?: string | null;
  phase?: SessionPhase;
  from_version?: string | null;
  to_version?: string | null;
  started_at?: string | null;
  reboot_at?: string | null;
  offline_budget_seconds?: number | null;
  finished_at?: string | null;
  error?: { kind?: string, message?: string } | null;
}

/** The parts of /server/aux/update/status Fluidd reads. */
export interface AuxUpdateStatus {
  state?: string;
  current_version?: string | null;
  target_version?: string | null;
  update_available?: boolean;
  requires_commit?: boolean;
  progress?: number | null;
  last_checked?: string | null;
  error?: string | null;
  release_notes?: string | null;
  install?: { phase?: string, job_id?: string | null, started_at?: string | null, finished_at?: string | null, progress?: number | null } | null;
  /** The image written to the spare slot ahead of an install; "staged" waits for a person. */
  stage?: { state?: string, version?: string | null, progress?: number | null, finished_at?: string | null, slot_fingerprint?: Record<string, unknown> | null } | null;
  /** The commit after a restart into the new slot. An error here with state "committed" is an old one (see commitPending). */
  commit?: { state?: string, required?: boolean, error?: { kind?: string, message?: string } | null } | null;
  session?: UpdateSession | null;
}

/** What Fluidd remembers of an install, per printer, so it can say "updating" while the printer can't answer. */
export interface Remembered {
  jobId: string | null;
  phase: SessionPhase;
  from: string | null;
  to: string | null;
  progress: number | null;
  /** When Fluidd last heard this, ms. */
  seenAt: number;
  /** When the printer went quiet during it, ms. */
  lostAt: number | null;
  budgetMs: number;
  /** When the person pressed Install, ms: a terminal session that began before this is an earlier job's, not this one's. */
  startedAt?: number | null;
  /** When Fluidd last (re)connected to the printer, ms: the printer's first answers after an outage are not yet to be believed. */
  reconnectedAt?: number | null;
}

/** When the printer doesn't say how long a restart may take: 20 minutes (one slow boot took 15). */
export const DEFAULT_BUDGET_MS = 20 * 60 * 1000

/** "20261006141553-d0044d8" → the build's date and its commit; anything else as it is. */
export function versionLabel (version: string | null | undefined): { text: string, date: Date | null, commit: string } {
  const v = (version ?? '').trim()
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})-([0-9a-f]{6,40})$/i.exec(v)
  if (!m) return { text: v || 'unknown', date: null, commit: '' }
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]))
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return { text: `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${m[7].slice(0, 7)}`, date, commit: m[7].slice(0, 7) }
}

/** The session, or one made from the older fields when the printer predates it. */
export function sessionOf (status: AuxUpdateStatus | null): UpdateSession | null {
  if (!status) return null
  if (status.session && status.session.phase) return status.session
  const state = status.state ?? ''
  if (state === 'installing') return { phase: 'installing', from_version: status.current_version, to_version: status.target_version, job_id: status.install?.job_id }
  if (state === 'rebooting') return { phase: 'rebooting', from_version: status.current_version, to_version: status.target_version, job_id: status.install?.job_id }
  if (commitPending(status) || state === 'commit_pending' || state === 'committing') return { phase: 'verifying', to_version: status.current_version }
  return null
}

/**
 * The printer is checking a new version it restarted into: it asks for a commit
 * (requires_commit) or the commit is not "committed". An error left in commit
 * while its state is "committed" is an old failure and says nothing about now.
 */
export function commitPending (status: AuxUpdateStatus | null): boolean {
  if (!status) return false
  if (status.requires_commit) return true
  return !!status.commit?.state && status.commit.state !== 'committed'
}

/**
 * An update written to the spare slot and waiting for a person, not under way:
 * one is available, its stage is "staged", nothing is installing (install.phase
 * is "idle", whatever job id and times an old install left there) and no commit
 * is pending. Settings shows it as "Update ready to install"; nothing remembers
 * it as an install, so it shows no bar and no restart screen.
 */
export function isStaged (status: AuxUpdateStatus | null): boolean {
  if (!status || !status.update_available) return false
  if (status.stage?.state !== 'staged') return false
  if (status.install?.phase !== 'idle') return false
  return !commitPending(status)
}

/**
 * A staged record that cannot prove the spare slot still holds that version:
 * its slot fingerprint is empty (KAN-1364). Control does not offer a one-tap
 * install from it.
 */
export function stagedUnverified (status: AuxUpdateStatus | null): boolean {
  if (status?.stage?.state !== 'staged') return false
  return !status.stage.slot_fingerprint || Object.keys(status.stage.slot_fingerprint).length === 0
}

/**
 * How long an install the printer does not mention is kept before it is
 * dropped: the first answers after Install, or after an outage, may still be
 * "idle" for a moment, so it is not cleared the instant it is missing.
 */
export const UNSEEN_GRACE_MS = 30 * 1000

/** A slow "preparing" (download and check) can take minutes before the printer says "installing". */
export const PREPARING_GRACE_MS = 5 * 60 * 1000

/** The time since this install was last heard of, or Fluidd reconnected, or the person pressed Install. */
function heardAt (r: Remembered): number {
  return Math.max(r.seenAt, r.reconnectedAt ?? 0, r.startedAt ?? 0)
}

function graceOf (r: Remembered): number {
  return r.phase === 'preparing' ? PREPARING_GRACE_MS : UNSEEN_GRACE_MS
}

/** Active, and past the time it was allowed (counted from when the printer went quiet, else last heard). */
export function expired (r: Remembered | null, now: number): boolean {
  if (!r || !ACTIVE_PHASES.includes(r.phase)) return false
  return now - (r.lostAt ?? r.seenAt) > r.budgetMs
}

/**
 * Whether the bar over every page shows: an install under way and within its
 * time, once the printer has answered in this page load (what was kept in
 * the browser is not believed until then).
 */
export function bannerVisible (r: Remembered | null, now: number, answered: boolean): boolean {
  return !!r && answered && ACTIVE_PHASES.includes(r.phase) && !expired(r, now)
}

/** A terminal session that began before the person pressed Install belongs to an earlier job. */
function beforePress (prev: Remembered, s: UpdateSession): boolean {
  if (!prev.startedAt || !s.started_at) return false
  const at = Date.parse(s.started_at)
  return Number.isFinite(at) && at < prev.startedAt
}

/**
 * What to keep after hearing the printer: the active session (with progress);
 * how it ended, until it has been shown (see outcome()); and nothing once the
 * printer says there is no install under way. An install the printer no longer
 * reports (no session, an idle one, a stale or another job's) never stays
 * "under way" for good, but is not dropped on the first quiet answer either:
 * the versions are asked first (updated, rolled back), and what they do not
 * decide is kept for a grace counted from the last time it was heard of, the
 * last reconnect or the press of Install (longer while preparing).
 */
export function remember (prev: Remembered | null, status: AuxUpdateStatus | null, now: number): Remembered | null {
  const s = sessionOf(status)
  const prevActive = !!prev && ACTIVE_PHASES.includes(prev.phase)
  if (s && s.phase && ACTIVE_PHASES.includes(s.phase)) {
    return {
      jobId: s.job_id ?? prev?.jobId ?? null,
      phase: s.phase,
      from: s.from_version ?? prev?.from ?? null,
      to: s.to_version ?? prev?.to ?? null,
      progress: typeof status?.progress === 'number' ? status.progress : (s.phase === prev?.phase ? prev?.progress ?? null : null),
      seenAt: now,
      lostAt: null,
      budgetMs: s.offline_budget_seconds ? s.offline_budget_seconds * 1000 : prev?.budgetMs ?? DEFAULT_BUDGET_MS,
      startedAt: prev?.startedAt ?? null,
      reconnectedAt: prev?.reconnectedAt ?? null
    }
  }
  const terminal = s && s.phase && s.phase !== 'idle' ? s : null
  if (!prev) return null
  if (!prevActive) {
    // The outcome of what we remembered: keep it until it has been shown (see outcome()).
    if (terminal && !(prev.jobId && terminal.job_id && prev.jobId !== terminal.job_id)) return { ...prev, phase: terminal.phase as SessionPhase, seenAt: now, lostAt: null }
    return s && s.phase === 'idle' ? null : prev
  }
  if (!status) return prev
  const sameJob = !prev.jobId || !terminal?.job_id || prev.jobId === terminal.job_id
  if (terminal && sameJob && !beforePress(prev, terminal)) {
    return { ...prev, jobId: prev.jobId ?? terminal.job_id ?? null, phase: terminal.phase as SessionPhase, seenAt: now, lostAt: null }
  }
  // Nothing (usable) said about this install: its versions first, then the grace, then drop.
  // A bare commit-pending (no version it came from) was never an install anyone started.
  const ended = prev.from ? outcome(prev, status) : null
  if (ended) return { ...prev, phase: ended, seenAt: now, lostAt: null }
  return now - heardAt(prev) <= graceOf(prev) ? prev : null
}

/** The printer went quiet: when, if an install was under way. */
export function lost (prev: Remembered | null, now: number): Remembered | null {
  if (!prev || !ACTIVE_PHASES.includes(prev.phase) || prev.lostAt) return prev
  return { ...prev, lostAt: now }
}

/** While the printer can't be reached: the Updating screen, its late version, or nothing (the usual "can't reach"). */
export function offlineScreen (r: Remembered | null, now: number, answered = true): 'updating' | 'updating-late' | null {
  if (!r || !['preparing', 'installing', 'rebooting', 'verifying'].includes(r.phase)) return null
  // Not lost in this page (the printer was never seen up and then down): what the browser kept is
  // believed only once the printer has answered, and only while it is within its time.
  if (!r.lostAt && (!answered || expired(r, now))) return null
  const since = r.lostAt ?? r.seenAt
  return now - since <= r.budgetMs ? 'updating' : 'updating-late'
}

/** How an install that Fluidd followed ended, once the printer is back; null while it is still going. */
export function outcome (r: Remembered | null, status: AuxUpdateStatus | null): 'updated' | 'rolled_back' | 'failed' | null {
  if (!r || !status) return null
  const s = status.session
  if (s && s.job_id && r.jobId && s.job_id === r.jobId && s.phase && ['updated', 'rolled_back', 'failed'].includes(s.phase)) {
    return s.phase as 'updated' | 'rolled_back' | 'failed'
  }
  if (s && s.phase && ACTIVE_PHASES.includes(s.phase)) return null
  // The printer says it is installing, restarting or committing now (the real status has no session, only state): not over.
  const live = sessionOf(status)
  if (live?.phase && ACTIVE_PHASES.includes(live.phase)) return null
  // No session for this job (an image that predates it): the versions tell.
  if (commitPending(status)) return null
  if (r.to && status.current_version === r.to) return 'updated'
  if (r.phase === 'rebooting' || r.phase === 'verifying') return r.from && status.current_version === r.from ? 'rolled_back' : null
  return null
}

export interface UpdateStep {
  id: 'install' | 'restart' | 'check' | 'done';
  label: string;
  state: 'done' | 'now' | 'next';
}

/** The four steps the Updating page shows, and which it is on. */
export function updateSteps (phase: SessionPhase | 'offline' | 'late'): UpdateStep[] {
  const order: UpdateStep['id'][] = ['install', 'restart', 'check', 'done']
  const at: Record<string, number> = {
    preparing: 0, installing: 0, rebooting: 1, offline: 1, late: 1, verifying: 2, updated: 4, rolled_back: 4, failed: 4, idle: 0
  }
  const now = at[phase] ?? 0
  const labels: Record<UpdateStep['id'], string> = {
    install: 'Installing',
    restart: 'Restarting',
    check: 'Verifying',
    done: 'Complete'
  }
  return order.map((id, i) => ({ id, label: labels[id], state: i < now ? 'done' : i === now ? 'now' : 'next' }))
}

/** What the page says for where the update stands. */
export function updateHeadline (phase: SessionPhase | 'offline' | 'late', progress: number | null, to: string | null): { title: string, text: string } {
  const version = to ? versionLabel(to).text : 'the new version'
  switch (phase) {
    case 'preparing':
      return { title: 'Preparing update', text: `Verifying ${version} before installation.` }
    case 'installing':
      return progress !== null && progress >= 100
        ? { title: 'Finishing installation', text: 'Installation is complete. The printer verifies the update, then restarts.' }
        : { title: 'Installing update', text: `Installing ${version}${progress !== null ? `: ${Math.round(progress)}%` : ''}. The printer remains available during installation and restarts when it finishes.` }
    case 'rebooting':
    case 'offline':
      return { title: 'Restarting', text: 'The printer is restarting. This page will reconnect automatically. Keep the printer on.' }
    case 'late':
      return {
        title: 'Restart delayed',
        text: 'If the printer\'s screen is dark or has not changed for a while, turn it off and on again. The previous version will start. You can then retry the update.'
      }
    case 'verifying':
      return { title: 'Verifying update', text: `${version} is running. The printer is verifying the update. Do not restart until verification finishes.` }
    case 'updated':
      return { title: 'Updated', text: `The printer is on ${version}.` }
    case 'rolled_back':
      return { title: 'Previous version restored', text: 'The previous version has been restored. You can retry the update.' }
    case 'failed':
      return { title: 'Update failed', text: 'The update was not installed. You can retry.' }
    default:
      return { title: 'Up to date', text: '' }
  }
}
