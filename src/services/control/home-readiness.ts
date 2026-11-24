/**
 * KAN-6008 (Jack, 24 Nov): safety lives in Klipper's macros; Control only
 * mirrors them. Klipper's `m1_machine` publishes `ready.home_xy` and the list
 * `missing.home_xy`; `z_power` publishes `xy_home_allowed` (homing X/Y) and
 * `xy_allowed` (jogging X/Y: false while the plate is down and touching).
 * When these objects are absent (not an M1) nothing is disabled, and Klipper
 * is the only gate. Never refuses on its own; it only explains a disable.
 */

type Json = Record<string, unknown>
const obj = (v: unknown): Json | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? v as Json : undefined)

const REASONS: Record<string, string> = {
  toolhead_disconnected: 'Connect the toolhead first',
  column_absent: 'Fit the spine first',
  column_unlocked: 'Lock the spine first',
  plate_absent: 'Fit the plate first',
  plate_down: 'Raise the bed first'
}

export const RAISE_BED = 'Raise the bed first'
const FALLBACK = "The printer isn't ready to home X and Y"

export function homeXYReason (missing: readonly string[]): string {
  const first = missing.find(m => typeof m === 'string' && m in REASONS)
  if (first) return REASONS[first]
  return FALLBACK
}

/** '' when Home XY is allowed (or unknown); otherwise a short plain reason. */
export function homeXYDisabledReason (status: unknown): string {
  const s = obj(status)
  const machine = obj(s?.m1_machine)
  const ready = obj(machine?.ready)
  const zPower = obj(s?.z_power)
  if (ready?.home_xy === false) {
    const missing = obj(machine?.missing)?.home_xy
    return homeXYReason(Array.isArray(missing) ? missing as string[] : [])
  }
  if (zPower?.xy_home_allowed === false) return FALLBACK
  return ''
}

/** '' when jogging X/Y is allowed (or unknown); the plate is down and touching when z_power says not. */
export function xyMoveDisabledReason (status: unknown): string {
  return obj(obj(status)?.z_power)?.xy_allowed === false ? RAISE_BED : ''
}
