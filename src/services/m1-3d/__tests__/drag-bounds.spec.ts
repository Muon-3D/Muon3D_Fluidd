import { describe, expect, it } from 'vitest'
import { axisEdges, boundCorners, noGoShown, type Project } from '../drag-bounds'

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

// KAN-4817: the notch is a box Z 0..6 (muon.m1-geometry v3); the head clears it from the traverse height up.
describe('noGoShown', () => {
  it('shows the zone while Z is inside the box\'s height', () => {
    for (const z of [0, 0.2, 3, 5.99]) expect(noGoShown(z, 6, true)).toBe(true)
  })
  it('hides the zone from the traverse height up', () => {
    for (const z of [6, 6.01, 10, 120, 250]) expect(noGoShown(z, 6, true)).toBe(false)
  })
  it('keeps it shown while Z is unhomed or unknown, or the printer gives no height', () => {
    expect(noGoShown(100, 6, false)).toBe(true)
    expect(noGoShown(undefined, 6, true)).toBe(true)
    expect(noGoShown(Number.NaN, 6, true)).toBe(true)
    expect(noGoShown(100, Infinity, true)).toBe(true)
  })
})
