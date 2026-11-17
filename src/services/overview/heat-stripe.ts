import type { ChartPoint } from './model'

export type HeatState = 'cold' | 'heating' | 'ready' | 'over'
export interface HeatBand { x: number; width: number; state: HeatState; temperature: number; target: number }

export function heatState (temperature: number, target: number): HeatState {
  if (target <= 0) return 'cold'
  if (temperature > target + 5) return 'over'
  return temperature < target - 5 ? 'heating' : 'ready'
}

export function heatBands (points: ChartPoint[], key: string, now: number): HeatBand[] {
  const from = now - 600000
  const samples = new Map<number, ChartPoint>()
  for (const p of points) {
    const at = p.date instanceof Date ? p.date.getTime() : NaN
    if (at > from && at <= now && Number.isFinite(p[key]) && Number.isFinite(p[`${key}Target`])) samples.set(at, p)
  }
  const bands: HeatBand[] = []
  for (const [at, p] of [...samples].sort((a, b) => a[0] - b[0])) {
    const temperature = p[key] as number
    const target = p[`${key}Target`] as number
    const state = heatState(temperature, target)
    const end = (at - from) / 1000
    const x = Math.max(0, end - 1)
    const last = bands.at(-1)
    if (last && last.state === state && x <= last.x + last.width + 0.1) {
      last.width = end - last.x
      last.temperature = temperature
      last.target = target
    } else bands.push({ x, width: end - x, state, temperature, target })
  }
  return bands
}

export function finishPoint (eta: number | null): { x: number; y: number; label: string } | null {
  if (eta === null || !Number.isFinite(eta)) return null
  const date = new Date(eta)
  if (!Number.isFinite(date.getTime())) return null
  const angle = ((date.getHours() + date.getMinutes() / 60) / 24) * Math.PI * 2 - Math.PI / 2
  return { x: 32 + Math.cos(angle) * 21, y: 32 + Math.sin(angle) * 21, label: date.toLocaleString() }
}
