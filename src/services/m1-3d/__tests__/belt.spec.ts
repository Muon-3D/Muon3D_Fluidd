import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildAccurateRig } from '../accurate/rig'
import { placeAccurate } from '../accurate/klipper-map'
import { glbScene } from './glb-nodes'

/**
 * The cross-rail belt used to be part of the static base, so it stayed where
 * the gantry rests while the gantry moved, floating over the deck (Jack, 6 Nov).
 * It is now skinned like the hose: its rail strand rides on the gantry.
 */
describe('the cross-rail belt follows the gantry', () => {
  it('is a skinned mesh of its own that is never culled', () => {
    const scene = glbScene()
    buildAccurateRig(scene)
    const belt = scene.getObjectByName('M1_Belt') as THREE.SkinnedMesh
    expect((belt as any).isSkinnedMesh).toBe(true)
    expect(belt.frustumCulled).toBe(false)
  })

  it('has one joint on the gantry and one off it', () => {
    const scene = glbScene()
    expect(scene.getObjectByName('belt_gantry')!.parent!.name).toBe('M1_Y_Gantry')
    expect(scene.getObjectByName('belt_base')!.parent!.name).not.toBe('M1_Y_Gantry')
  })

  it('moves its gantry joint with the gantry and leaves the other alone', () => {
    const scene = glbScene()
    const rig = buildAccurateRig(scene)
    const world = (n: string) => { scene.updateMatrixWorld(true); return scene.getObjectByName(n)!.getWorldPosition(new THREE.Vector3()) }
    rig.place(placeAccurate({ x: 100, y: 90, z: 40, led: false, progress: 0 }))
    const joint0 = world('belt_gantry')
    const base0 = world('belt_base')
    const gantry0 = world('M1_Y_Gantry')
    for (const y of [0, 180]) {
      rig.place(placeAccurate({ x: 100, y, z: 40, led: false, progress: 0 }))
      const moved = world('M1_Y_Gantry').sub(gantry0)
      expect(moved.length()).toBeGreaterThan(50)
      expect(world('belt_gantry').sub(joint0).distanceTo(moved)).toBeLessThan(1e-3)
      expect(world('belt_base').distanceTo(base0)).toBeLessThan(1e-6)
    }
  })
})
