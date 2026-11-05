import type { ModelPlacement } from '../pose'

/**
 * The umbilical tube follows the head. It is frozen at the rest pose in the
 * asset today; the animation session is rigging it (segments or bones driven
 * by the carriage, gantry and bed). When that lands its drive goes in
 * `updateTube`, which is called right after the carriage, gantry and bed
 * nodes are posed, and only when one of those values changed. A no-op until then.
 */
export type TubeDrive = (headX: number, headZ: number, bed: number) => void

export const updateTube: TubeDrive = () => {
  /* waits for the tube rig */
}

/**
 * Poses the nodes, then the tube, for a placement; says nothing and does
 * nothing again for one that is the same as the last.
 */
export function createPoser (poseNodes: (p: ModelPlacement) => void, tube: TubeDrive = updateTube) {
  let last: ModelPlacement | null = null
  return (p: ModelPlacement): boolean => {
    if (last && last.headX === p.headX && last.headZ === p.headZ && last.z === p.z) return false
    last = { headX: p.headX, headZ: p.headZ, z: p.z }
    poseNodes(p)
    tube(p.headX, p.headZ, p.z)
    return true
  }
}
