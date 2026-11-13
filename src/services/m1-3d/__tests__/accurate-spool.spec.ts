import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { ACCURATE_SPOOL_NODES, BACK_HOLE, buildAccurateSpool } from '../accurate/spool'

/** The cup in the deck beside the screen, which the strand used to go into (Jack, 11 Nov: that is the fan). */
const OLD_CUP = new THREE.Vector3(3, -111.1, 51.1)

function strandOf () {
  const root = new THREE.Group()
  const spool = buildAccurateSpool(root)
  const strand = root.getObjectByName(ACCURATE_SPOOL_NODES.strand) as THREE.Mesh
  const hole = root.getObjectByName(ACCURATE_SPOOL_NODES.hole) as THREE.Mesh
  strand.geometry.computeBoundingBox()
  return { spool, strand, hole, box: strand.geometry.boundingBox as THREE.Box3 }
}

describe('the accurate model\'s filament path', () => {
  it('ends in the small hole at the back, down through the deck', () => {
    const { box } = strandOf()
    // The end of the strand is under the hole, below the deck, and the strand reaches no further than it.
    expect(box.min.y).toBeLessThan(BACK_HOLE.y)
    expect(box.containsPoint(new THREE.Vector3(BACK_HOLE.x, BACK_HOLE.y - 5, BACK_HOLE.z))).toBe(true)
  })

  it('does not go to the round cup beside the screen', () => {
    const { box } = strandOf()
    expect(box.max.x).toBeLessThan(OLD_CUP.x - 50)
    expect(BACK_HOLE.distanceTo(OLD_CUP)).toBeGreaterThan(80)
    // The hole is in the back half of the deck (x runs toward the front).
    expect(BACK_HOLE.x).toBeLessThan(-60)
  })

  it('has a grommet at the hole, on the deck', () => {
    const { hole } = strandOf()
    expect(hole.position.x).toBe(BACK_HOLE.x)
    expect(hole.position.z).toBe(BACK_HOLE.z)
    expect(hole.position.y).toBeGreaterThan(BACK_HOLE.y)
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
