import * as THREE from 'three'
import type { AccessoryFrame } from '../accessory-motion'

/**
 * The spool on the back of the accurate M1 and the filament off it, which the
 * GLB lacks (it is the exterior only). As on the real printer (Jack, 9 Nov),
 * one 1 kg spool hangs on the ring at the back of the Z column with its near
 * flange in the top clip; the filament leaves the bottom of the wound
 * filament, comes down the outside of the base's back-left wall and goes into
 * the small round hole in that wall just round from the knob (WALL_HOLE; Jack,
 * 11 Nov: the filament goes in there, not the round cup beside the screen,
 * which is the fan, and not the back of the deck). The
 * load and unload clips play as on the simple model (accessory-parts.ts): the
 * reel turns as the strand comes off it to the hole, and the end is held in
 * a hole in the outer flange while unloaded.
 *
 * Places are in the M1 node's own millimetres, read off the GLB: x toward the
 * front (the column's back face is at -141.3), y up (the deck at -107), z
 * toward the left.
 */
export const ACCURATE_SPOOL_NODES = {
  spool: 'M1_Spool',
  reel: 'M1_SpoolReel',
  strand: 'M1_Filament',
  hole: 'M1_FilamentHole',
  /** A marker on the strand's last point, for the page to see where the end is drawn. */
  end: 'M1_FilamentEnd'
} as const

export interface AccurateSpool {
  /** Shows the strand and the tail for `frame`, and the spool when it is mounted. */
  apply: (frame: AccessoryFrame) => void;
  /** Shown or hidden by the page, as on the simple model. */
  setShown: (shown: boolean) => void;
  /** The loaded filament's colour, on the wound filament, the strand and the tail. */
  setColour: (colour: number) => void;
  /** Whether the spool is drawn now. */
  shown: () => boolean;
  /** The colour the wound filament is drawn in now, 0xRRGGBB. */
  colour: () => number;
}

/** The ring the spool hangs on, at the back of the column, and the column's back face there. */
const RING = new THREE.Vector3(-140.2, -6.9, 0)
const COLUMN_BACK = -141.3
/** A 1 kg spool: 200 mm flanges 4 mm thick, 64 mm across them, wound to 158 mm on a 56 mm hub. */
const FLANGE_R = 100
const FLANGE_T = 4
const HALF_WIDTH = 32
const WOUND_R = 79
const HUB_R = 28
/** Clear of the column's back face, so the near flange sits in the clip. */
const GAP = 1.5
/** The end's hole in the outer flange, and the filament's radius (1.75 mm). */
const HOLE_R = 88
const FILAMENT_R = 0.875
const DECK_Y = -107
/**
 * Where the filament goes in: the small round hole in the base's back-left
 * wall, a little round from the knob (found on the GLB's wall by looking down
 * its normal and casting rays: the hole is about 4 mm across in a 6 mm
 * countersink, 11 Nov). The wall stands at 45 degrees to the base's axes; its
 * outward normal is WALL_NORMAL. The strand's last point, the dark bore it goes
 * into and the end marker all come from these, so one edit moves them together.
 */
export const WALL_HOLE = new THREE.Vector3(-39.6, -137.2, 98.8)
export const WALL_NORMAL = new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2)
/** The hole's bore radius: a little over the filament's 1.75 mm. */
const HOLE_BORE_R = 2.1
/** How far into the wall the strand's end goes, and where the dark bore sits behind the opening. */
const END_DEPTH = 6
const BORE_DEPTH = 8
/** The column this far out (its lever up, proud of the socket) still has the strand on it. */
const STRAND_COLUMN_LEVEL = 0.2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const TAIL_SEGS = 24
const STRAND_SEGS = 160
const RADIAL = 8

function drawn (mesh: THREE.Mesh, segments: number, share: number) {
  const n = Math.round(clamp01(share) * segments)
  mesh.geometry.setDrawRange(0, n * RADIAL * 6)
  mesh.visible = n > 0
}

/**
 * Builds the spool on the column (it rides with it when the column is lifted
 * out) and the strand on the base. `root` is the loaded GLB's scene.
 */
