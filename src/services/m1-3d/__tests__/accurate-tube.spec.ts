import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { AccessoryFrame } from '../accessory-motion'
import {
  buildAccurateAccessories,
  ACCURATE_CONNECTOR_MESH,
  CONNECTOR_FROM_Z,
  SOCKET_CAP_NODE,
  splitConnector
} from '../accurate/accessories'

/** The GLB's toolhead end, cut down: the carriage with its sleeve (socket inside, connector outside) and the hose's joints. */
function scene (options: { crossing?: boolean; headZ?: number } = {}) {
  const root = new THREE.Group()
  // Neither the scene nor the carriage sits at the origin, as in the app.
  root.position.set(13, -4, 9)
  const m1 = new THREE.Group()
  m1.name = 'M1'
  root.add(m1)
  const base = new THREE.Mesh(new THREE.BoxGeometry(260, 60, 380), new THREE.MeshStandardMaterial())
  base.name = 'M1_Base'
  base.position.set(0, -130, 50)
  const hoseBase = new THREE.Object3D()
  hoseBase.name = 'hose_base'
  hoseBase.position.set(-130, -130, 90)
  const gantry = new THREE.Group()
  gantry.name = 'M1_Y_Gantry'
  const carriage = new THREE.Group()
  carriage.name = 'M1_X_Carriage'
  carriage.position.set(6, 3, 0)
  const hoseHead = new THREE.Object3D()
  hoseHead.name = 'hose_head'
  hoseHead.position.set(-8 - 6, -87 - 3, options.headZ ?? 115)
  // One mesh, as in the GLB: a socket at Z 73 to 86 and a connector at Z 87 to 127.
  const sleeveGeometry = new THREE.BufferGeometry()
  const boxes = [[73, 86], [87, 127]]
  const positions: number[] = []
  const indices: number[] = []
  boxes.forEach(([z0, z1], k) => {
    const o = positions.length / 3
    for (const z of [z0, z1]) for (const [x, y] of [[-20, -97], [5, -97], [5, -77], [-20, -77]]) positions.push(x - 6, y - 3, z)
    for (const [a, b, c] of [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1], [3, 2, 6], [3, 6, 7], [0, 3, 7], [0, 7, 4], [1, 5, 6], [1, 6, 2]]) indices.push(o + a, o + b, o + c)
    expect(k).toBeLessThan(2)
  })
  if (options.crossing) {
    // Long wall triangles from inside the socket to inside the connector, across the cut plane, as the GLB's sleeve wall has.
    const o = positions.length / 3
    for (const z of [80, 100]) for (const x of [-20, 5]) positions.push(x - 6, -97 - 3, z)
    indices.push(o, o + 1, o + 3, o, o + 3, o + 2)
  }
  sleeveGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  sleeveGeometry.setIndex(indices)
  const sleeve = new THREE.Mesh(sleeveGeometry, new THREE.MeshStandardMaterial())
  sleeve.name = ACCURATE_CONNECTOR_MESH
  carriage.add(sleeve, hoseHead)
  gantry.add(carriage)
  m1.add(base, hoseBase, gantry)
  root.updateMatrixWorld(true)
  return { root, carriage, hoseHead, sleeve }
}

const frame = (attached: boolean, clip: 'detach' | 'attach' | null = null, t = 0): AccessoryFrame => ({
  plate: { on: true, clip: null, t: 0, carriesPrint: false },
  tube: { attached, clip, t, unlocking: false },
  column: { state: 'locked', level: 0, clip: null },
  filament: { loaded: false, clip: null, t: 0, autoLoad: null, autoLoadAge: 0 },
  spool: true
}) as unknown as AccessoryFrame

/** The same box in the scene's own frame (the root is not at the origin), where the cut plane is. */
function sceneBox (root: THREE.Object3D, mesh: THREE.Mesh): THREE.Box3 {
  root.updateMatrixWorld(true)
  return worldBox(mesh).applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert())
}

/** The box round the vertices the mesh's triangles use, in the scene (the parts share one vertex buffer, so the geometry's own box is of all of it). */
function worldBox (mesh: THREE.Mesh): THREE.Box3 {
  mesh.updateWorldMatrix(true, false)
  const box = new THREE.Box3()
  const position = mesh.geometry.getAttribute('position')
  const at = new THREE.Vector3()
  for (const i of mesh.geometry.index!.array) box.expandByPoint(at.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld))
  return box
}

