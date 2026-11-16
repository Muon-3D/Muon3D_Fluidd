/**
 * The marks drawn over the top-down toolhead view, in screen pixels: which
 * limits the X and Y scales sit on, and the corners of a rectangle of the
 * plate (the head's reach, or the bed's notch). Given a projection from
 * Klipper (X, Y) to the page, so it is cheap to test without three.js.
 */
export type Project = (x: number, y: number) => { x: number, y: number } | null

/**
 * The limits the scales are drawn along: X along whichever Y limit is lower
 * on the screen, Y along whichever X limit is further left, so they sit at
 * the edge of where the head can go whichever way the view is turned.
 */
export function axisEdges (lo: [number, number], hi: [number, number], project: Project): { x: number, y: number } {
  const mid = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]
  const yLo = project(mid[0], lo[1])
  const yHi = project(mid[0], hi[1])
  const xLo = project(lo[0], mid[1])
  const xHi = project(hi[0], mid[1])
  return {
    y: yLo && yHi && yHi.y > yLo.y ? hi[1] : lo[1],
    x: xLo && xHi && xHi.x < xLo.x ? hi[0] : lo[0]
  }
}

/** Each corner's arm, as a share of the side, at most this many pixels. */
const ARM = 0.12
const ARM_MAX_PX = 18

const pt = (p: { x: number, y: number }) => `${Math.round(p.x)} ${Math.round(p.y)}`

/**
 * An SVG path for a plate rectangle: an L at each corner, or (`closed`) the
 * whole outline. '' when a corner isn't on the screen.
 */
export function boundCorners (lo: [number, number], hi: [number, number], project: Project, closed = false): string {
  const corners = [project(lo[0], lo[1]), project(hi[0], lo[1]), project(hi[0], hi[1]), project(lo[0], hi[1])]
  if (corners.some(c => !c || !Number.isFinite(c.x) || !Number.isFinite(c.y))) return ''
  const c = corners as Array<{ x: number, y: number }>
  if (closed) return `M${c.map(pt).join('L')}Z`
  return c.map((p, i) => {
    const prev = c[(i + 3) % 4]
    const next = c[(i + 1) % 4]
    const toward = (q: { x: number, y: number }) => {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const len = Math.hypot(dx, dy) || 1
      const arm = Math.min(ARM_MAX_PX, len * ARM)
      return { x: p.x + dx / len * arm, y: p.y + dy / len * arm }
    }
    return `M${pt(toward(prev))}L${pt(p)}L${pt(toward(next))}`
  }).join('')
}
