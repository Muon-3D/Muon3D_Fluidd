import * as THREE from 'three'
import { Y_TOWARD_FRONT } from '@/services/machine/orientation'
import type { ModelPlacement } from '../pose'
import { GLASS_ORDER } from '../glass-material'
import { bindNodes } from './node-binding'
import { ACCURATE_M1 } from './node-config'
import { ACCURATE_RIG } from './klipper-map'
import { createPoser } from './tube'

/**
 * The loaded accurate M1 as the viewer drives it: the head and the bed
 * posed by node name (node-binding.ts), a group for the print that rides on
 * the plate, and the glass either as the asset's transmissive material or,
 * on a phone, as a plain transparent one.
 *
 * Not driven, for want of a data source: the arm's fold (`M1_Arm`) and the
 * knob's spin (`M1_Knob`) stay at rest, and the hoses and belts are frozen
 * at the rest pose in the asset itself. The plate coming off, the hose's end,
 * the spool and the filament (accessory-parts.ts) are the simple model's.
 */
export interface AccurateRig {
  root: THREE.Object3D;
  /** The print, the loose lines and the touches hang here; it rides on the plate. */
  cargo: THREE.Group;
  /** Print coordinates (x from the plate's left edge, y from its back edge toward the front, z down from its underside) to the cargo's space. */
  printFrame: THREE.Matrix4;
  /** Config names the GLB lacks; the model is wrong until this is empty. */
  missing: string[];
  /** Poses the nodes, then the tube (tube.ts), when the placement changed. */
  place: (placement: ModelPlacement) => void;
  /** Swaps the transmissive glass for a plain transparent one. Returns whether anything changed. */
  useCheapGlass: () => boolean;
}

/** How much of the scene shows through the plate when it is plain transparent. */
const CHEAP_GLASS_OPACITY = 0.2

export function buildAccurateRig (scene: THREE.Group): AccurateRig {
  const bindings = bindNodes(scene, ACCURATE_M1)
  const cargo = new THREE.Group()
  cargo.name = 'M1_Cargo'
  scene.add(cargo)

  const glass: Array<{ mesh: THREE.Mesh, material: THREE.MeshPhysicalMaterial }> = []
  scene.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const material = mesh.material as THREE.MeshPhysicalMaterial
    const see = material.transmission > 0
    // The glass takes shadows but casts none; the rest of the machine does both.
    mesh.castShadow = !see
    mesh.receiveShadow = true
    if (see) glass.push({ mesh, material })
  })

  const bed = ACCURATE_M1.bedHeight
  const front = Y_TOWARD_FRONT
  const printFrame = new THREE.Matrix4().set(
    1, 0, 0, -ACCURATE_RIG.plateHalfX,
    0, 0, -1, -ACCURATE_RIG.plateThickness,
    0, front ? 1 : -1, 0, front ? -ACCURATE_RIG.plateHalfZ : ACCURATE_RIG.plateHalfZ,
    0, 0, 0, 1
  )

  const pose = createPoser(p => {
    bindings.apply({ headX: p.headX, headZ: p.headZ, z: p.z })
    // The plate's top, where the bed node puts it: the cargo is the plate's.
    cargo.position.y = (p.z + (bed.zero ?? 0)) * bed.travel * ACCURATE_M1.scale
  })

  let cheap = false
  return {
    root: scene,
    cargo,
    printFrame,
    missing: bindings.missing,
    place: pose,
    useCheapGlass () {
      if (cheap) return false
      cheap = true
      for (const { mesh, material } of glass) {
        material.transmission = 0
        material.thickness = 0
        material.transparent = true
        material.opacity = CHEAP_GLASS_OPACITY
        material.depthWrite = false
        material.needsUpdate = true
        mesh.renderOrder = GLASS_ORDER
      }
      return true
    }
  }
}
