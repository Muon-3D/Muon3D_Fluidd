import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { WebGLRenderList } from 'three/src/renderers/webgl/WebGLRenderLists.js'
import { cargoMaterials, fadeCargoMaterials } from '../cargo-fade'

/**
 * Which of three.js's three lists an object is drawn from. The glass plate
 * (transmission > 0) is drawn over a picture of the opaque list alone, and
 * the transparent list after it, depth-tested against it: so only an opaque
 * part shows through the plate.
 */
function listOf (material: THREE.Material): 'opaque' | 'transmissive' | 'transparent' {
  // The typings want the renderer's properties; three.js's list takes none.
  const list = new WebGLRenderList({} as never)
  list.init()
  const object = new THREE.Mesh(new THREE.BufferGeometry(), material)
  list.push(object, object.geometry, material, 0, 0, null)
  if (list.opaque.length) return 'opaque'
  return list.transmissive.length ? 'transmissive' : 'transparent'
}

const glassLike = () => new THREE.MeshPhysicalMaterial({ transmission: 1, thickness: 3.85, ior: 1.52 })

describe('the print under the glass plate', () => {
  it('is drawn with the opaque things the plate shows through', () => {
    // 16 Oct 2026: "you can see through the plate, and can't see things like
    // prints" since the part's materials were made transparent to fade.
    const { part, taps } = cargoMaterials()
    expect(listOf(glassLike())).toBe('transmissive')
    expect(listOf(part)).toBe('opaque')
    expect(listOf(taps)).toBe('opaque')
  })

  it('is transparent only while it fades, falling off a returned plate, and opaque again after', () => {
    const { part, taps } = cargoMaterials()
    const before = part.version

    fadeCargoMaterials([part, taps], 0.4)
    expect([part.opacity, part.transparent, listOf(part)]).toEqual([0.4, true, 'transparent'])
    expect(listOf(taps)).toBe('transparent')
    // A change of list is a change of shader, so three.js is told.
    expect(part.version).toBeGreaterThan(before)

    const during = part.version
    fadeCargoMaterials([part, taps], 0.2)
    expect(part.version).toBe(during)

    fadeCargoMaterials([part, taps], 1)
    expect([part.opacity, part.transparent, listOf(part)]).toEqual([1, false, 'opaque'])
    expect(listOf(taps)).toBe('opaque')
  })
})
