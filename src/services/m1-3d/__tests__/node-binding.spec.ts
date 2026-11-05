import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { bindNodes } from '../accurate/node-binding'
import type { AccurateModelConfig } from '../accurate/node-config'

const config: AccurateModelConfig = {
  scale: 2,
  headX: { node: 'hx', axis: 'x', travel: 10 },
  headZ: { node: 'hz', axis: 'z', travel: -5, zero: 1 },
  bedHeight: { node: 'bed', axis: 'y', travel: 100 }
}

function model () {
  const root = new THREE.Group()
  for (const n of ['hx', 'hz', 'bed']) {
    const o = new THREE.Object3D()
    o.name = n
    o.position.set(1, 2, 3)
    root.add(o)
  }
  return root
}

describe('binding animations to node names', () => {
  it('moves each named node along its configured axis from where it rested', () => {
    const root = model()
    const b = bindNodes(root, config)
    b.apply({ headX: 0.5, headZ: 0, z: 1 })
    expect(root.getObjectByName('hx')!.position.toArray()).toEqual([1 + 0.5 * 10 * 2, 2, 3])
    expect(root.getObjectByName('hz')!.position.toArray()).toEqual([1, 2, 3 + (0 + 1) * -5 * 2])
    expect(root.getObjectByName('bed')!.position.toArray()).toEqual([1, 2 + 100 * 2, 3])
  })

  it('reports node names the model lacks and leaves the rest working', () => {
    const root = model()
    root.remove(root.getObjectByName('bed')!)
    const b = bindNodes(root, config)
    expect(b.missing).toEqual(['bed'])
    expect(() => b.apply({ headX: 1, headZ: 1, z: 1 })).not.toThrow()
    expect(root.getObjectByName('hx')!.position.x).toBe(21)
  })

  it('returns to rest at the zero state', () => {
    const root = model()
    const b = bindNodes(root, { ...config, headZ: { ...config.headZ, zero: 0 } })
    b.apply({ headX: 1, headZ: 1, z: 1 })
    b.apply({ headX: 0, headZ: 0, z: 0 })
    expect(root.getObjectByName('hx')!.position.toArray()).toEqual([1, 2, 3])
    expect(root.getObjectByName('hz')!.position.toArray()).toEqual([1, 2, 3])
  })
})
