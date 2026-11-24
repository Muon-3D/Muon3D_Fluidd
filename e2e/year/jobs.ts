/**
 * A mocked history for the year grid: fixed moments, so the days and totals
 * are the same on every run. "Now" is Thu 12 Nov 2026 12:00 UTC, in London.
 *
 * Finished prints: 5 (j1, j2, j3, j4, j6); the stopped one (j5) counts for nothing. Hours
 * (print_duration, not the longer total_duration): 2 + 1 + 3 + 0.5 + 10 = 16.5.
 * Filament: 30 + 60 + 15 + 3 + 300 = 408 g over 136 m.
 * Streaks: 10, 11 and 12 Nov, so longest 3 and current 3.
 */
export const NOW = '2026-11-12T12:00:00Z'
export const ZONE = 'Europe/London'

const META = { size: 2_000_000, filament_type: 'PLA', filament_colors: ['#80d6d1'], filament_total: 1000, filament_weight_total: 3 }

function job (id: string, file: string, status: string, startIso: string, seconds: number, mm: number) {
  const start = Date.parse(startIso) / 1000
  return {
    job_id: id,
    filename: file,
    status,
    start_time: start,
    end_time: start + seconds,
    print_duration: seconds,
    total_duration: seconds + 120,
    filament_used: mm,
    exists: true,
    metadata: META
  }
}

export const YEAR_JOBS = [
  job('j1', 'cable_clip_x6_PLA_0.2mm.gcode', 'completed', '2026-11-12T09:00:00Z', 7200, 10_000),
  job('j2', 'phone_stand_PLA_0.2mm.gcode', 'completed', '2026-11-11T09:00:00Z', 3600, 20_000),
  job('j3', 'gear_housing_v3_PLA_0.16mm.gcode', 'completed', '2026-11-10T09:00:00Z', 10_800, 5000),
  job('j4', 'fan_duct_left_PLA_0.2mm.gcode', 'completed', '2026-11-10T18:00:00Z', 1800, 1000),
  job('j5', 'old_benchy_PLA_0.2mm.gcode', 'cancelled', '2026-11-08T09:00:00Z', 3600, 4000),
  job('j6', 'big_vase_PLA_0.2mm.gcode', 'completed', '2026-08-01T09:00:00Z', 36_000, 100_000),
  // From before the year: not counted.
  job('j7', 'ancient_cube_PLA_0.2mm.gcode', 'completed', '2025-11-09T09:00:00Z', 3600, 1000)
]
