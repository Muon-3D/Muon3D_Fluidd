import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildAccurateRig } from '../accurate/rig'
import { placeAccurate } from '../accurate/klipper-map'
import { glbScene } from './glb-nodes'

describe('the hose follows the head', () => {
  it('is a skinned mesh that is never culled', () => {
    const scene = glbScene()
    buildAccurateRig(scene)
    const hose = scene.getObjectByName('M1_Hose') as THREE.SkinnedMesh
    expect((hose as any).isSkinnedMesh).toBe(true)
    expect(hose.frustumCulled).toBe(false)
  })

  it('has its head joint under the carriage and its base joint off it', () => {
    const scene = glbScene()
    expect(scene.getObjectByName('hose_head')!.parent!.name).toBe('M1_X_Carriage')
    expect(scene.getObjectByName('hose_base')!.parent!.name).not.toBe('M1_X_Carriage')
  })

  it('moves the head joint with the carriage, at each corner, and leaves the base joint alone', () => {
    const scene = glbScene()
    const rig = buildAccurateRig(scene)
    const world = (n: string) => { scene.updateMatrixWorld(true); return scene.getObjectByName(n)!.getWorldPosition(new THREE.Vector3()) }
    rig.place(placeAccurate({ x: 100, y: 90, z: 40, led: false, progress: 0 }))
    const head0 = world('hose_head')
    const base0 = world('hose_base')
    const carriage0 = world('M1_X_Carriage')
    for (const [x, y] of [[0, 0], [200, 0], [0, 180], [200, 180]]) {
      rig.place(placeAccurate({ x, y, z: 40, led: false, progress: 0 }))
      const moved = world('M1_X_Carriage').sub(carriage0)
      expect(moved.length()).toBeGreaterThan(50)
      expect(world('hose_head').sub(head0).distanceTo(moved)).toBeLessThan(1e-3)
      expect(world('hose_base').distanceTo(base0)).toBeLessThan(1e-6)
    }
  })

  it('does not move with the bed', () => {
    const scene = glbScene()
    const rig = buildAccurateRig(scene)
    rig.place(placeAccurate({ x: 100, y: 90, z: 10, led: false, progress: 0 }))
    scene.updateMatrixWorld(true)
    const a = scene.getObjectByName('hose_head')!.getWorldPosition(new THREE.Vector3())
    rig.place(placeAccurate({ x: 100, y: 90, z: 100, led: false, progress: 0 }))
    scene.updateMatrixWorld(true)
    expect(scene.getObjectByName('hose_head')!.getWorldPosition(new THREE.Vector3()).distanceTo(a)).toBeLessThan(1e-6)
  })
})
