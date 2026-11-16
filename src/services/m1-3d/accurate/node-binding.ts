import type * as THREE from 'three'
import type { AccurateModelConfig, NodeBinding } from './node-config'

/** The model's state for the moving parts, as viewer.ts's `state` holds it. */
export interface MotionState {
  headX: number;
  headZ: number;
  z: number;
}

interface Bound {
  object: THREE.Object3D;
  binding: NodeBinding;
  rest: number;
}

export interface NodeBindings {
  /** Moves the nodes to the state. */
  apply: (state: MotionState) => void;
  /** Config names the GLB doesn't have; a re-fit is wrong until this is empty. */
  missing: string[];
}

/** Finds each configured node by name in `root` and returns a function that poses them. */
export function bindNodes (root: THREE.Object3D, config: AccurateModelConfig): NodeBindings {
  const missing: string[] = []
  const bound: Record<keyof MotionState, Bound | null> = { headX: null, headZ: null, z: null }
  const roles: Array<[keyof MotionState, NodeBinding]> = [
    ['headX', config.headX],
    ['headZ', config.headZ],
    ['z', config.bedHeight]
  ]
  for (const [role, binding] of roles) {
    const object = root.getObjectByName(binding.node)
    if (!object) {
      missing.push(binding.node)
      continue
    }
    bound[role] = { object, binding, rest: object.position[binding.axis] }
  }
  return {
    missing,
    apply (state) {
      for (const role of Object.keys(bound) as Array<keyof MotionState>) {
        const b = bound[role]
        if (!b) continue
        b.object.position[b.binding.axis] = b.rest + (state[role] + (b.binding.zero ?? 0)) * b.binding.travel * config.scale
      }
    }
  }
}
