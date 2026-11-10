/**
 * A damped spring, sampled for the Web Animations API: how far from rest a
 * tile still is (1 at the start, 0 at rest) at evenly spaced frames. A little
 * under critical damping, so it overshoots a touch and settles rather than stops.
 */
export interface SpringOptions { stiffness?: number; damping?: number; mass?: number; fps?: number; maxMs?: number }

export interface SpringCurve { duration: number; frames: number[] }

export function springCurve ({ stiffness = 210, damping = 22, mass = 1, fps = 60, maxMs = 900 }: SpringOptions = {}): SpringCurve {
  const dt = 1 / fps
  const frames = [1]
  let x = 1
  let v = 0
  for (let t = dt; t * 1000 <= maxMs; t += dt) {
    // Semi-implicit Euler, in small steps so a stiff spring stays stable.
    for (let i = 0; i < 8; i++) {
      v += ((-stiffness * x - damping * v) / mass) * (dt / 8)
      x += v * (dt / 8)
    }
    frames.push(x)
    if (Math.abs(x) < 0.002 && Math.abs(v) < 0.02) break
  }
  frames[frames.length - 1] = 0
  return { duration: Math.round((frames.length - 1) * dt * 1000), frames }
}

export interface Offset { dx: number; dy: number; sx: number; sy: number }

/** Keyframes that carry a tile from `from` (where it was, relative to now) to where it is. */
export function springKeyframes (from: Offset, curve: SpringCurve = springCurve()): Keyframe[] {
  return curve.frames.map(p => ({
    transform: `translate(${from.dx * p}px, ${from.dy * p}px) scale(${1 + (from.sx - 1) * p}, ${1 + (from.sy - 1) * p})`,
    transformOrigin: 'top left'
  }))
}

export function reducedMotion (): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
