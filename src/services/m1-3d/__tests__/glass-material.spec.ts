import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { CONTENTS_ORDER, GLASS_ORDER, flattenGlass } from '../glass-material'

const glassLike = () => new THREE.MeshPhysicalMaterial({ transmission: 1, thickness: 3.85, side: THREE.DoubleSide })

describe('the glass plate material', () => {
  it('has no transmission, so no second render pass', () => {
    const mats = { glass: glassLike(), glassEdge: glassLike() }
    flattenGlass(mats)
    for (const m of Object.values(mats)) {
      expect(m.transmission).toBe(0)
      expect(m.thickness).toBe(0)
    }
  })

  it('is transparent and does not write depth, so what is behind it still draws and shows', () => {
    const mats = { glass: glassLike(), glassEdge: glassLike() }
    flattenGlass(mats)
    for (const m of Object.values(mats)) {
      expect(m.transparent).toBe(true)
      expect(m.depthWrite).toBe(false)
      expect(m.opacity).toBeGreaterThan(0)
      expect(m.opacity).toBeLessThan(1)
    }
  })

  it('draws after the print and the probe dots it covers', () => {
    expect(GLASS_ORDER).toBeGreaterThan(CONTENTS_ORDER)
  })

  it('leaves materials the model lacks alone', () => {
    expect(() => flattenGlass({})).not.toThrow()
  })
})
