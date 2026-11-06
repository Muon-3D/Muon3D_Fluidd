import { describe, expect, it } from 'vitest'
import { LEAN_LIMIT, PART_IDS, PART_NODES, leanToward, partOf } from '../parts'

const at = (x: number, y: number, z: number) => ({ x, y, z })

describe('leanToward', () => {
  const target = at(0, 0, 0)

  it('never leans past 8° of turn, 5° of tilt', () => {
    for (const p of [at(1000, 0, -1000), at(-1000, 900, 5), at(3, -800, 2), at(0, 0, -500)]) {
      for (const theta of [-3, -0.37, 0, 1.5, 3]) {
        const lean = leanToward(p, target, theta, 1.03)
        expect(Math.abs(lean.theta)).toBeLessThanOrEqual(LEAN_LIMIT.theta + 1e-9)
        expect(Math.abs(lean.phi)).toBeLessThanOrEqual(LEAN_LIMIT.phi + 1e-9)
        expect(lean.closer).toBe(1)
      }
    }
  })

  it('turns toward the side the part is on', () => {
    // Camera at θ = 0 looks along +z; a part off to +x pulls θ up, one to -x pulls it down.
    expect(leanToward(at(100, 0, 100), target, 0, Math.PI / 2).theta).toBeGreaterThan(0)
    expect(leanToward(at(-100, 0, 100), target, 0, Math.PI / 2).theta).toBeLessThan(0)
  })

  it('tilts down toward a part below the middle and up toward one above', () => {
    // φ grows as the camera goes down; a part below the middle (y < 0) has a larger polar angle.
    expect(leanToward(at(0, -100, 100), target, 0, Math.PI / 2 - 0.2).phi).toBeGreaterThan(0)
    expect(leanToward(at(0, 100, 100), target, 0, Math.PI / 2 + 0.2).phi).toBeLessThan(0)
  })

  it('takes the short way round across ±π', () => {
    const lean = leanToward(at(-1, 0, -100), target, Math.PI - 0.05, Math.PI / 2)
    expect(Math.abs(lean.theta)).toBeLessThan(0.05)
  })
})

describe('partOf', () => {
  const node = (name: string, parent: unknown = null) => ({ name, parent }) as never

  it('finds the part a mesh belongs to by walking up its parents', () => {
    const carriage = node('M1_X_Carriage')
    expect(partOf(node('', node('fan', carriage)))).toBe('toolhead')
    expect(partOf(node('M1_Knob'))).toBe('screen')
    expect(partOf(node('M1_Base'))).toBeNull()
  })

  it('names every part in both models', () => {
    for (const id of PART_IDS) {
      expect(PART_NODES[id].some(n => n.startsWith('M1_'))).toBe(true)
      expect(PART_NODES[id].some(n => !n.startsWith('M1_'))).toBe(true)
    }
  })
})
