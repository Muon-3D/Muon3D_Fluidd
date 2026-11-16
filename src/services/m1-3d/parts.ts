import type { Mesh, Object3D } from 'three'

/**
 * The parts of the M1 a person can point at on the Overview stage
 * (control-mockups/v3/overview-3d): hovering one lights it, names it and
 * leans the camera toward it. This file knows which nodes make each part,
 * and how far the camera may lean (part-light.ts lights them). It sends
 * nothing to the printer, and has no three.js of its own, so the page can
 * use it without loading the viewer.
 */
export type PartId = 'plate' | 'toolhead' | 'filament' | 'screen'

/** In the order Tab, the arrow keys and 1–4 go through them. */
export const PART_IDS: readonly PartId[] = ['plate', 'toolhead', 'filament', 'screen']

export const PART_NAMES: Record<PartId, string> = {
  plate: 'Build plate',
  toolhead: 'Toolhead',
  filament: 'Filament',
  screen: 'Screen'
}

/**
 * Each part's nodes, by name, in the accurate GLB (src/assets/m1/README.md)
 * and in the simple rig built in code. Nodes missing from a model are skipped.
 * The GLB has no spool; `spool` is the accessory the stage adds to both.
 */
export const PART_NODES: Record<PartId, readonly string[]> = {
  plate: ['M1_BuildPlate_Glass', 'glassPlate'],
  toolhead: ['M1_X_Carriage', 'headAssembly'],
  // The accurate model's spool and strand (accurate/spool.ts) are the filament too: pointing at the reel lights it.
  filament: ['M1_Hose', 'conduit', 'spool', 'M1_Spool', 'M1_Filament'],
  screen: ['M1_Panel_Screen', 'M1_Knob', 'display', 'scrollWheel']
}

/** The most the camera leans toward a part: 8° of turn, 5° of tilt, 8% closer. */
export const LEAN_LIMIT = { theta: 8 * Math.PI / 180, phi: 5 * Math.PI / 180, closer: 0.08 }
/** How much of the way toward a part's own bearing the camera turns, before the limit. */
const LEAN_SHARE = 0.35

export interface Lean {
  theta: number;
  phi: number;
  /** 0 = where the person left it, 1 = the full 8% closer. */
  closer: number;
}

export interface Point { x: number, y: number, z: number }

export const NO_LEAN: Lean = { theta: 0, phi: 0, closer: 0 }

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v))
/** The shortest signed turn from a to b, in -π..π. */
const turn = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

/**
 * The lean toward a part at `point`, seen from `target` with the camera at
 * (theta, phi) in the viewer's own angles (x = sin φ sin θ, y = cos φ,
 * z = sin φ cos θ). Small and bounded, so it always returns exactly.
 */
export function leanToward (point: Point, target: Point, theta: number, phi: number): Lean {
  const d = { x: point.x - target.x, y: point.y - target.y, z: point.z - target.z }
  const length = Math.hypot(d.x, d.y, d.z)
  if (length < 1e-3) return { theta: 0, phi: 0, closer: 1 }
  const bearing = Math.atan2(d.x, d.z)
  const elevation = Math.acos(Math.max(-1, Math.min(1, d.y / length)))
  return {
    theta: clamp(turn(theta, bearing) * LEAN_SHARE, LEAN_LIMIT.theta),
    phi: clamp((elevation - phi) * LEAN_SHARE, LEAN_LIMIT.phi),
    closer: 1
  }
}

/** Every mesh of a part in this model, overlays excluded. */
export function partMeshes (root: Object3D, id: PartId): Mesh[] {
  const meshes: Mesh[] = []
  for (const name of PART_NODES[id]) {
    const node = root.getObjectByName(name)
    node?.traverse(o => {
      const mesh = o as Mesh
      if (mesh.isMesh && !mesh.userData.partOverlay) meshes.push(mesh)
    })
  }
  return meshes
}

/** Which part a mesh belongs to, walking up its parents. */
export function partOf (object: Object3D | null): PartId | null {
  for (let o = object; o; o = o.parent) {
    for (const id of PART_IDS) if (PART_NODES[id].includes(o.name)) return id
  }
  return null
}
