/**
 * Confirming the plate is clear from Control (CT-14, KAN-2187).
 *
 * After a print the printer refuses the next one until someone confirms the
 * plate is clear. The printer says so in its `m1_machine` object
 * (`conditions.plate_cleared === false`); Control shows a notice and sends the
 * same confirm the printer's screen has. Whether this session may is the
 * `plate_clear` permission, which the printer enforces: a refusal is shown in
 * the printer's own words. Never G-code: there is no knob-press path.
 *
 * Contract (CONTRACT-aux-api-v2):
 *   POST /server/aux/plate/clear      (LAN)  /  POST /muon-link/plate/clear (managed)
 *   no request body
 *   200 { cleared: true }
 *   403 { detail: { code: 'permission_restricted', knob: 'plate_clear', required, allowed, message } }
 *   503 { detail: { code: 'plate_clear_unavailable', message } }
 */
export const PLATE_CLEAR_PATH = '/server/aux/plate/clear'
export const MANAGED_PLATE_CLEAR_PATH = '/muon-link/plate/clear'

/** The route: managed (cloud) sessions go over muon-link, the same choice as permissionsPath. */
export const plateClearPath = (managed: boolean): string => (managed ? MANAGED_PLATE_CLEAR_PATH : PLATE_CLEAR_PATH)

export type PlateClearResult =
  | { kind: 'cleared' }
  | { kind: 'refused', code: string, message: string }
  | { kind: 'unavailable', message: string }
  | { kind: 'failed', message: string }

export const FAILED_MESSAGE = "Couldn't confirm the plate is clear. Try again, or confirm it at the printer."

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Whether the printer says the plate needs confirming: `m1_machine`
 * `conditions.plate_cleared === false` (or a top-level `plate_cleared`).
 * A missing field means the printer can't say, so nothing is shown.
 */
export function plateNeedsClearing (status: unknown): boolean {
  const machine = isObject(status) ? status.m1_machine : undefined
  if (!isObject(machine)) return false
  const conditions = machine.conditions
  if (isObject(conditions) && conditions.plate_cleared !== undefined) return conditions.plate_cleared === false
  return machine.plate_cleared === false
}

/** The notice shows only while the printer is idle: not printing, paused or busy. */
export function plateNoticeShows (status: unknown, printerState: string): boolean {
  const s = printerState.toLowerCase()
  if (s === 'printing' || s === 'paused' || s === 'busy') return false
  return plateNeedsClearing(status)
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** What the printer's answer means. */
export function plateClearOutcome (status: number, data: unknown): PlateClearResult {
  const body = isObject(data) ? data : {}
  const inner = isObject(body.result) ? body.result : body
  if (status >= 200 && status < 300) {
    return inner.cleared === true ? { kind: 'cleared' } : { kind: 'failed', message: FAILED_MESSAGE }
  }
  const detail = isObject(body.detail) ? body.detail : isObject(body.error) ? body.error : {}
  const message = text(detail.message)
  if (status === 403 && detail.code === 'permission_restricted') {
    return { kind: 'refused', code: 'permission_restricted', message: message || "This printer doesn't let you confirm that the plate is clear." }
  }
  if (status === 503 && detail.code === 'plate_clear_unavailable') {
    return { kind: 'unavailable', message: message || "This printer can't take that confirmation yet. Confirm it at the printer." }
  }
  return { kind: 'failed', message: FAILED_MESSAGE }
}

interface Http {
  post: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<{ status: number, data: unknown }>
}

/** Sends the confirm: one POST, no body. A network failure is `failed`. */
export async function confirmPlateClear (managed: boolean, http: Http): Promise<PlateClearResult> {
  try {
    const r = await http.post(plateClearPath(managed), undefined, { validateStatus: () => true })
    return plateClearOutcome(r.status, r.data)
  } catch {
    return { kind: 'failed', message: FAILED_MESSAGE }
  }
}