export function buildAccurateSpool (root: THREE.Object3D): AccurateSpool {
  const m1 = root.getObjectByName('M1') ?? root
  const column = root.getObjectByName('M1_Arm')
  m1.updateMatrixWorld(true)

  const cardboard = new THREE.MeshStandardMaterial({ name: 'M1_Spool_Cardboard', color: 0xa88b66, roughness: 0.92, metalness: 0, envMapIntensity: 0.6 })
  const filament = new THREE.MeshPhysicalMaterial({ name: 'M1_Filament', color: 0xc00a66, roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.7 })
  const dark = new THREE.MeshStandardMaterial({ name: 'M1_Spool_Dark', color: 0x1a1b1d, roughness: 0.6, metalness: 0.2 })

  // The spool's axis runs out of the column's back (-x); cylinders are built along y and turned onto it.
  const spool = new THREE.Group()
  spool.name = ACCURATE_SPOOL_NODES.spool
  const centreX = COLUMN_BACK - GAP - FLANGE_T - HALF_WIDTH + FLANGE_T / 2
  spool.position.set(centreX, RING.y, RING.z)
  spool.rotation.z = -Math.PI / 2
  const reel = new THREE.Group()
  reel.name = ACCURATE_SPOOL_NODES.reel
  spool.add(reel)
  const part = (geometry: THREE.BufferGeometry, material: THREE.Material, y = 0) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = y
    mesh.castShadow = true
    mesh.receiveShadow = true
    reel.add(mesh)
    return mesh
  }
  // In the spool's frame +y is toward the column (the near flange), -y away from it.
  const flange = new THREE.CylinderGeometry(FLANGE_R, FLANGE_R, FLANGE_T, 72, 1)
  part(flange, cardboard, HALF_WIDTH - FLANGE_T / 2)
  part(flange, cardboard, -HALF_WIDTH + FLANGE_T / 2)
  part(new THREE.CylinderGeometry(WOUND_R, WOUND_R, 2 * HALF_WIDTH - 2 * FLANGE_T, 64, 1, true), filament)
  part(new THREE.CylinderGeometry(HUB_R, HUB_R, 2 * HALF_WIDTH + 0.4, 40, 1, true), cardboard)
  // The peg it hangs on, through the hub from the ring, with a nut on its end.
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 2 * HALF_WIDTH + GAP + 8, 28), dark)
  peg.position.y = (GAP + 8) / 2
  peg.castShadow = true
  spool.add(peg)
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 5, 6), dark)
  nut.position.y = -HALF_WIDTH - 4
  spool.add(nut)

  // Unloaded, the end is held in a hole in the outer flange.
  const holeAngle = -Math.PI * 0.62
  const onFlange = (r: number, a: number, y: number) => new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a))
  const outer = -HALF_WIDTH
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, FLANGE_T + 0.6, 16), dark)
  hole.position.copy(onFlange(HOLE_R, holeAngle, outer + FLANGE_T / 2))
  reel.add(hole)
  const a0 = holeAngle - 0.42
  const tailCurve = new THREE.CatmullRomCurve3([
    onFlange(WOUND_R, a0, outer + 18),
    onFlange(WOUND_R + 3, a0 + 0.22, outer + 10),
    onFlange(HOLE_R, holeAngle, outer + FLANGE_T + 3),
    onFlange(HOLE_R, holeAngle, outer - 3.2)
  ])
  const strandMaterial = new THREE.MeshPhysicalMaterial({ name: 'M1_Filament_Strand', color: 0xc00a66, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4 })
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, TAIL_SEGS, FILAMENT_R, RADIAL, false), strandMaterial)
  reel.add(tail)

  m1.add(spool)
  spool.updateMatrixWorld(true)
  // Off the bottom of the wound filament on the left, down the outside of the back-left wall and straight into its hole.
  const leave = new THREE.Vector3(centreX + 12, RING.y - WOUND_R * 0.9, RING.z + WOUND_R * 0.42)
  const along = (out: number, y: number) => WALL_HOLE.clone().addScaledVector(WALL_NORMAL, out).setY(y)
  const strandEnd = WALL_HOLE.clone().addScaledVector(WALL_NORMAL, -END_DEPTH)
  const strandCurve = new THREE.CatmullRomCurve3([
    leave,
    new THREE.Vector3(-150, DECK_Y + 3, 62),
    along(26, WALL_HOLE.y + 8),
    along(9, WALL_HOLE.y + 0.8),
    along(2, WALL_HOLE.y),
    strandEnd
  ], false, 'centripetal')
  const strand = new THREE.Mesh(new THREE.TubeGeometry(strandCurve, STRAND_SEGS, FILAMENT_R, RADIAL, false), strandMaterial)
  strand.name = ACCURATE_SPOOL_NODES.strand
  // The hole: a black bore behind its opening, which the exterior-only GLB leaves see-through, with the strand going into it.
  const faceWall = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), WALL_NORMAL)
  const grommet = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_BORE_R, HOLE_BORE_R, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }))
  grommet.name = ACCURATE_SPOOL_NODES.hole
  grommet.position.copy(WALL_HOLE).addScaledVector(WALL_NORMAL, -BORE_DEPTH)
  grommet.quaternion.copy(faceWall)
  m1.add(grommet)
  const end = new THREE.Object3D()
  end.name = ACCURATE_SPOOL_NODES.end
  end.position.copy(strandEnd)
  m1.add(end)
  strand.castShadow = true
  m1.add(strand)
  const strandTurn = strandCurve.getLength() / WOUND_R

  // On the column, so it is carried with it.
  column?.attach(spool)

  let pageShown = true
  let mounted = true
  return {
    apply (frame) {
      mounted = frame.spool
      spool.visible = pageShown && mounted
      const { clip, loaded, t } = frame.filament
      let strandShare = loaded ? 1 : 0
      let tailShare = loaded ? 0 : 1
      if (clip === 'load') {
        tailShare = 1 - easeInOut(seg(t, 0, 0.12))
        strandShare = easeInOut(seg(t, 0.12, 0.6))
      } else if (clip === 'unload') {
        strandShare = 1 - easeInOut(seg(t, 0.36, 0.85))
        tailShare = easeInOut(seg(t, 0.85, 1))
      }
      reel.rotation.y = strandTurn * strandShare
      drawn(tail, TAIL_SEGS, tailShare)
      drawn(strand, STRAND_SEGS, strandShare)
      // The strand runs from the spool on the column: off with the column, or without the spool, it isn't drawn.
      strand.visible = strand.visible && spool.visible && frame.column.level < STRAND_COLUMN_LEVEL
    },
    setShown (shown) {
      pageShown = shown
      spool.visible = pageShown && mounted
    },
    setColour (colour) {
      filament.color.setHex(colour)
      strandMaterial.color.setHex(colour)
    },
    shown: () => spool.visible,
    colour: () => filament.color.getHex()
  }
}
