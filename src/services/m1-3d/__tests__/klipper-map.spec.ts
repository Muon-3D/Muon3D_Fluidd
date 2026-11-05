import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { bindNodes } from '../accurate/node-binding'
import { ACCURATE_M1 } from '../accurate/node-config'
import { ACCURATE_RIG, placeAccurate, plateTopAt } from '../accurate/klipper-map'
import { RESTING } from '../pose'
import { glbScene } from './glb-nodes'

const pose = (x: number | null, y: number | null, z: number | null) => ({ x, y, z, led: false, progress: 0 })

describe('Klipper position to the accurate M1 state', () => {
  it('puts the head and the bed where the printer says, in the model\'s state', () => {
    // Home: X 0, Y 0 (plate left, back edge) and the tip touching the plate (Z 0).
    const home = placeAccurate(pose(0, 0, 0))
    expect(home.headX).toBeCloseTo((-100 - 0.6) / 102.2, 6)
    expect(home.headZ).toBeCloseTo((-90 + 2.05) / 89.95, 6)
    // Plate top = tip (-70.2) + 0 + glass 4.11; state counts from the lowest, -76.8, over 150.5.
    expect(home.z).toBeCloseTo((-70.2 + 4.11 + 76.8) / 150.5, 6)
  })

  it('is centred when the nozzle is over the middle of the plate', () => {
    const c = placeAccurate(pose(100, 90, 50))
    expect(c.headX).toBeCloseTo((0 - 0.6) / 102.2, 6)
    expect(c.headZ).toBeCloseTo(2.05 / 89.95, 6)
    expect(c.z).toBeCloseTo((-70.2 + 50 + 4.11 + 76.8) / 150.5, 6)
  })

  it('stops at the travel limits instead of running past them', () => {
    expect(placeAccurate(pose(-50, 0, 0)).headX).toBe(-1)
    expect(placeAccurate(pose(400, 0, 0)).headX).toBe(1)
    // Y 180 would put the nozzle at +90, the rig stops at +87.9.
    expect(placeAccurate(pose(0, 180, 0)).headZ).toBe(1)
    expect(placeAccurate(pose(0, -40, 0)).headZ).toBe(-1)
    expect(placeAccurate(pose(0, 0, 400)).z).toBe(1)
    expect(placeAccurate(pose(0, 0, -50)).z).toBe(0)
  })

  it('reaches each limit exactly at the rig\'s own end of travel', () => {
    expect(plateTopAt(1)).toBeCloseTo(73.7, 6)
    expect(plateTopAt(0)).toBeCloseTo(-76.8, 6)
    // X 199.4 puts the nozzle at 99.4; the rig goes to 102.8 only for an X past the plate.
    expect(placeAccurate(pose(202.8, 0, 0)).headX).toBe(1)
    expect(placeAccurate(pose(-1.6, 0, 0)).headX).toBe(-1)
  })

  it('draws an axis that is not homed at the model\'s resting pose', () => {
    const p = placeAccurate(pose(null, null, null))
    expect(p).toEqual({ headX: RESTING.headX, headZ: RESTING.headZ, z: RESTING.z })
  })
})

const glbNodes = glbScene

/** The world position of a point fixed to `node`, wherever the bindings have put it. */
function follower (scene: THREE.Object3D, node: string, world: THREE.Vector3) {
  const obj = scene.getObjectByName(node)!
  const local = obj.worldToLocal(world.clone())
  return () => {
    scene.updateMatrixWorld(true)
    return obj.localToWorld(local.clone())
  }
}

describe('the model\'s own nodes, driven from Klipper\'s position', () => {
  const rest = ACCURATE_RIG
  const setup = () => {
    const scene = glbNodes()
    // The bed is at its modelled height here: the glass plate's top is at world Y 0.
    const tip = follower(scene, 'M1_X_Carriage', new THREE.Vector3(rest.nozzleX, rest.tipY, rest.nozzleZ))
    const plate = follower(scene, 'M1_Z_Stage', new THREE.Vector3(0, 0, 0))
    const b = bindNodes(scene, ACCURATE_M1)
    expect(b.missing).toEqual([])
    return { tip, plate, apply: (p: ReturnType<typeof pose>) => b.apply(placeAccurate(p)) }
  }

  it('moves the tip to X and Z, and the plate to the height, the pose names', () => {
    const { tip, plate, apply } = setup()
    for (const [x, y, z] of [[0, 0, 0], [100, 90, 50], [200, 0, 10], [20, 170, 120]]) {
      apply(pose(x, y, z))
      expect(tip().x).toBeCloseTo(x - 100, 4)
      expect(tip().z).toBeCloseTo(y - 90, 4)
      expect(tip().y).toBeCloseTo(rest.tipY, 4)
      expect(plate().y).toBeCloseTo(rest.tipY + z + rest.plateThickness, 3)
    }
  })

  it('runs the head to the travel limits and no further, in each direction', () => {
    const { tip, plate, apply } = setup()
    apply(pose(-500, -500, -500))
    expect(tip().x).toBeCloseTo(-101.6, 3)
    expect(tip().z).toBeCloseTo(-92.0, 3)
    expect(plate().y).toBeCloseTo(-76.8, 3)
    apply(pose(500, 500, 500))
    expect(tip().x).toBeCloseTo(102.8, 3)
    expect(tip().z).toBeCloseTo(87.9, 3)
    expect(plate().y).toBeCloseTo(73.7, 3)
  })

  it('has the nozzle at the rig\'s rest and the plate top at 0 when the nodes are untouched', () => {
    const { tip, plate } = setup()
    expect(tip().toArray()).toEqual([rest.nozzleX, rest.tipY, rest.nozzleZ].map(v => expect.closeTo(v, 4)))
    expect(plate().y).toBeCloseTo(0, 4)
  })
})
