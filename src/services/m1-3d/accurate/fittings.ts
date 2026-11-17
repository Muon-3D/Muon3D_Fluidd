import * as THREE from 'three'
import { GLASS_ORDER } from '../glass-material'

/**
 * Small fittings the accurate M1's GLB leaves out: the plug in the power
 * socket on the back-right wall (the gutted asset shows straight through the
 * opening), and the print on the plate's top (black MUON3D in the middle, the
 * hot-surface warning by the near edge). Places are in the M1 node's own
 * millimetres (see spool.ts).
 */
export const ACCURATE_FITTING_NODES = {
  plug: 'M1_PowerPlug',
  plateDecal: 'M1_PlateDecal'
} as const

/** The socket: its middle on the back-right wall, and the wall's outward normal there. */
const SOCKET = new THREE.Vector3(-91, -128, -47.5)
const WALL_OUT = new THREE.Vector3(-1, 0, -1).normalize()
/**
 * The opening's outline, measured off the GLB straight on to the wall: for
 * each height v (mm, up), how far it runs along the wall each side (u, toward
 * the right corner). Round at the bottom, coming to a point at the top.
 */
const OPENING: ReadonlyArray<readonly [number, number, number]> = [
  [-9.5, -5.5, 5.5], [-6, -5.5, 5.5], [-5.5, -7, 7], [-5, -8, 8], [-4.5, -8.5, 8.5], [-4, -9, 9],
  [-3, -9.5, 9.5], [-2, -10, 10], [-1, -10, 10.5], [0, -10, 10], [1, -10, 10], [2, -9.5, 9.5],
  [3, -8.5, 9], [4, -7.5, 8], [5, -6.5, 7], [6, -5.5, 6], [7, -4.5, 5], [8, -3.5, 4], [9, -2, 2.5], [9.5, -0.5, 0.5]
]
/** The plug stands this proud of the wall, and goes this far into it. */
const PROUD = 0.6
const DEPTH = 4
/** The measurement's half step: the outline is taken out to the opening's edge. */
const EDGE = 0.25

function openingShape (inset = 0): THREE.Shape {
  const shape = new THREE.Shape()
  // Drawn in (-u, v), so the shape's own z comes out of the wall (see the basis below).
  const right = OPENING.map(([v, , u]) => new THREE.Vector2(-(u + EDGE - inset), v))
  const left = [...OPENING].reverse().map(([v, u]) => new THREE.Vector2(-(u - EDGE + inset), v))
  const top = OPENING[OPENING.length - 1][0] + EDGE - inset
  const bottom = OPENING[0][0] - EDGE + inset
  shape.moveTo(right[0].x, bottom)
  for (const p of right) shape.lineTo(p.x, p.y)
  shape.lineTo(0, top)
  for (const p of left) shape.lineTo(p.x, p.y)
  shape.lineTo(left[left.length - 1].x, bottom)
  shape.closePath()
  return shape
}

/** The plug in the power socket, on the base. Returns it, or null without the base. */
export function buildPowerPlug (root: THREE.Object3D): THREE.Object3D | null {
  const m1 = root.getObjectByName('M1') ?? root
  const base = root.getObjectByName('M1_Base')
  if (!base) return null
  m1.updateMatrixWorld(true)
  const rubber = new THREE.MeshStandardMaterial({ name: 'M1_PowerPlug', color: 0x1b1c1e, roughness: 0.72, metalness: 0 })
  const plug = new THREE.Group()
  plug.name = ACCURATE_FITTING_NODES.plug
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(openingShape(), { depth: DEPTH, bevelEnabled: false, curveSegments: 4 }), rubber)
  body.position.z = PROUD - DEPTH
  // A raised grip across its face.
  const grip = new THREE.Mesh(new THREE.BoxGeometry(11, 2.2, 1.2), rubber)
  grip.position.set(0, 0.5, PROUD + 0.5)
  for (const mesh of [body, grip]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
    plug.add(mesh)
  }
  const along = new THREE.Vector3(1, 0, -1).normalize()
  plug.matrix.makeBasis(along.clone().negate(), new THREE.Vector3(0, 1, 0), WALL_OUT).setPosition(SOCKET)
  plug.matrix.decompose(plug.position, plug.quaternion, plug.scale)
  m1.add(plug)
  base.attach(plug)
  return plug
}

/**
 * The print on the plate's top, a decal just over the glass that rides with
 * it. The GLB's own logo print (a light wordmark by the front edge) is hidden
 * in its favour; its node stays. `canvas` is the simple model's plate graphic
 * (02-materials.js glassDecal), 200 by 180 with its top at the column.
 */
export function buildPlateDecal (root: THREE.Object3D, canvas: HTMLCanvasElement | null): THREE.Object3D | null {
  const m1 = root.getObjectByName('M1') ?? root
  const plate = root.getObjectByName('M1_BuildPlate_Glass')
  if (!plate || !canvas) return null
  m1.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(plate).applyMatrix4(m1.matrixWorld.clone().invert())
  const size = box.getSize(new THREE.Vector3())
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const material = new THREE.MeshBasicMaterial({ name: 'M1_PlateDecal', map: texture, transparent: true, depthWrite: false, toneMapped: false })
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(size.z - 1.2, size.x - 1.2), material)
  decal.name = ACCURATE_FITTING_NODES.plateDecal
  decal.renderOrder = GLASS_ORDER + 2
  // The canvas's top toward the column (-x), its face up, so it reads left to right from the front.
  decal.matrix.makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0))
    .setPosition(box.getCenter(new THREE.Vector3()).setY(box.max.y + 0.05))
  decal.matrix.decompose(decal.position, decal.quaternion, decal.scale)
  m1.add(decal)
  plate.attach(decal)
  plate.traverse(o => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh && mesh !== decal && ([] as THREE.Material[]).concat(mesh.material).some(m => m.name === 'M1_Logo-Print')) mesh.visible = false
  })
  return decal
}
