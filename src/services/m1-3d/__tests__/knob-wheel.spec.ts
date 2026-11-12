import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { KNOB_FLUTES, buildKnobWheelGeometry, knobArcDegrees, knobDrawAngle, measureKnobArc } from '../knob-wheel'
import { KNOB_DETENT, KNOB_PRESS_MM, KNOB_PRESS_MS, knobGoal, knobPressDepth } from '../knob'

/** The GLB's arc: only the side that stands out of the case, about 130 degrees of a 20.8 mm wheel, 21 mm tall. */
function arcOnly (): THREE.BufferGeometry {
  const pts: number[] = []
  for (let d = -65; d <= 65; d += 2) {
    const a = d * Math.PI / 180
    for (const y of [0, 21]) pts.push(Math.sin(a) * 20.76, y, Math.cos(a) * 20.76)
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
}

describe('the knob\'s whole wheel', () => {
  it('measures the GLB\'s arc: its radius and its height', () => {
    const m = measureKnobArc(arcOnly())
    expect(m.radius).toBeCloseTo(20.76, 2)
    expect(m.y0).toBe(0)
    expect(m.y1).toBe(21)
  })

  it('the arc alone covers about a third of a turn: turned far, the rest would show as a gap', () => {
    expect(knobArcDegrees(arcOnly())).toBeCloseTo(130, 0)
  })

  it('the wheel covers every angle round, with no gap, at the crest radius all the way', () => {
    const g = buildKnobWheelGeometry(20.76, 0, 21)
    expect(knobArcDegrees(g)).toBeGreaterThan(358)
    const pos = g.getAttribute('position')
    const crest = new Map<number, number>()
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i) - 10.5) > 8) continue
      const a = Math.round(Math.atan2(pos.getX(i), pos.getZ(i)) * 180 / Math.PI / 10)
      crest.set(a, Math.max(crest.get(a) ?? 0, Math.hypot(pos.getX(i), pos.getZ(i))))
    }
    expect(crest.size).toBeGreaterThanOrEqual(36)
    for (const r of crest.values()) expect(r).toBeGreaterThan(19.5)
  })

  it('has the real wheel\'s flutes, and the same size as the arc', () => {
    expect(KNOB_FLUTES).toBe(35)
    const g = buildKnobWheelGeometry(20.76, 0, 21)
    g.computeBoundingBox()
    const bb = g.boundingBox as THREE.Box3
    expect(bb.max.x).toBeCloseTo(20.76, 0)
    expect(bb.min.x).toBeCloseTo(-20.76, 0)
    expect(bb.min.y).toBeCloseTo(0)
    expect(bb.max.y).toBeCloseTo(21)
  })

  it('faces outward on its sides and ends', () => {
    const g = buildKnobWheelGeometry(20.76, 0, 21)
    const pos = g.getAttribute('position')
    const nor = g.getAttribute('normal')
    let sides = 0
    let tops = 0
    let bottoms = 0
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (Math.abs(nor.getY(i)) > 0.99) {
        if (y > 20.9 && nor.getY(i) > 0) tops++
        else if (y < 0.1 && nor.getY(i) < 0) bottoms++
      } else if (y > 2.9 && y < 18.1) {
        sides++
        expect(pos.getX(i) * nor.getX(i) + pos.getZ(i) * nor.getZ(i)).toBeGreaterThan(0)
      }
    }
    expect(sides).toBeGreaterThan(100)
    expect(tops).toBeGreaterThan(100)
    expect(bottoms).toBeGreaterThan(100)
  })
})

describe('the knob angle wraps', () => {
  it('draws the part of a turn: a whole turn is the same picture', () => {
    expect(knobDrawAngle(0)).toBe(0)
    expect(knobDrawAngle(2 * Math.PI)).toBeCloseTo(0)
    expect(knobDrawAngle(-2 * Math.PI)).toBeCloseTo(0)
    expect(knobDrawAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2)
    expect(knobDrawAngle(Math.PI * 2 + 0.3)).toBeCloseTo(0.3)
    expect(knobDrawAngle(-Math.PI * 2 - 0.3)).toBeCloseTo(-0.3)
  })

  it('three full turns of scrolling land back where they began, each step one detent the short way round', () => {
    let goal = 0
    let last = knobDrawAngle(0)
    const detents = Math.round((3 * 2 * Math.PI) / KNOB_DETENT)
    expect(detents).toBe(72)
    for (let i = 0; i < detents; i++) {
      goal = knobGoal(goal, 1)
      const drawn = knobDrawAngle(goal)
      // Across the wrap (180 to -180) the step is still one detent, not a jump of a turn.
      let step = drawn - last
      if (step < -Math.PI) step += 2 * Math.PI
      expect(step).toBeCloseTo(KNOB_DETENT, 9)
      last = drawn
    }
    expect(goal).toBeCloseTo(6 * Math.PI)
    expect(knobDrawAngle(goal)).toBeCloseTo(0)
  })

  it('stays in range however far it is turned', () => {
    expect(Math.abs(knobDrawAngle(1e6 * Math.PI + 0.7))).toBeLessThanOrEqual(Math.PI)
  })
})

describe('the knob\'s press', () => {
  it('goes in far enough to see, for a short moment', () => {
    expect(KNOB_PRESS_MM).toBeGreaterThanOrEqual(2)
    expect(KNOB_PRESS_MS).toBeGreaterThanOrEqual(100)
    expect(KNOB_PRESS_MS).toBeLessThanOrEqual(300)
  })

  it('goes in quickly, then comes out, by the clock', () => {
    expect(knobPressDepth(-5)).toBe(0)
    expect(knobPressDepth(0)).toBe(0)
    expect(knobPressDepth(KNOB_PRESS_MS * 0.3)).toBeCloseTo(1)
    expect(knobPressDepth(KNOB_PRESS_MS * 0.15)).toBeGreaterThan(0.8)
    expect(knobPressDepth(KNOB_PRESS_MS * 0.65)).toBeGreaterThan(0.1)
    expect(knobPressDepth(KNOB_PRESS_MS * 0.65)).toBeLessThan(0.9)
    expect(knobPressDepth(KNOB_PRESS_MS)).toBe(0)
    expect(knobPressDepth(5000)).toBe(0)
    // Even a frame that comes late shows it part way in: a slow renderer still sees the press.
    let deepest = 0
    for (let t = 0; t < KNOB_PRESS_MS; t += 55) deepest = Math.max(deepest, knobPressDepth(t))
    expect(deepest * KNOB_PRESS_MM).toBeGreaterThan(1.5)
  })
})
