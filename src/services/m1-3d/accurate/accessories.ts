import * as THREE from 'three'
import { PLATE_RETURN_PRINT_MS, type AccessoryFrame, type PlateClip } from '../accessory-motion'

/**
 * What comes and goes on the accurate M1 (the GLB), drawn from the same
 * timeline as the simple model's (accessory-motion.ts): the glass plate off
 * onto the table and back, the hose's end out of the toolhead and back, and
 * the Z column (the stem the bed rides on) lifted out of its socket and set
 * down beside the printer, and back. Each is done by moving a node the GLB
 * already has, so nothing is drawn that the asset doesn't model.
 *
 * Not drawn, for want of geometry: the spool and the filament (the asset is
 * the exterior only, with no spool and no strand), and the fans (the deck fan
 * is part of `M1_Base`'s one mesh; there is no part fan).
 *
 * The M1 prints upside down: the print hangs under the plate. So the plate is
 * turned over to set it down face up, and turned back to go on, which is
 * when a print still on it falls off.
 */
export const ACCURATE_ACCESSORY_NODES = {
  /** The Z column: the spine, carrying the bed lift and the plate. */
  column: 'M1_Arm',
  /** The bed lift; the plate is its child. */
  bed: 'M1_Z_Stage',
  plate: 'M1_BuildPlate_Glass',
  /** The hose's skin joint at the head end (a child of the carriage), and at the chassis. */
  hoseHead: 'hose_head',
  hoseBase: 'hose_base'
} as const

export interface AccurateAccessories {
  /** Places the plate, the hose's end and the column for `frame`. */
  apply: (frame: AccessoryFrame, partGone: boolean) => void;
  /** How far anything is off the printer now (0 to 1), for the stage to make room. */
  plateOff: () => number;
  /** The box round the plate and the column set down beside the printer, in world space. */
  offBox: THREE.Box3;
  /** Node names the GLB lacks; those parts stay still. */
  missing: string[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

/** Off the clamp: the plate slides toward the front before it is lifted away. */
const SLIDE_MM = 58
/** On the table beside the printer, this far clear of it. */
const OFF_CLEARANCE = 30
/** A print falls this fast, stylised (mm/s²), and is gone after this long. */
const FALL_MM_S2 = 700
const FALL_MS = 650
/** Where the falling print lets go, in the return-with-print clip: as the plate turns past the vertical. */
const DROP_AT = 0.33
/** The hose's end: pulled this far out of the head, then let down this far, toward the chassis. */
const PULL_MM = 22
const DROP_MM = 46
const BACK_MM = 34
/** The unlock button held: the hose's end eases out this much. */
const UNLOCK_MM = 3
/** The column comes this far straight up out of its socket before it is carried aside. */
const COLUMN_LIFT_MM = 70

/** A quadratic arc from `a` to `b`, `lift` above the higher of them at its middle. */
function arc (a: THREE.Vector3, b: THREE.Vector3, lift: number, k: number, out: THREE.Vector3) {
  const cx = (a.x + b.x) / 2
  const cy = Math.max(a.y, b.y) + lift
  const cz = (a.z + b.z) / 2
  const s = 1 - k
  return out.set(
    s * s * a.x + 2 * s * k * cx + k * k * b.x,
    s * s * a.y + 2 * s * k * cy + k * k * b.y,
    s * s * a.z + 2 * s * k * cz + k * k * b.z)
}

/**
 * Builds the moving accessories on the loaded GLB at its rest pose. `cargo`
 * (the print and what else hangs from the plate) is moved into the plate's
 * carrier, so it rides with the bed, the column and the plate itself.
 */
export function buildAccurateAccessories (root: THREE.Object3D, cargo: THREE.Object3D): AccurateAccessories {
  const n = ACCURATE_ACCESSORY_NODES
  const find = (name: string) => root.getObjectByName(name) ?? null
  const column = find(n.column)
  const bed = find(n.bed)
  const plate = find(n.plate)
  const hoseHead = find(n.hoseHead)
  const hoseBase = find(n.hoseBase)
  const missing = Object.values(n).filter(name => !find(name))

  root.updateMatrixWorld(true)
  const whole = new THREE.Box3().setFromObject(root)
  // The table is under the base (the hose hangs lower, off the front).
  const baseNode = find('M1_Base')
  const floorY = baseNode ? new THREE.Box3().setFromObject(baseNode).min.y : whole.min.y
  const offBox = new THREE.Box3()
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const rot = new THREE.Quaternion()
  const one = new THREE.Vector3(1, 1, 1)

  // -- the plate ---------------------------------------------------------------
  // A carrier in the bed lift's frame, at identity while the plate is on: the glass and the cargo hang in it.
  let applyPlate: (frame: AccessoryFrame, partGone: boolean) => void = (_frame, partGone) => { cargo.visible = !partGone }
  let plateOffAmount = 0
  if (bed) {
    const carrier = new THREE.Group()
    carrier.name = 'M1_PlateCarrier'
    carrier.matrixAutoUpdate = false
    bed.add(carrier)
    carrier.updateMatrixWorld(true)
    // Without the glass node, the plate is taken as the print area round the bed's middle.
    const plateBox = plate
      ? new THREE.Box3().setFromObject(plate)
      : new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, -2, 0), new THREE.Vector3(200, 4, 180))
    const size = plateBox.getSize(new THREE.Vector3())
    const centreLocal = bed.worldToLocal(plateBox.getCenter(new THREE.Vector3()))
    if (plate) carrier.attach(plate)
    // The cargo hangs at the plate's top, world aligned, while the bed is where the GLB has it.
    cargo.removeFromParent()
    cargo.position.set(0, 0, 0)
    cargo.quaternion.identity()
    cargo.scale.set(1, 1, 1)
    cargo.updateMatrix()
    root.add(cargo)
    cargo.updateMatrixWorld(true)
    carrier.attach(cargo)
    cargo.matrixAutoUpdate = false
    cargo.updateMatrix()
    const cargoRest = cargo.matrix.clone()

    // Face up on the table to the printer's right, its long side along it.
    const offPos = new THREE.Vector3(whole.max.x + OFF_CLEARANCE + size.x / 2, floorY + size.y / 2, 0)
    const level = new THREE.Quaternion()
    const faceUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI)
    const faceDown = level
    offBox.union(new THREE.Box3().setFromCenterAndSize(offPos, size))
    // The print stands on the plate there, up to about the height the printer builds.
    offBox.max.y += 160