describe('the toolhead removed: the tube connector goes out with the hose', () => {
  it('cuts the connector out of the sleeve, leaving the socket in the toolhead', () => {
    const { root, sleeve } = scene()
    const connector = splitConnector(root, sleeve)!
    expect(connector).toBeTruthy()
    expect(sceneBox(root, connector).min.z).toBeGreaterThanOrEqual(CONNECTOR_FROM_Z)
    expect(sceneBox(root, sleeve).max.z).toBeLessThan(CONNECTOR_FROM_Z)
    expect(connector.parent).toBe(sleeve.parent)
  })

  it('has the connector seated while attached, and out of the toolhead, with the hose end, once detached', () => {
    const { root, carriage, hoseHead, sleeve } = scene()
    const acc = buildAccurateAccessories(root, new THREE.Group())
    expect(acc.missing).not.toContain(ACCURATE_CONNECTOR_MESH)
    const connector = carriage.children.find(c => c.name.startsWith('M1_TubeConnector')) as THREE.Mesh
    const seated = worldBox(connector).clone()
    const end0 = hoseHead.getWorldPosition(new THREE.Vector3())

    acc.apply(frame(true), false)
    root.updateMatrixWorld(true)
    expect(worldBox(connector).min.distanceTo(seated.min)).toBeLessThan(1e-6)

    acc.apply(frame(false), false)
    root.updateMatrixWorld(true)
    const end1 = hoseHead.getWorldPosition(new THREE.Vector3())
    const shift = end1.clone().sub(end0)
    expect(shift.length()).toBeGreaterThan(60)
    // The connector moved by the same shift as the hose's end: one piece.
    expect(worldBox(connector).min.clone().sub(seated.min).distanceTo(shift)).toBeLessThan(1e-4)
    // Nothing of it is left in the toolhead: it is clear of the socket that stays.
    expect(worldBox(connector).intersectsBox(worldBox(sleeve))).toBe(false)
    expect(worldBox(connector).min.distanceTo(seated.min)).toBeGreaterThan(60)
  })

  it('is settled and static once detached: the same frame twice places nothing differently', () => {
    const { root, hoseHead, carriage } = scene()
    const acc = buildAccurateAccessories(root, new THREE.Group())
    const connector = carriage.children.find(c => c.name.startsWith('M1_TubeConnector')) as THREE.Mesh
    acc.apply(frame(false), false)
    const a = [hoseHead.position.clone(), connector.position.clone()]
    acc.apply(frame(false), false)
    expect(hoseHead.position.distanceTo(a[0])).toBe(0)
    expect(connector.position.distanceTo(a[1])).toBe(0)
  })

  it('rests the free end on the table, clear of the base, so it does not read as still attached at the chassis', () => {
    const { root, hoseHead } = scene()
    const acc = buildAccurateAccessories(root, new THREE.Group())
    acc.apply(frame(false), false)
    root.updateMatrixWorld(true)
    const end = hoseHead.getWorldPosition(new THREE.Vector3())
    const fitting = root.getObjectByName('hose_base')!.getWorldPosition(new THREE.Vector3())
    expect(Math.hypot(end.x - fitting.x, end.z - fitting.z)).toBeGreaterThan(60)
    expect(end.y).toBeLessThan(-140)
  })

  it('puts the connector back and finishes seated after the attach clip', () => {
    const { root, hoseHead, carriage } = scene()
    const acc = buildAccurateAccessories(root, new THREE.Group())
    const connector = carriage.children.find(c => c.name.startsWith('M1_TubeConnector')) as THREE.Mesh
    const rest = hoseHead.position.clone()
    acc.apply(frame(false), false)
    acc.apply(frame(true, 'attach', 0.5), false)
    acc.apply(frame(true), false)
    expect(hoseHead.position.distanceTo(rest)).toBeLessThan(1e-6)
    expect(connector.position.length()).toBeLessThan(1e-6)
  })
})

describe('the toolhead removed: faces across the cut, the socket cap and the guard', () => {
  it('moves faces that cross the cut plane with the connector, leaving none of them on the socket', () => {
    const { root, sleeve } = scene({ crossing: true })
    const connector = splitConnector(root, sleeve)!
    // Nothing of the socket reaches the plane; the crossing wall (Z 80 to 100) is in the connector.
    expect(sceneBox(root, sleeve).max.z).toBeLessThan(CONNECTOR_FROM_Z)
    expect(sceneBox(root, connector).min.z).toBeCloseTo(80, 4)
    expect(sleeve.geometry.index!.count + connector.geometry.index!.count).toBe(36 * 2 + 6)
  })

  it('closes the socket mouth with a dark disc at the cut plane, once, that stays put with the toolhead', () => {
    const { root, carriage, sleeve } = scene({ crossing: true })
    const acc = buildAccurateAccessories(root, new THREE.Group())
    const caps = carriage.children.filter(c => c.name === SOCKET_CAP_NODE) as THREE.Mesh[]
    expect(caps).toHaveLength(1)
    const cap = caps[0]
    const box = sceneBox(root, cap)
    expect(box.min.z).toBeCloseTo(CONNECTOR_FROM_Z, 4)
    expect(box.max.z).toBeCloseTo(CONNECTOR_FROM_Z, 4)
    // It covers the sleeve's mouth (25 by 20 mm, so about a 12.5 mm radius).
    const mouth = sceneBox(root, sleeve)
    expect(box.getCenter(new THREE.Vector3()).x).toBeCloseTo(mouth.getCenter(new THREE.Vector3()).x, 3)
    expect(box.getSize(new THREE.Vector3()).x).toBeGreaterThan(20)
    expect(((cap.material as THREE.MeshStandardMaterial).color.getHex())).toBeLessThan(0x202020)
    // Not rebuilt per frame, and it does not travel with the hose.
    const before = cap.matrix.clone()
    acc.apply(frame(false), false)
    acc.apply(frame(true, 'attach', 0.4), false)
    expect(carriage.children.filter(c => c.name === SOCKET_CAP_NODE)).toHaveLength(1)
    expect(cap.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(before))).toBe(0)
  })

  it('skips the cut and warns when the cut piece is far from the hose head, leaving the model as it was', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { root, carriage, sleeve } = scene({ headZ: 30 })
      const count = sleeve.geometry.index!.count
      const acc = buildAccurateAccessories(root, new THREE.Group())
      expect(warn).toHaveBeenCalled()
      expect(acc.missing).toContain(ACCURATE_CONNECTOR_MESH)
      expect(sleeve.geometry.index!.count).toBe(count)
      expect(carriage.children.some(c => c.name.startsWith('M1_TubeConnector'))).toBe(false)
      expect(carriage.children.some(c => c.name === SOCKET_CAP_NODE)).toBe(false)
      expect(() => { acc.apply(frame(false), false); acc.apply(frame(true), false) }).not.toThrow()
    } finally {
      warn.mockRestore()
    }
  })
})
