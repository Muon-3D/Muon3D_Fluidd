import * as THREE from 'three'
import { Y_TOWARD_FRONT } from '@/services/machine/orientation'
import type { ModelPlacement } from '../pose'
import { FROSTED_PLATE, GLASS_ORDER } from '../glass-material'
import { bindNodes } from './node-binding'
import { ACCURATE_M1 } from './node-config'
import { ACCURATE_RIG } from './klipper-map'
import { buildAccurateAccessories } from './accessories'
import { buildAccurateLights, type AccurateLights } from './lights'
import type { AccessoryFrame } from '../accessory-motion'
import { m1 } from '../load'
import { buildAccurateSpool, type AccurateSpool } from './spool'
import { buildPlateDecal, buildPowerPlug } from './fittings'

/**
 * The loaded accurate M1 as the viewer drives it: the head and the bed
 * posed by node name (node-binding.ts), a group for the print that rides on
 * the plate, and the glass either as the asset's transmissive material or,
 * on a phone, as a plain transparent one.
 *
 * Not driven, for want of a data source: the arm's fold and the knob's spin
 * (`M1_Knob`) stay at rest, and the belts are frozen at the rest pose in the
 * asset itself. The hose is skinned and follows the head on its own. The
 * plate coming off, the hose's end out of the head and the Z column lifted
 * out are accessories.ts. The GLB has no spool, filament, power plug or plate
 * print; spool.ts and fittings.ts add them.
 */
export interface AccurateRig {
  root: THREE.Object3D;
  /** The print, the loose lines and the touches hang here; it rides on the plate. */
  cargo: THREE.Group;
  /** Print coordinates (x from the plate's left edge, y from its back edge toward the front, z down from its underside) to the cargo's space. */
  printFrame: THREE.Matrix4;
  /** Config names the GLB lacks; the model is wrong until this is empty. */
  missing: string[];
  /** Poses the head, the gantry and the bed; the hose follows by skinning. */
  place: (placement: ModelPlacement) => void;
  /** Places the plate, the hose's end and the Z column for an accessory frame (accessories.ts). */
  apply: (frame: AccessoryFrame, partGone: boolean) => void;
  /** How far the plate or the column is off the printer, 0 to 1, and the box round them there. */
  plateOff: () => number;
  plateOffBox: THREE.Box3;
  /** The LED strip and the round screen (lights.ts). */
  lights: AccurateLights;
  /** Swaps the transmissive glass for a plain transparent one. Returns whether anything changed. */
  useCheapGlass: () => boolean;
  /** The spool on the back and the filament off it (spool.ts). */
  spool: AccurateSpool;
  /** The plug in the power socket (fittings.ts), or null without the base. */
  plug: THREE.Object3D | null;
}

/** How much of the scene shows through the plate when it is plain transparent. */
const CHEAP_GLASS_OPACITY = 0.2

/** The simple model's plate print, if its code is loaded (it is, with the viewer). */
function plateDecalCanvas (): HTMLCanvasElement | null {
  try {
    return m1()?.glassDecal?.(1024) ?? null
  } catch {
    return null
  }
}

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
  for (const { material } of glass) {
    if (material.name !== FROSTED_PLATE.name) continue
    material.roughness = FROSTED_PLATE.roughness
    material.transmission = FROSTED_PLATE.transmission
    material.color.setHex(FROSTED_PLATE.tint)
    material.specularIntensity = FROSTED_PLATE.specular
    material.envMapIntensity = FROSTED_PLATE.reflection
  }

  const front = Y_TOWARD_FRONT
  const printFrame = new THREE.Matrix4().set(
    1, 0, 0, -ACCURATE_RIG.plateHalfX,
    0, 0, -1, -ACCURATE_RIG.plateThickness,
    0, front ? 1 : -1, 0, front ? -ACCURATE_RIG.plateHalfZ : ACCURATE_RIG.plateHalfZ,
    0, 0, 0, 1
  )

  // The hose is skinned to hose_base (fixed) and hose_head (a child of the carriage), so posing the
  // carriage and gantry moves it. The cross-rail belt is skinned the same way, to belt_base (the
  // motor pulleys, fixed) and belt_gantry (a child of the gantry): its rail strand rides with the
  // gantry and the strands back to the motors stretch. three works out a skinned mesh's bounds
  // once, at rest, so neither may be culled.
  for (const name of ['M1_Hose', 'M1_Belt']) scene.getObjectByName(name)?.traverse(o => { o.frustumCulled = false })

  // Built at the rest pose, before the plate moves into its carrier: each is attached to the node it rides with.
  buildPlateDecal(scene, plateDecalCanvas())
  const plug = buildPowerPlug(scene)
  const spool = buildAccurateSpool(scene)

  // Moves the cargo into the plate's carrier, under the bed: it rides with the bed, the plate and the column.
  const accessories = buildAccurateAccessories(scene, cargo)
  if (accessories.missing.length) console.warn(`[m1] the accurate M1 lacks ${accessories.missing.join(', ')}; those parts stay still`)

  const lights = buildAccurateLights(scene)

  let cheap = false
  return {
    lights,
    root: scene,
    cargo,
    printFrame,
    missing: bindings.missing,
    place (p) {
      bindings.apply({ headX: p.headX, headZ: p.headZ, z: p.z })
    },
    spool,
    plug,
    apply (frame, partGone) {
      accessories.apply(frame, partGone)
      spool.apply(frame)
    },
    plateOff: accessories.plateOff,
    plateOffBox: accessories.offBox,
    useCheapGlass () {
      if (cheap) return false
      cheap = true
      for (const { mesh, material } of glass) {
        material.transmission = 0
        material.thickness = 0
        material.transparent = true
        material.opacity = material.name === FROSTED_PLATE.name ? FROSTED_PLATE.cheapOpacity : CHEAP_GLASS_OPACITY
        if (material.name === FROSTED_PLATE.name) material.color.setHex(FROSTED_PLATE.cheapTint)
        material.depthWrite = false
        material.needsUpdate = true
        mesh.renderOrder = GLASS_ORDER
      }
      return true
    }
  }
}