    const home = new THREE.Vector3()
    const homeWorld = () => bed.localToWorld(home.copy(centreLocal))

    const platePose = (clip: PlateClip | null, on: boolean, t: number) => {
      const at = homeWorld()
      const slid = tmpA.copy(at).add(new THREE.Vector3(0, 0, SLIDE_MM))
      if (!clip) {
        pos.copy(on ? at : offPos)
        rot.copy(on ? level : faceUp)
      } else if (clip === 'remove') {
        const above = tmpB.copy(offPos).add(new THREE.Vector3(0, 14, 0))
        if (t < 0.22) pos.lerpVectors(at, slid, easeInOut(seg(t, 0, 0.22)))
        else if (t < 0.86) arc(slid, above, 70, easeInOut(seg(t, 0.22, 0.86)), pos)
        else pos.lerpVectors(above, offPos, easeOut(seg(t, 0.86, 1)))
        rot.slerpQuaternions(level, faceUp, easeInOut(seg(t, 0.3, 0.8)))
      } else if (clip === 'return-print') {
        const lifted = tmpB.copy(offPos).add(new THREE.Vector3(0, 110, 0))
        if (t < 0.14) {
          pos.lerpVectors(offPos, lifted, easeOut(seg(t, 0, 0.14)))
          rot.copy(faceUp)
        } else if (t < 0.5) {
          pos.copy(lifted)
          rot.slerpQuaternions(faceUp, faceDown, easeInOut(seg(t, 0.14, 0.5)))
        } else if (t < 0.84) {
          const k = easeInOut(seg(t, 0.5, 0.84))
          arc(lifted, slid, 30, k, pos)
          rot.copy(faceDown)
        } else {
          pos.lerpVectors(slid, at, easeInOut(seg(t, 0.84, 1)))
          rot.copy(level)
        }
      } else {
        const lifted = tmpB.copy(offPos).add(new THREE.Vector3(0, 30, 0))
        if (t < 0.18) {
          pos.lerpVectors(offPos, lifted, easeOut(seg(t, 0, 0.18)))
          rot.copy(faceUp)
        } else if (t < 0.8) {
          const k = easeInOut(seg(t, 0.18, 0.8))
          arc(lifted, slid, 80, k, pos)
          rot.slerpQuaternions(faceUp, level, k)
        } else {
          pos.lerpVectors(slid, at, easeInOut(seg(t, 0.8, 1)))
          rot.copy(level)
        }
      }
    }

    // The carrier's matrix in the bed's frame: the plate's world pose (pos, rot about its middle) taken back through the bed.
    const world = new THREE.Matrix4()
    const toCentre = new THREE.Matrix4()
    const bedInverse = new THREE.Matrix4()
    const carrierMatrix = (out: THREE.Matrix4) => {
      const at = homeWorld()
      world.compose(pos, rot, one).multiply(toCentre.makeTranslation(-at.x, -at.y, -at.z))
      bedInverse.copy(bed.matrixWorld).invert()
      return out.multiplyMatrices(bedInverse, world).multiply(bed.matrixWorld)
    }

