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
  column_unknown: 'Push the spine lever fully down first',
  column_reading: 'Checking the spine…',
  column_unlocked: 'Lock the spine first',
  plate_absent: 'Fit the plate first'
}

const FALLBACK = "The printer isn't ready to home X and Y"

/** z_power.xy_allowed is false when the Z column is absent or part-way: the folded spine blocks the gantry. */
export function columnReason (zPower: Json | undefined): string {
  return zPower?.z === 'absent' ? 'Fit the spine first' : 'Push the spine lever fully down first'
}

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
  if (zPower?.xy_home_allowed === false) return columnReason(zPower)
  return ''
}

/** '' when jogging X/Y is allowed (or unknown); otherwise the spine text from z_power.z. */
export function xyMoveDisabledReason (status: unknown): string {
  const zPower = obj(obj(status)?.z_power)
  return zPower?.xy_allowed === false ? columnReason(zPower) : ''
}
