import * as THREE from 'three'

/**
 * The knob on the model's base is a fluted wheel set in a window of the case,
 * and the GLB (the exterior only) models just the arc that stands proud of the
 * case, about 130 degrees. Turned, that arc swings away and leaves a gap
 * (Jack, 11 Nov: "it ends when you scroll too far"). The picture therefore
 * swaps that arc for a whole wheel of the same size, so a turn of any length
 * looks the same as the last. Visual only: nothing here is sent anywhere.
 */

/** The crests round the real wheel (counted off the GLB: one every 10.3 degrees). */
export const KNOB_FLUTES = 35
/** How deep a groove cuts, mm, and how narrow (higher is narrower). */
const GROOVE_DEPTH = 1.3
const GROOVE_SHARPNESS = 10
/** Steps round one flute. */
const STEPS_PER_FLUTE = 8
/** The wheel's rounded edge, as (height share, radius share) from the bottom up, mirrored at the top. */
const EDGE: ReadonlyArray<readonly [number, number]> = [[0, 0.915], [0.03, 0.96], [0.07, 0.985], [0.14, 1]]

const TAU = Math.PI * 2

/** The angle as drawn: the wheel is the same after a whole turn, so only the part of a turn shows. In (-PI, PI]. */
export function knobDrawAngle (angle: number): number {
  const a = angle - TAU * Math.round(angle / TAU)
  return a === -Math.PI ? Math.PI : a
}

/** How far round the wheel's rim the geometry's vertices reach, in degrees: 360 when no gap is left. */
export function knobArcDegrees (geometry: THREE.BufferGeometry): number {
  const pos = geometry.getAttribute('position')
  const angles: number[] = []
  for (let i = 0; i < pos.count; i++) {
    if (Math.hypot(pos.getX(i), pos.getZ(i)) < 1e-6) continue
    angles.push(Math.atan2(pos.getX(i), pos.getZ(i)))
  }
  if (!angles.length) return 0
  angles.sort((a, b) => a - b)
  // The largest empty stretch between neighbours (round the back too) is what is missing.
  let gap = angles[0] + TAU - angles[angles.length - 1]
  for (let i = 1; i < angles.length; i++) gap = Math.max(gap, angles[i] - angles[i - 1])
  return Math.round(((TAU - gap) * 180 / Math.PI) * 10) / 10
}

/** The size the GLB's arc has: its outer radius and its height along the axis, read off its vertices. */
export function measureKnobArc (geometry: THREE.BufferGeometry): { radius: number, y0: number, y1: number } {
  const pos = geometry.getAttribute('position')
  let radius = 0
  let y0 = Infinity
  let y1 = -Infinity
  for (let i = 0; i < pos.count; i++) {
    radius = Math.max(radius, Math.hypot(pos.getX(i), pos.getZ(i)))
    y0 = Math.min(y0, pos.getY(i))
    y1 = Math.max(y1, pos.getY(i))
  }
  return { radius, y0, y1 }
}

/**
 * A whole fluted wheel about the Y axis, `radius` mm out to the crests and from `y0` to `y1`, with rounded edges and
 * flat ends. Its axis runs through the origin, as the GLB's arc does, so the node's own turn is the wheel's.
 */
export function buildKnobWheelGeometry (radius: number, y0: number, y1: number): THREE.BufferGeometry {
  const height = y1 - y0
  const rings: Array<{ y: number, r: number, groove: number }> = []
  for (const [h, r] of EDGE) rings.push({ y: y0 + h * height, r: radius * r, groove: h / 0.14 })
  for (const [h, r] of [...EDGE].reverse()) rings.push({ y: y1 - h * height, r: radius * r, groove: h / 0.14 })
  const steps = KNOB_FLUTES * STEPS_PER_FLUTE
  const positions: number[] = []
  const indices: number[] = []
  const rimAt = (ring: typeof rings[number], step: number) => {
    const a = (step / steps) * TAU
    const g = Math.pow(Math.abs(Math.sin(KNOB_FLUTES * a / 2)), GROOVE_SHARPNESS)
    return ring.r - GROOVE_DEPTH * (1 - g) * ring.groove
  }
  // The sides: one ring of `steps` vertices per row, the last wrapping to the first.
  for (const ring of rings) {
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * TAU
      const r = rimAt(ring, s)
      positions.push(Math.sin(a) * r, ring.y, Math.cos(a) * r)
    }
  }
  for (let row = 0; row < rings.length - 1; row++) {
    for (let s = 0; s < steps; s++) {
      const a = row * steps + s
      const b = row * steps + ((s + 1) % steps)
      const c = (row + 1) * steps + s
      const d = (row + 1) * steps + ((s + 1) % steps)
      indices.push(a, b, c, b, d, c)
    }
  }
  // The flat ends, a fan to the axis (own vertices, so the end is not smoothed into the side).
  const cap = (row: number, up: boolean) => {
    const centre = positions.length / 3
    positions.push(0, rings[row].y, 0)
    const first = positions.length / 3
    for (let s = 0; s < steps; s++) {
      const i = row * steps + s
      positions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
    }
    for (let s = 0; s < steps; s++) {
      const p = first + s
      const q = first + ((s + 1) % steps)
      if (up) indices.push(centre, p, q)
      else indices.push(centre, q, p)
    }
  }
  cap(0, false)
  cap(rings.length - 1, true)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