    const dropFrom = new THREE.Matrix4()
    const fall = new THREE.Matrix4()
    const inverse = new THREE.Matrix4()
    const worldFall = new THREE.Matrix4()
    applyPlate = (frame, partGone) => {
      const { clip, on, t } = frame.plate
      platePose(clip, on, t)
      carrierMatrix(carrier.matrix)
      carrier.matrixWorldNeedsUpdate = true
      plateOffAmount = !clip ? (on ? 0 : 1) : clip === 'remove' ? easeInOut(t) : 1 - easeInOut(t)

      cargo.matrix.copy(cargoRest)
      let falling = false
      if (clip === 'return-print' && t > DROP_AT) {
        // Let go as the plate turned past the vertical: falling, away from the plate, and gone.
        const seconds = (t - DROP_AT) * PLATE_RETURN_PRINT_MS / 1000
        platePose(clip, on, DROP_AT)
        carrierMatrix(dropFrom)
        fall.makeTranslation(0, -0.5 * FALL_MM_S2 * seconds * seconds, 0)
        // The fall is in world space: through the bed's frame into the carrier's.
        bedInverse.copy(bed.matrixWorld).invert()
        worldFall.multiplyMatrices(bedInverse, fall).multiply(bed.matrixWorld)
        inverse.copy(carrier.matrix).invert()
        cargo.matrix.multiplyMatrices(inverse, worldFall.multiply(dropFrom)).multiply(cargoRest)
        falling = seconds * 1000 < FALL_MS
        platePose(clip, on, t)
      }
      cargo.matrixWorldNeedsUpdate = true
      cargo.visible = clip === 'return-print' ? (t <= DROP_AT || falling) : !partGone
    }
  }

  // -- the hose's end ------------------------------------------------------------
  let applyTube: (frame: AccessoryFrame) => void = () => {}
  if (hoseHead && hoseBase && hoseHead.parent) {
    const head = hoseHead.parent
    const restLocal = hoseHead.position.clone()
    const baseWorld = hoseBase.getWorldPosition(new THREE.Vector3())
    const restWorld = hoseHead.getWorldPosition(new THREE.Vector3())
    // Out of the head along the hose, back toward the chassis.
    const out = new THREE.Vector3().subVectors(baseWorld, restWorld).setY(0).normalize()
    const pulledFrom = new THREE.Vector3()
    const end = new THREE.Vector3()
    // Detached, the end lies where it was let go, below and back from the head's rest.
    const restAt = restWorld.clone().addScaledVector(out, PULL_MM + BACK_MM).add(new THREE.Vector3(0, -DROP_MM, 0))
    applyTube = frame => {
      const { clip, attached, t, unlocking } = frame.tube
      // The end in its boot, wherever the head is now.
      const seated = head.localToWorld(pulledFrom.copy(restLocal))
      let pull = 0
      let away = 0
      if (!clip) {
        pull = attached ? (unlocking ? UNLOCK_MM : 0) : PULL_MM
        away = attached ? 0 : 1
      } else if (clip === 'detach') {
        pull = PULL_MM * easeInOut(seg(t, 0, 0.3))
        away = easeInOut(seg(t, 0.3, 1))
      } else {
        away = 1 - easeInOut(seg(t, 0, 0.65))
        pull = PULL_MM * (1 - easeInOut(seg(t, 0.65, 1)))
      }
      const pulled = seated.addScaledVector(out, pull)
      end.lerpVectors(pulled, restAt, away)
      hoseHead.position.copy(head.worldToLocal(end))
    }
  }

  // -- the Z column ----------------------------------------------------------------
  let applyColumn: (frame: AccessoryFrame) => void = () => {}
  let columnOff = 0
  if (column && column.parent) {
    const parent = column.parent
    const restLocal = column.position.clone()
    const restWorld = column.getWorldPosition(new THREE.Vector3())
    const columnBox = new THREE.Box3().setFromObject(column)
    // Set down standing on the table to the printer's left, clear of it.
    const offset = new THREE.Vector3(
      whole.min.x - OFF_CLEARANCE - columnBox.max.x,
      floorY - columnBox.min.y,
      0)
    offBox.union(columnBox.clone().translate(offset))
    const lifted = new THREE.Vector3(0, COLUMN_LIFT_MM, 0)
    const shift = new THREE.Vector3()
    applyColumn = frame => {
      const level = frame.column.level
      columnOff = level
      // Straight up out of the socket over the first part, then over and down beside the printer.
      const up = COLUMN_LIFT_MM / (COLUMN_LIFT_MM + Math.abs(offset.x))
      if (level <= up) shift.set(0, COLUMN_LIFT_MM * (level / up), 0)
      else arc(lifted, offset, 20, easeInOut((level - up) / (1 - up)), shift)
      column.position.copy(parent.worldToLocal(tmpA.copy(restWorld).add(shift)))
      if (level === 0) column.position.copy(restLocal)
    }
  }

  return {
    missing,
    offBox,
    plateOff: () => Math.max(plateOffAmount, columnOff),
    apply (frame, partGone) {
      // The column first: the bed and the plate ride on it; the head was posed before this.
      root.updateMatrixWorld(true)
      applyColumn(frame)
      column?.updateMatrixWorld(true)
      applyPlate(frame, partGone)
      applyTube(frame)
    }
  }
}
