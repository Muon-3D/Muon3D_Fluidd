import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { CONTENTS_ORDER, FROSTED_PLATE, GLASS_ORDER, GLASS_OPACITY, flattenGlass } from '../glass-material'
import { buildAccurateRig } from '../accurate/rig'
import { glbScene } from './glb-nodes'

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

  it('is see-through: the bed lets nearly all of what is behind it show (Jack, 11 Nov)', () => {
    // The real glass: almost all of the light through, hardly blurred.
    expect(FROSTED_PLATE.transmission).toBeGreaterThanOrEqual(0.95)
    expect(FROSTED_PLATE.roughness).toBeLessThanOrEqual(0.15)
    // The plain plate a phone gets, and the flattened one: a thin veil.
    expect(FROSTED_PLATE.cheapOpacity).toBeLessThanOrEqual(0.15)
    expect(GLASS_OPACITY).toBeLessThanOrEqual(0.12)
    const mats = { glass: glassLike(), glassEdge: glassLike() }
    flattenGlass(mats)
    expect(mats.glass.opacity).toBe(GLASS_OPACITY)
  })

  it('is what the accurate rig puts on the plate, real and cheap', () => {
    const scene = glbScene()
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ name: FROSTED_PLATE.name, transmission: 1, roughness: 0.5 }))
    scene.add(plate)
    const rig = buildAccurateRig(scene)
    const material = plate.material as THREE.MeshPhysicalMaterial
    expect(material.transmission).toBe(FROSTED_PLATE.transmission)
    expect(material.roughness).toBe(FROSTED_PLATE.roughness)
    rig.useCheapGlass()
    expect(material.opacity).toBe(FROSTED_PLATE.cheapOpacity)
  })

  it('leaves materials the model lacks alone', () => {
    expect(() => flattenGlass({})).not.toThrow()
  })
})
