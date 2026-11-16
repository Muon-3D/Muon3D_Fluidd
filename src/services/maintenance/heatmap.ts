/**
 * The bed mesh as a heat map: one colour (the accent) that is faint where the
 * plate measured lowest and strong where it measured highest, over the mesh's
 * own range. Heights are millimetres, as Klipper reports them.
 */
export const HEAT_RGB: readonly [number, number, number] = [128, 214, 209]

/** The faintest and strongest a cell gets, so the lowest point still shows. */
export const HEAT_ALPHA_MIN = 0.2
export const HEAT_ALPHA_MAX = 0.9

/** A flat mesh has no range to spread over: every cell is the same middling strength. */
const FLAT_ALPHA = 0.55

export interface HeatScale {
  min: number;
  max: number;
}

export interface MeshFigures {
  /** Highest less lowest, in mm. */
  spread: number;
  min: number;
  max: number;
  /** Points across (X) and deep (Y). */
  columns: number;
  rows: number;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** The lowest and highest measured point, ignoring cells not measured (null, NaN, Infinity). */
export function heatScale (grid: Array<Array<number | null | undefined>>): HeatScale | null {
  const values = grid.flat().filter(finite)
  if (!values.length) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}

/** How strong a cell is drawn, from HEAT_ALPHA_MIN at the mesh's lowest point to HEAT_ALPHA_MAX at its highest. */
export function heatAlpha (value: number, scale: HeatScale): number {
  const span = scale.max - scale.min
  if (!finite(value) || !(span > 1e-9)) return FLAT_ALPHA
  const t = Math.min(1, Math.max(0, (value - scale.min) / span))
  return Math.round((HEAT_ALPHA_MIN + (HEAT_ALPHA_MAX - HEAT_ALPHA_MIN) * t) * 1000) / 1000
}

/** A cell's background. */
export function heatColor (value: number, scale: HeatScale): string {
  return `rgba(${HEAT_RGB[0]}, ${HEAT_RGB[1]}, ${HEAT_RGB[2]}, ${heatAlpha(value, scale)})`
}

/** The ends of the scale bar: faint at the low end, strong at the high end. */
export function heatGradient (): string {
  const [r, g, b] = HEAT_RGB
  return `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, ${HEAT_ALPHA_MIN}), rgba(${r}, ${g}, ${b}, ${HEAT_ALPHA_MAX}))`
}

/** Whether a number written on a cell reads best dark (on a strong cell) or light (on a faint one). */
export function heatInk (alpha: number): 'dark' | 'light' {
  return alpha >= 0.6 ? 'dark' : 'light'
}

/** A height with its sign and a true minus: "+0.05", "−0.06", "0.00" (never "-0.00"). */
export function signedMm (value: number, places = 2): string {
  const rounded = Number(value.toFixed(places))
  if (rounded === 0) return (0).toFixed(places)
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(places)}`
}

/** The figures beside the map: spread, highest, lowest and the size of the grid. */
export function meshFigures (grid: Array<Array<number | null | undefined>>): MeshFigures | null {
  const scale = heatScale(grid)
  if (!scale) return null
  return {
    spread: Math.round((scale.max - scale.min) * 1000) / 1000,
    min: scale.min,
    max: scale.max,
    columns: Math.max(0, ...grid.map(row => row.length)),
    rows: grid.length
  }
}
