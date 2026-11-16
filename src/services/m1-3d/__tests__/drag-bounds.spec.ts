import { describe, expect, it } from 'vitest'
import { axisEdges, boundCorners, type Project } from '../drag-bounds'

// Looking down with X to the right and Y toward the bottom of the screen (Y 0 at the back, the top).
const down: Project = (x, y) => ({ x: 100 + x, y: 50 + y })
// The same view turned half round: X to the left, Y toward the top.
const turned: Project = (x, y) => ({ x: 400 - x, y: 300 - y })

describe('drag-bounds', () => {
  it('puts X along the limit lowest on the screen and Y along the leftmost', () => {
    expect(axisEdges([0, 0], [200, 180], down)).toEqual({ x: 0, y: 180 })
    expect(axisEdges([0, 0], [200, 180], turned)).toEqual({ x: 200, y: 0 })
  })

  it('draws an L at each corner of the reach, the arms no longer than 18 px', () => {
    const d = boundCorners([0, 0], [200, 180], down)
    expect(d.match(/M/g)).toHaveLength(4)
    expect(d.startsWith('M100 68L100 50L118 50')).toBe(true)
  })

  it('outlines the notch closed, and draws nothing for a corner off the screen', () => {
    expect(boundCorners([75, 0], [125, 34], down, true)).toBe('M175 50L225 50L225 84L175 84Z')
    expect(boundCorners([0, 0], [10, 10], () => null)).toBe('')
  })
})
