import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { ACCURATE_SPOOL_NODES, WALL_HOLE, WALL_NORMAL, buildAccurateSpool } from '../accurate/spool'
import { glbScene } from './glb-nodes'

/** The cup in the deck beside the screen, which the strand used to go into (Jack, 11 Nov: that is the fan). */
const OLD_CUP = new THREE.Vector3(3, -111.1, 51.1)
/** The deck's back, where the strand went before (Jack, 11 Nov: that is not the hole either). */
const OLD_BACK_OF_DECK = new THREE.Vector3(-97, -107, 66)

function strandOf () {
  const root = new THREE.Group()
  const spool = buildAccurateSpool(root)
  const strand = root.getObjectByName(ACCURATE_SPOOL_NODES.strand) as THREE.Mesh
  const hole = root.getObjectByName(ACCURATE_SPOOL_NODES.hole) as THREE.Mesh
  const end = root.getObjectByName(ACCURATE_SPOOL_NODES.end) as THREE.Object3D
  strand.geometry.computeBoundingBox()
  return { spool, strand, hole, end, box: strand.geometry.boundingBox as THREE.Box3 }
}

/** The strand's last point: the tube's final ring of vertices, averaged. */
function strandTip (strand: THREE.Mesh): THREE.Vector3 {
  const pos = strand.geometry.getAttribute('position')
  const tip = new THREE.Vector3()
  for (let i = pos.count - 9; i < pos.count - 1; i++) tip.add(new THREE.Vector3().fromBufferAttribute(pos, i))
  return tip.multiplyScalar(1 / 8)
}

describe('the accurate model\'s filament path', () => {
  it('ends in the small round hole in the wall just round from the knob', () => {
    const { strand } = strandOf()
    const tip = strandTip(strand)
    // The end sits in the hole's bore: on its axis, a little inside the wall's face.
    const rel = tip.clone().sub(WALL_HOLE)
    const depth = -rel.dot(WALL_NORMAL)
    const off = rel.clone().addScaledVector(WALL_NORMAL, depth).length()
    expect(depth).toBeGreaterThan(3)
    expect(depth).toBeLessThan(9)
    expect(off).toBeLessThan(1)
  })

  it('goes in level, along the hole\'s axis, not down from above', () => {
    const { strand } = strandOf()
    const pos = strand.geometry.getAttribute('position')
    const tip = strandTip(strand)
    // A little way back along the strand from its end, it is still level with the hole and out along its normal.
    let before: THREE.Vector3 | null = null
    for (let i = pos.count - 9; i >= 0 && !before; i -= 9) {
      const p = new THREE.Vector3().fromBufferAttribute(pos, i)
      if (p.distanceTo(tip) > 7) before = p
    }
    const run = (before as THREE.Vector3).clone().sub(tip)
    expect(Math.abs(run.y)).toBeLessThan(3)
    expect(run.clone().normalize().dot(WALL_NORMAL)).toBeGreaterThan(0.9)
  })

  it('takes the hole\'s place on the GLB\'s wall, left of the knob: level with it, round the wall from it, and not the fan\'s cup or the deck\'s back', () => {
    const knob = glbScene().getObjectByName('M1_Knob')
    expect(knob).toBeTruthy()
    // The knob node's origin is its axis, at its bottom. The hole is toward the back of it (smaller x), a few centimetres on, near the knob's height.
    const axis = (knob as THREE.Object3D).position
    expect(WALL_HOLE.x).toBeLessThan(axis.x - 25)
    expect(WALL_HOLE.x).toBeGreaterThan(axis.x - 70)
    expect(Math.abs(WALL_HOLE.y - (axis.y + 2))).toBeLessThan(5)
    expect(WALL_HOLE.distanceTo(axis)).toBeLessThan(75)
    // The wall it is in runs 45 degrees to the base: its normal points out the back-left.
    expect(WALL_NORMAL.length()).toBeCloseTo(1)
    expect(WALL_NORMAL.x).toBeLessThan(-0.5)
    expect(WALL_NORMAL.z).toBeGreaterThan(0.5)
    expect(WALL_HOLE.distanceTo(OLD_CUP)).toBeGreaterThan(60)
    expect(WALL_HOLE.distanceTo(OLD_BACK_OF_DECK)).toBeGreaterThan(30)
    // Below the deck, in the wall, not on the deck.
    expect(WALL_HOLE.y).toBeLessThan(-125)
  })

  it('does not reach the round cup beside the screen', () => {
    const { box } = strandOf()
    expect(box.max.x).toBeLessThan(OLD_CUP.x - 25)
  })

  it('has a dark bore behind the hole\'s opening and a marker at the strand\'s end', () => {
    const { hole, end, strand } = strandOf()
    expect(hole.position.distanceTo(WALL_HOLE)).toBeGreaterThan(6)
    expect(hole.position.clone().sub(WALL_HOLE).normalize().dot(WALL_NORMAL)).toBeLessThan(-0.99)
    expect(end.position.distanceTo(strandTip(strand))).toBeLessThan(1)
  })

  it('draws the strand when loaded and the tail when not', () => {
    const { spool, strand } = strandOf()
    const frame = (loaded: boolean) => ({ spool: true, column: { level: 0 }, filament: { loaded, clip: null, t: 0 } }) as never
    spool.apply(frame(true))
    expect(strand.visible).toBe(true)
    spool.apply(frame(false))
    expect(strand.visible).toBe(false)
  })
})
