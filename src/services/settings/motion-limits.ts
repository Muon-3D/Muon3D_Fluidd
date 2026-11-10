/**
 * Settings › Moving and extruding: the limits and presets, read from the
 * printer's own config. The M1's caps are used only where its config says
 * nothing (`settings/motion.md`, open question 2).
 */

export type HeadSpeedPreset = 'gentle' | 'normal' | 'fast'

/** Gentle, Normal and Fast, as fractions of the printer's max_velocity. */
export const HEAD_SPEED_PRESETS: ReadonlyArray<{ value: HeadSpeedPreset, label: string, fraction: number }> = [
  { value: 'gentle', label: 'Gentle', fraction: 0.25 },
  { value: 'normal', label: 'Normal', fraction: 0.5 },
  { value: 'fast', label: 'Fast', fraction: 0.8 }
]

/** Used on a Muon printer only when its config has no max_extrude_only_*. */
export const MUON_EXTRUDE_CAPS = { length: 50, speed: 8 }
/** Used on any other printer (and with developer mode on) when its config says nothing: today's caps. */
export const OPEN_EXTRUDE_CAPS = { length: 200, speed: 50 }

const positive = (value: unknown): number | null => {
  const n = Number(value)
  return value !== null && value !== undefined && value !== '' && Number.isFinite(n) && n > 0 ? n : null
}

/** The head speed for a preset, in whole mm/s. */
export function headSpeedFor (preset: HeadSpeedPreset, maxVelocity: number): number {
  const p = HEAD_SPEED_PRESETS.find(p => p.value === preset) ?? HEAD_SPEED_PRESETS[1]
  return Math.max(1, Math.round(maxVelocity * p.fraction))
}

/** The preset a stored speed is, or null when it is none of them. */
export function presetOf (speed: number, maxVelocity: number): HeadSpeedPreset | null {
  return HEAD_SPEED_PRESETS.find(p => headSpeedFor(p.value, maxVelocity) === Math.round(speed))?.value ?? null
}

export interface MotionConfig {
  maxVelocity?: unknown
  maxZVelocity?: unknown
  maxExtrudeOnlyDistance?: unknown
  maxExtrudeOnlyVelocity?: unknown
}

export interface MotionLimits {
  /** The head's top speed, mm/s (printer.max_velocity), or null when unknown. */
  head: number | null
  /** The plate's top speed, mm/s (printer.max_z_velocity, else max_velocity). */
  plate: number | null
  /** Extrude length per press, mm. */
  extrudeLength: number
  /** Extrude speed, mm/s. */
  extrudeSpeed: number
}

/** What the fields are capped at: the config first, the caps above only when it says nothing. */
export function motionLimits (config: MotionConfig, capped: boolean): MotionLimits {
  const head = positive(config.maxVelocity)
  const caps = capped ? MUON_EXTRUDE_CAPS : OPEN_EXTRUDE_CAPS
  return {
    head,
    plate: positive(config.maxZVelocity) ?? head,
    extrudeLength: positive(config.maxExtrudeOnlyDistance) ?? caps.length,
    extrudeSpeed: positive(config.maxExtrudeOnlyVelocity) ?? caps.speed
  }
}

/** A list of step sizes as saved: numbers above zero, each once, smallest first. */
export function normaliseSteps (values: Array<number | string>): number[] {
  return [...new Set(values.map(Number).filter(n => Number.isFinite(n) && n > 0))].sort((a, b) => a - b)
}
