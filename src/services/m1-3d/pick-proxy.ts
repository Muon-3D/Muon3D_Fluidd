import * as THREE from 'three'

/**
 * Cheap stand-ins for the parts a person points at, so a hover can be
 * answered on the next frame. The accurate GLB's toolhead is about 110k
 * triangles and its hose about 100k, skinned (every vertex posed by its
 * bones on each test), which cost 6 to over 100 ms a pick. Each mesh gets a
 * coarse copy made by vertex clustering: every vertex in a cell of `cell`
 * world millimetres collapses to one, and the triangles that collapse away
 * go. A few millimetres coarser than the part, and a hundred times cheaper.
 * A skinned mesh's copy keeps its skeleton, so it follows the hose as drawn.
 * Never drawn and never on the GPU.
 */

export interface Clustered {
  /** The source vertices kept, by their index in the source. */
  vertices: Uint32Array;
  /** Triangles over the kept vertices (indices into `vertices`). */
  triangles: Uint32Array;
}

/**
 * Vertex clustering on a triangle list: `positions` as x, y, z triples,
 * `index` the triangles (or null for an unindexed list), `cell` the cell's
 * edge in the positions' own units. Degenerate and repeated triangles are
 * dropped. No three.js, so it is cheap to test.
 */
export function clusterTriangles (positions: ArrayLike<number>, index: ArrayLike<number> | null, cell: number): Clustered {
  const count = Math.floor(positions.length / 3)
  if (!(cell > 0)) throw new Error('cell must be positive')
  const cellOf = new Map<string, number>()
  const rep = new Uint32Array(count)
  const kept: number[] = []
  for (let i = 0; i < count; i++) {
    const key = `${Math.floor(positions[i * 3] / cell)},${Math.floor(positions[i * 3 + 1] / cell)},${Math.floor(positions[i * 3 + 2] / cell)}`
    let k = cellOf.get(key)
    if (k === undefined) {
      k = kept.length
      kept.push(i)
      cellOf.set(key, k)
    }
    rep[i] = k
  }
  const corners = index ? index.length : count
  const at = (n: number) => rep[index ? index[n] : n]
  const seen = new Set<string>()
  const triangles: number[] = []
  for (let t = 0; t + 2 < corners; t += 3) {
    const a = at(t)
    const b = at(t + 1)
    const c = at(t + 2)
    if (a === b || b === c || a === c) continue
    const key = [a, b, c].sort((p, q) => p - q).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    triangles.push(a, b, c)
  }
  return { vertices: Uint32Array.from(kept), triangles: Uint32Array.from(triangles) }
}

/** The cell, in world millimetres: finer than a finger, coarse enough to be cheap. */
export const PICK_CELL_MM = 3
/** Never coarser than this share of the mesh's own size, whatever units it is drawn in. */
const MAX_CELL_OF_SIZE = 1 / 40
/** Meshes lighter than this are cheap to ray as they are: no stand-in. */
export const PICK_PROXY_MIN_TRIANGLES = 20_000

/** The mesh is heavy enough to pick through a stand-in. */
export function wantsPickProxy (mesh: THREE.Mesh): boolean {
  const g = mesh.geometry
  const triangles = (g.index ? g.index.count : g.getAttribute('position').count) / 3
  return triangles >= PICK_PROXY_MIN_TRIANGLES
}

const pickMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })

/** Copies the listed items of an attribute into a new, compact one. */
function gather (source: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, vertices: Uint32Array): THREE.BufferAttribute {
  const size = source.itemSize
  const out = new Float32Array(vertices.length * size)
  for (let i = 0; i < vertices.length; i++) {
    for (let k = 0; k < size; k++) out[i * size + k] = source.getComponent(vertices[i], k)
  }
  return new THREE.BufferAttribute(out, size, source.normalized)
}

/** A mesh's coarse stand-in, in the mesh's own space; for a skinned mesh, bound to its skeleton. */
export function buildPickProxy (mesh: THREE.Mesh, cellMm = PICK_CELL_MM): THREE.Mesh {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position')
  mesh.updateWorldMatrix(true, false)
  // The cell in the mesh's own units: the world cell over the mesh's scale.
  const scale = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld)
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const size = geometry.boundingBox!.getSize(new THREE.Vector3()).length()
  const cell = Math.min(
    cellMm / Math.max(1e-6, (Math.abs(scale.x) + Math.abs(scale.y) + Math.abs(scale.z)) / 3),
    Math.max(1e-6, size * MAX_CELL_OF_SIZE)
  )
  const flat = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    flat[i * 3] = position.getX(i)
    flat[i * 3 + 1] = position.getY(i)
    flat[i * 3 + 2] = position.getZ(i)
  }
  const { vertices, triangles } = clusterTriangles(flat, geometry.index ? geometry.index.array : null, cell)
  const proxy = new THREE.BufferGeometry()
  proxy.setAttribute('position', gather(position, vertices))
  proxy.setIndex(new THREE.BufferAttribute(triangles, 1))
  const skinned = mesh as THREE.SkinnedMesh
  let out: THREE.Mesh
  if (skinned.isSkinnedMesh) {
    proxy.setAttribute('skinIndex', gather(geometry.getAttribute('skinIndex'), vertices))
    proxy.setAttribute('skinWeight', gather(geometry.getAttribute('skinWeight'), vertices))
    const rigged = new THREE.SkinnedMesh(proxy, pickMaterial)
    rigged.bind(skinned.skeleton, skinned.bindMatrix)
    out = rigged
  } else {
    proxy.computeBoundingBox()
    proxy.computeBoundingSphere()
    out = new THREE.Mesh(proxy, pickMaterial)
  }
  out.matrixAutoUpdate = false
  out.userData.pickOf = mesh
  return out
}

/** Places a stand-in where its mesh is drawn now. A skinned one re-measures its bounds, as the hose bends. */
export function placePickProxy (proxy: THREE.Mesh, mesh: THREE.Mesh) {
  proxy.matrixWorld.copy(mesh.matrixWorld)
  const skinned = proxy as THREE.SkinnedMesh
  if (skinned.isSkinnedMesh) {
    skinned.bindMatrix.copy((mesh as THREE.SkinnedMesh).bindMatrix)
    skinned.bindMatrixInverse.copy((mesh as THREE.SkinnedMesh).bindMatrixInverse)
    // Null makes three re-measure the posed stand-in on the next ray.
    const bounds = skinned as unknown as { boundingSphere: THREE.Sphere | null, boundingBox: THREE.Box3 | null }
    bounds.boundingSphere = null
    bounds.boundingBox = null
  }
}
