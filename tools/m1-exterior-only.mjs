#!/usr/bin/env node
/**
 * KAN-2048: strip a printer GLB down to what can be seen from outside, conservatively.
 *
 *   node tools/m1-exterior-only.mjs <in.glb> <out.glb> [--views 320] [--res 900] [--dirs 160] [--workers 15]
 *
 * Needs (not repo dependencies; install them somewhere and point M1_DEPS at it):
 *   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
 *         draco3dgltf three three-mesh-bvh
 *   M1_DEPS=<dir holding that node_modules>   (defaults to the current directory)
 *
 * A triangle is removed only when it is PROVABLY enclosed: no ray tried from
 * outside reaches it. Everything else stays, so ports, vents, recesses, the
 * display, the tube and the underside keep every face that can be seen.
 *
 *  1. Views: orthographic ray grids from a full sphere of directions (below the
 *     floor too), and perspective cameras on spheres at several distances down
 *     to close range, aimed at the centre and at points spread over the body.
 *     Every triangle that is the first thing hit (glass is see-through) stays.
 *  2. Escape test, for each triangle the views did not hit: from several
 *     points on it, just off BOTH faces, rays go out over the whole hemisphere
 *     on that side. If any ray gets away into open air without hitting
 *     anything opaque, the triangle is visible from that direction and stays. This is what finds the insides of ports,
 *     vents and slots.
 *  3. Only triangles that fail both are dropped. Whole meshes that lose every
 *     triangle go; empty nodes go. Nothing else changes: node names,
 *     materials, skins, UVs and extras are untouched, and no geometry is added.
 *
 * The printer stands on a table: an opaque floor plane just under its feet
 * blocks rays from below (a ray heading down that hits nothing lands on it).
 * Visibility is worked out at the file's rest pose.
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

const req = createRequire(pathToFileURL((process.env.M1_DEPS || process.cwd()) + '/').href)
const imp = (m) => import(pathToFileURL(req.resolve(m)).href)
const THREE = await imp('three')
const { MeshBVH } = await imp('three-mesh-bvh')

const TRANSPARENT = /BuildPlate_Glass/
const KEEP_WHOLE = /Panel_Screen|Base_Decals|BuildPlate_Glass|PlateDecal/

function fib (count, minY = -1) {
  const dirs = []; const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (1 - minY) * (i + 0.5) / count; const r = Math.sqrt(Math.max(0, 1 - y * y))
    dirs.push([Math.cos(phi * i) * r, y, Math.sin(phi * i) * r])
  }
  return dirs
}

if (!isMainThread) {
  const { tris, transparentTri, mark, task } = workerData
  const n = tris.length / 9
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(tris, 3))
  g.setIndex(new THREE.BufferAttribute(Uint32Array.from({ length: n * 3 }, (_, i) => i), 1))
  const bvh = new MeshBVH(g, { targetLeafSize: 8 })
  // MeshBVH reorders the index buffer: a hit's faceIndex is a slot in it, not our triangle id
  const ix = g.index.array; const triOf = (fi) => ix[fi * 3] / 3
  const ray = new THREE.Ray()
  const { center, radius, floorY } = task
  const C = new THREE.Vector3(...center)
  // The printer stands on a table: the floor plane (just under its feet) is opaque.
  // First opaque hit along the ray, marking every glass face it passes on the way.
  // Returns null when the ray gets away into open air.
  const FN = new THREE.Vector3(); const FE = new THREE.Vector3()
  // +1 when the ray comes at the face's back (its normal points along the ray)
  const sideOf = (t, d) => {
    const o = t * 9
    FN.set(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2])
    FE.set(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2])
    return FN.cross(FE).dot(d)
  }
  const trace = (markHits) => {
    if (ray.origin.y < floorY) {
      if (ray.direction.y <= 0) return true
      ray.origin.addScaledVector(ray.direction, (floorY - ray.origin.y) / ray.direction.y + 1e-3)
    }
    for (let step = 0; step < 8; step++) {
      const h = bvh.raycastFirst(ray, THREE.DoubleSide)
      if (!h) return ray.direction.y < 0 ? true : null // down: it lands on the floor
      if (h.point.y < floorY) return true
      const t = triOf(h.faceIndex)
      if (markHits) mark[t] |= sideOf(t, ray.direction) > 0 ? 2 : 1
      if (!transparentTri[t]) return h
      ray.origin.copy(h.point).addScaledVector(ray.direction, 0.02)
    }
    return true
  }
  if (task.kind === 'ortho') {
    for (const d of task.dirs) {
      const dir = new THREE.Vector3(...d).negate()
      const up = Math.abs(dir.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      const right = dir.clone().cross(up).normalize(); const u2 = right.clone().cross(dir)
      const eye = C.clone().addScaledVector(dir, -radius * 2)
      for (let y = 0; y < task.res; y++) {
        for (let x = 0; x < task.res; x++) {
          const a = ((x + 0.5) / task.res - 0.5) * 2 * radius; const b = (0.5 - (y + 0.5) / task.res) * 2 * radius
          ray.origin.copy(eye).addScaledVector(right, a).addScaledVector(u2, b); ray.direction.copy(dir)
          trace(true)
        }
      }
    }
  } else if (task.kind === 'persp') {
    for (const cam of task.cams) {
      const eye = new THREE.Vector3(...cam.eye); const fwd = new THREE.Vector3(...cam.target).sub(eye).normalize()
      const up = Math.abs(fwd.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      const right = fwd.clone().cross(up).normalize(); const u2 = right.clone().cross(fwd)
      const t = Math.tan(cam.fov * Math.PI / 360)
      for (let y = 0; y < task.res; y++) {
        for (let x = 0; x < task.res; x++) {
          const u = ((x + 0.5) / task.res - 0.5) * 2 * t; const v = (0.5 - (y + 0.5) / task.res) * 2 * t
          ray.origin.copy(eye); ray.direction.copy(fwd).addScaledVector(right, u).addScaledVector(u2, v).normalize()
          trace(true)
        }
      }
    }
  } else if (task.kind === 'escape') {
    const hemi = fib(task.dirs, 0) // +Y hemisphere, rotated onto each side's normal below
    const A = new THREE.Vector3(); const B = new THREE.Vector3(); const Cc = new THREE.Vector3()
    const N = new THREE.Vector3(); const T1 = new THREE.Vector3(); const T2 = new THREE.Vector3(); const P = new THREE.Vector3()
    const W = [[1 / 3, 1 / 3, 1 / 3], [0.8, 0.1, 0.1], [0.1, 0.8, 0.1], [0.1, 0.1, 0.8], [0.45, 0.45, 0.1], [0.1, 0.45, 0.45], [0.45, 0.1, 0.45]]
    for (const t of task.ids) {
      const o = t * 9
      A.set(tris[o], tris[o + 1], tris[o + 2]); B.set(tris[o + 3], tris[o + 4], tris[o + 5]); Cc.set(tris[o + 6], tris[o + 7], tris[o + 8])
      N.copy(B).sub(A).cross(T1.copy(Cc).sub(A))
      if (N.lengthSq() < 1e-14) N.set(0, 1, 0); else N.normalize()
      T1.set(Math.abs(N.x) < 0.9 ? 1 : 0, Math.abs(N.x) < 0.9 ? 0 : 1, 0).cross(N).normalize(); T2.copy(N).cross(T1)
      for (const side of [1, -1]) {
        if (mark[t] & (side > 0 ? 1 : 2)) continue
        let out = false
        for (const w of W) {
          P.set(0, 0, 0).addScaledVector(A, w[0]).addScaledVector(B, w[1]).addScaledVector(Cc, w[2]).addScaledVector(N, side * 0.01)
          for (const d of hemi) {
            ray.origin.copy(P)
            ray.direction.set(0, 0, 0).addScaledVector(T1, d[0]).addScaledVector(N, side * Math.max(d[1], 0.02)).addScaledVector(T2, d[2]).normalize()
            if (trace(false) === null) { out = true; break }
          }
          if (out) break
        }
        if (out) mark[t] |= side > 0 ? 1 : 2
      }
    }
  }
  parentPort.postMessage('done')
  process.exit(0)
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2)
const [inPath, outPath] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'))
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? Number(args[i + 1]) : d }
if (!inPath || !outPath) { console.error('usage: m1-exterior-only.mjs in.glb out.glb [--views N] [--res N] [--dirs N] [--workers N]'); process.exit(2) }
const VIEWS = opt('views', 320); const RES = opt('res', 900); const DIRS = opt('dirs', 160); const WORKERS = opt('workers', 15)

const { NodeIO } = await imp('@gltf-transform/core')
const { ALL_EXTENSIONS, KHRDracoMeshCompression } = await imp('@gltf-transform/extensions')
const fns = await imp('@gltf-transform/functions')
const draco3d = await imp('draco3dgltf')
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule()
})
const doc = await io.read(inPath)
const root = doc.getRoot()

const prims = []
let total = 0
for (const node of root.listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue
  for (const p of mesh.listPrimitives()) {
    const idx = p.getIndices(); const n = (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3
    prims.push({ node, p, n, start: total, name: node.getName() }); total += n
  }
}
const tris = new Float32Array(new SharedArrayBuffer(total * 9 * 4))
const transparentTri = new Uint8Array(new SharedArrayBuffer(total))
const mark = new Uint8Array(new SharedArrayBuffer(total))
const keepWhole = new Uint8Array(total)
const M = new THREE.Matrix4(); const v = new THREE.Vector3(); const bb = new THREE.Box3()
for (const it of prims) {
  M.fromArray(it.node.getWorldMatrix())
  const a = it.p.getAttribute('POSITION').getArray(); const ia = it.p.getIndices()?.getArray()
  for (let i = 0; i < it.n; i++) {
    for (let k = 0; k < 3; k++) {
      const vi = ia ? ia[i * 3 + k] : i * 3 + k
      v.set(a[vi * 3], a[vi * 3 + 1], a[vi * 3 + 2]).applyMatrix4(M)
      const o = (it.start + i) * 9 + k * 3; tris[o] = v.x; tris[o + 1] = v.y; tris[o + 2] = v.z; bb.expandByPoint(v)
    }
  }
  if (TRANSPARENT.test(it.name)) transparentTri.fill(1, it.start, it.start + it.n)
  if (KEEP_WHOLE.test(it.name)) keepWhole.fill(1, it.start, it.start + it.n)
}
const center = bb.getCenter(new THREE.Vector3())
const radius = bb.getSize(new THREE.Vector3()).length() / 2
console.log(`triangles in: ${total}`)

const run = (task) => new Promise((resolve, reject) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { tris, transparentTri, mark, task: { ...task, center: center.toArray(), radius, floorY: bb.min.y - 0.05 } } })
  w.on('message', resolve); w.on('error', reject)
})
const split = (list) => Array.from({ length: WORKERS }, (_, i) => list.filter((_, j) => j % WORKERS === i))
const count = () => mark.reduce((s, k) => s + k, 0)

const cacheFile = process.env.M1_MARK_CACHE // optional: reuse the ray passes while tuning the voxel step
if (cacheFile && existsSync(cacheFile)) mark.set(readFileSync(cacheFile)); else {
// 1a. orthographic, full sphere
await Promise.all(split(fib(VIEWS)).map(dirs => run({ kind: 'ortho', dirs, res: RES })))
console.log(`after ortho views: ${count()}`)
// 1b. perspective, spheres of eyes at several distances, aimed at the centre and at points over the body
const cams = []
const targets = [center.toArray()]
for (const d of fib(24)) targets.push([center.x + d[0] * radius * 0.45, center.y + d[1] * radius * 0.45, center.z + d[2] * radius * 0.45])
for (const [dist, nEye] of [[2.5, 64], [1.4, 96], [1.0, 128], [0.75, 128]]) {
  fib(nEye).forEach((d, i) => {
    const eye = [center.x + d[0] * radius * dist, center.y + d[1] * radius * dist, center.z + d[2] * radius * dist]
    cams.push({ eye, target: targets[i % targets.length], fov: dist < 1.2 ? 70 : 45 })
  })
}
await Promise.all(split(cams).map(c => run({ kind: 'persp', cams: c, res: Math.round(RES * 0.6) })))
console.log(`after perspective views (${cams.length} cameras): ${count()}`)
// 2. escape test for the rest
const rest = []; for (let t = 0; t < total; t++) if (mark[t] !== 3 && !keepWhole[t]) rest.push(t)
console.log(`escape test on ${rest.length}`)
await Promise.all(split(rest).map(ids => run({ kind: 'escape', ids, dirs: DIRS })))
if (cacheFile) writeFileSync(cacheFile, mark)
}
const keep = new Uint8Array(total)

// 3. Inside or outside the shell, one part group at a time (a group never seals
// the gap between itself and another part, such as the hose lying in front of
// the base). Voxelise the group's surfaces, close openings narrower than
// 2*SEAL mm (dilate, flood the outside air in, then grow that air back through
// empty cells by SEAL so it reaches the real surface again), and close the
// open underside at the floor. depth[] is the length of the path from that
// outside air through empty space only (never through a wall). A face stays only if it was seen from a side
// AND the point just off that side lies within PORT mm of the outside air: the
// outer skin, faces under raised text, and the walls of ports, vents and slots
// up to PORT deep. Faces seen only from inside the shell (its inner surface,
// ribs, bosses, inner walls, the inside of the hose) and every internal part go.
// 4. Backing: a near-black, unlit surface where the kept band meets the closed
// inside across an empty cell, so a gap, port or vent shows black. It lies
// PORT mm in from the outside air, behind the skin, so it only shows through
// openings. It rides with the group's node.
for (let t = 0; t < total; t++) if (keepWhole[t]) keep[t] = 1
const VOX = Number(process.env.M1_VOX_MM || 1.5)
const GROUPS = [
  { re: /M1_Base|M1_Knob|M1_Panel_Screen/, owner: 'M1_Base', seal: 6, port: 3, keepNearTable: 8 },
  { re: /M1_Arm/, owner: 'M1_Arm', seal: 6, port: 15 },
  { re: /M1_Z_Stage/, owner: 'M1_Z_Stage', seal: 6, port: 15 },
  { re: /M1_Y_Gantry/, owner: 'M1_Y_Gantry', seal: 6, port: 15 },
  // the toolhead's underside is open onto its electronics: close it at its lowest point
  { re: /M1_X_Carriage/, owner: 'M1_X_Carriage', seal: 6, port: 3, capBelow: 12 },
  // skinned, so no backing (it would not bend with them); the hose's inner wall is only reached through its ends, so it goes
  { re: /M1_Hose/, owner: null, seal: 6, port: 3, noBacking: true },
  { re: /M1_Belt/, owner: null, seal: 3, port: 2, noBacking: true }
]
const backingBy = new Map()
const A3 = new THREE.Vector3(); const B3 = new THREE.Vector3(); const C3 = new THREE.Vector3(); const N3 = new THREE.Vector3()
let backingCount = 0
for (const grp of GROUPS) {
  const ids = []
  for (const it of prims) if (grp.re.test(it.name) && !TRANSPARENT.test(it.name)) for (let i = 0; i < it.n; i++) ids.push(it.start + i)
  if (!ids.length) continue
  const gb = new THREE.Box3()
  for (const t of ids) for (let k = 0; k < 3; k++) gb.expandByPoint(v.set(tris[t * 9 + k * 3], tris[t * 9 + k * 3 + 1], tris[t * 9 + k * 3 + 2]))
  const SEAL = grp.seal; const R = Math.round(SEAL / VOX); const KEEP = Math.max(1, Math.round(grp.port / VOX))
  const pad = SEAL + 4 * VOX
  const lo = [gb.min.x - pad, bb.min.y - 2 * VOX, gb.min.z - pad]
  const dims = [Math.ceil((gb.max.x + pad - lo[0]) / VOX), Math.ceil((gb.max.y + pad - lo[1]) / VOX), Math.ceil((gb.max.z + pad - lo[2]) / VOX)]
  const [NX, NY, NZ] = dims; const NV = NX * NY * NZ; const N6 = [1, -1, NX, -NX, NX * NY, -NX * NY]
  const vi = (x, y, z) => (z * NY + y) * NX + x
  const cell = (p, i) => Math.min(dims[i] - 1, Math.max(0, Math.floor((p - lo[i]) / VOX)))
  const cellOf = (x, y, z) => vi(cell(x, 0), cell(y, 1), cell(z, 2))
  const occ = new Uint8Array(NV)
  for (const t of ids) {
    const o = t * 9
    const ex = Math.max(Math.hypot(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2]), Math.hypot(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2]), Math.hypot(tris[o + 6] - tris[o + 3], tris[o + 7] - tris[o + 4], tris[o + 8] - tris[o + 5]))
    const n = Math.max(1, Math.ceil(ex / (VOX * 0.5)))
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n - i; j++) {
        const u = i / n; const w = j / n; const q = 1 - u - w
        occ[cellOf(q * tris[o] + u * tris[o + 3] + w * tris[o + 6], q * tris[o + 1] + u * tris[o + 4] + w * tris[o + 7], q * tris[o + 2] + u * tris[o + 5] + w * tris[o + 8])] = 1
      }
    }
  }
  const floorCell = cell(bb.min.y, 1)
  const dilate = (src, axis) => {
    const dst = new Uint8Array(NV); const st = [1, NX, NX * NY][axis]; const len = dims[axis]
    for (let z = 0; z < NZ; z++) {
      for (let y = 0; y < NY; y++) {
        for (let x = 0; x < NX; x++) {
          const base = vi(x, y, z); const c = axis === 0 ? x : axis === 1 ? y : z
          for (let d = -R; d <= R; d++) { const cc = c + d; if (cc >= 0 && cc < len && src[base + d * st]) { dst[base] = 1; break } }
        }
      }
    }
    return dst
  }
  // The table. For a shell standing on it (the base) it goes in before the
  // dilation, so its open underside is sealed; for the hose and belt, which lie
  // on it, after, so the wedge under them stays open air.
  const table = () => { for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) for (let y = 0; y <= floorCell; y++) occ[vi(x, y, z)] = 1 }
  if (!grp.noBacking) table()
  // capBelow: the toolhead's underside is open onto its drive and electronics. A
  // solid slab CAP mm thick under its footprint closes it (side walls keep their outer faces): what is in the slab
  // goes, and the slab's surface gets the black backing.
  const slab = new Uint8Array(grp.capBelow ? NV : 0); const CAP = grp.capBelow || 0
  if (grp.capBelow) {
    const top = cell(gb.min.y + CAP, 1)
    // footprint of the shell's top (not the tube connector beside it), pulled in
    // 3 cells so the side walls' outer faces stay outside the slab
    const foot = new Uint8Array(NX * NZ); const E = 3
    for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) { for (let y = cell(gb.max.y - 6, 1); y < NY; y++) if (occ[vi(x, y, z)]) { foot[z * NX + x] = 1; break } }
    for (let z = E; z < NZ - E; z++) {
      for (let x = E; x < NX - E; x++) {
        let inside = true
        for (let dz = -E; dz <= E && inside; dz++) for (let dx = -E; dx <= E && inside; dx++) inside = foot[(z + dz) * NX + x + dx] === 1
        if (inside) for (let y = Math.max(0, cell(gb.min.y, 1) - 1); y <= top; y++) { occ[vi(x, y, z)] = 1; slab[vi(x, y, z)] = 1 }
      }
    }
  }
  const closed = dilate(dilate(dilate(occ, 0), 1), 2)
  for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) for (let y = 0; y <= floorCell; y++) { occ[vi(x, y, z)] = 1; closed[vi(x, y, z)] = 1 }
  const depth = new Uint16Array(NV).fill(65535)
  let fr = []
  for (let z = 0; z < NZ; z++) {
    for (let y = 0; y < NY; y++) {
      for (let x = 0; x < NX; x++) {
        const i = vi(x, y, z)
        if ((x === 0 || x === NX - 1 || y === NY - 1 || z === 0 || z === NZ - 1) && !closed[i]) { depth[i] = 0; fr.push(i) }
      }
    }
  }
  for (let f = 0; f < fr.length; f++) { const i = fr[f]; for (const d of N6) { const j = i + d; if (j >= 0 && j < NV && depth[j] === 65535 && !closed[j]) { depth[j] = 0; fr.push(j) } } }
  // grow the outside air back to the real surface, through empty cells only (26
  // neighbours, the same box shape the dilation used)
  const N26 = []
  for (const dz of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) if (dx || dy || dz) N26.push(dx + dy * NX + dz * NX * NY)
  let grow = fr
  for (let k = 0; k < R + 1 && grow.length; k++) {
    const nx = []
    for (const i of grow) for (const d of N26) { const j = i + d; if (j >= 0 && j < NV && depth[j] === 65535 && !occ[j]) { depth[j] = 0; nx.push(j) } }
    grow = nx
  }
  fr = []; for (let i = 0; i < NV; i++) if (depth[i] === 0) fr.push(i)
  for (let k = 1; fr.length; k++) {
    const nx = []
    for (const i of fr) for (const d of N6) { const j = i + d; if (j >= 0 && j < NV && depth[j] === 65535 && !occ[j]) { depth[j] = k; nx.push(j) } }
    fr = nx
  }
  // the off-face point can fall in a cell some other surface also occupies: use
  // the nearest empty cells around it
  const airNear = (cx, cy, cz) => {
    let best = depth[vi(cx, cy, cz)]
    if (grp.capBelow && slab[vi(cx, cy, cz)]) return 65535 // inside the closed underside
    if (!occ[vi(cx, cy, cz)]) return best
    for (let z = Math.max(0, cz - 1); z <= Math.min(NZ - 1, cz + 1); z++) for (let y = Math.max(0, cy - 1); y <= Math.min(NY - 1, cy + 1); y++) for (let x = Math.max(0, cx - 1); x <= Math.min(NX - 1, cx + 1); x++) if (!occ[vi(x, y, z)] && !(grp.capBelow && slab[vi(x, y, z)])) best = Math.min(best, depth[vi(x, y, z)])
    return best
  }
  let kept = 0
  const off = VOX * 1.2
  for (const t of ids) {
    if (keepWhole[t]) { keep[t] = 1; kept++; continue }
    if (!mark[t]) continue
    const o = t * 9
    // the feet and the bottom rim, down by the table: seen there is enough
    if (grp.keepNearTable && Math.max(tris[o + 1], tris[o + 4], tris[o + 7]) < bb.min.y + grp.keepNearTable) { keep[t] = 1; kept++; continue }
    A3.set(tris[o], tris[o + 1], tris[o + 2]); B3.set(tris[o + 3], tris[o + 4], tris[o + 5]); C3.set(tris[o + 6], tris[o + 7], tris[o + 8])
    N3.copy(B3).sub(A3).cross(C3.clone().sub(A3)); if (N3.lengthSq() < 1e-14) N3.set(0, 1, 0); else N3.normalize()
    for (const side of [1, -1]) {
      if (!(mark[t] & (side > 0 ? 1 : 2))) continue
      for (const w of [[1 / 3, 1 / 3, 1 / 3], [0.7, 0.15, 0.15], [0.15, 0.7, 0.15], [0.15, 0.15, 0.7]]) {
        const px = A3.x * w[0] + B3.x * w[1] + C3.x * w[2] + N3.x * side * off
        const py = A3.y * w[0] + B3.y * w[1] + C3.y * w[2] + N3.y * side * off
        const pz = A3.z * w[0] + B3.z * w[1] + C3.z * w[2] + N3.z * side * off
        if (airNear(cell(px, 0), cell(py, 1), cell(pz, 2)) <= KEEP) { keep[t] = 1; break }
      }
      if (keep[t]) break
    }
    if (keep[t]) kept++
  }
  if (process.env.M1_DEBUG_TRI) {
    for (const t of process.env.M1_DEBUG_TRI.split(',').map(Number)) {
      if (!ids.includes(t)) continue
      const o = t * 9
      console.log('debug', t, 'mark', mark[t], 'keep', keep[t], 'depth at centroid', depth[cellOf((tris[o] + tris[o + 3] + tris[o + 6]) / 3, (tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3, (tris[o + 2] + tris[o + 5] + tris[o + 8]) / 3)])
    }
  }
  const quads = []
  for (let z = 1; z < NZ - 1; z++) {
    // not within SEAL of the table: the sealed wedge under a part's edge is not an opening
    for (let y = floorCell + R + 1; y < NY - 1; y++) {
      for (let x = 1; x < NX - 1; x++) {
        const i = vi(x, y, z); if (grp.noBacking || depth[i] > KEEP || occ[i]) continue
        for (let a = 0; a < 3; a++) {
          for (const sg of [1, -1]) {
            const j = i + sg * [1, NX, NX * NY][a]
            if (depth[j] <= KEEP || (occ[j] && !(grp.capBelow && slab[j])) || (a === 1 && sg < 0 && y - 1 <= floorCell + R)) continue
            const f = [lo[0] + x * VOX, lo[1] + y * VOX, lo[2] + z * VOX]; if (sg > 0) f[a] += VOX
            const b2 = (a + 1) % 3; const c2 = (a + 2) % 3
            const q = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, w]) => { const p = f.slice(); p[b2] += u * VOX; p[c2] += w * VOX; return p })
            if (sg > 0) quads.push(q[0], q[2], q[1], q[0], q[3], q[2]); else quads.push(q[0], q[1], q[2], q[0], q[2], q[3])
          }
        }
      }
    }
  }
  backingCount += quads.length / 6
  const ownerNode = grp.owner ? root.listNodes().find(n => n.getName() === grp.owner) : null
  const key = ownerNode || 'static'
  if (!backingBy.has(key)) backingBy.set(key, [])
  for (const q of quads) backingBy.get(key).push(q)
  console.log(`${grp.re.source}: ${ids.length} -> ${kept} faces, ${quads.length / 6} backing quads (grid ${NX}x${NY}x${NZ})`)
}
const backing = { length: backingCount }
console.log(`backing quads: ${backingCount}`)

if (process.env.M1_DEBUG_KEEP) writeFileSync(process.env.M1_DEBUG_KEEP, keep)

const report = {}
let kept = 0
for (const it of prims) {
  const idx = it.p.getIndices(); const ia = idx ? idx.getArray() : null
  const out = []
  for (let i = 0; i < it.n; i++) if (keep[it.start + i]) for (let k = 0; k < 3; k++) out.push(ia ? ia[i * 3 + k] : i * 3 + k)
  kept += out.length / 3
  const r = report[it.name] || (report[it.name] = { before: 0, after: 0 })
  r.before += it.n; r.after += out.length / 3
  if (idx) idx.setArray(new Uint32Array(out))
  else it.p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(out)).setBuffer(root.listBuffers()[0]))
}
console.log(`triangles out: ${kept}`)
for (const it of prims) {
  const i = it.p.getIndices()
  if (!i || i.getCount() === 0) { it.node.getMesh().removePrimitive(it.p); it.p.dispose() }
}
for (const mesh of root.listMeshes()) if (mesh.listPrimitives().length === 0) { for (const p of mesh.listParents()) { if (p.propertyType === 'Node') p.setMesh(null) } mesh.dispose() }
if (backing.length) {
  const buf = root.listBuffers()[0]
  const { KHRMaterialsUnlit } = await imp('@gltf-transform/extensions')
  const mat = doc.createMaterial('M1_Backing').setBaseColorFactor([0.01, 0.01, 0.012, 1]).setMetallicFactor(0).setRoughnessFactor(1)
  mat.setExtension('KHR_materials_unlit', doc.createExtension(KHRMaterialsUnlit).createUnlit())
  const W = new THREE.Matrix4(); const p3 = new THREE.Vector3()
  for (const [k, quads] of backingBy) {
    if (!quads.length) continue
    const parent = k === 'static' ? null : k
    W.identity(); if (parent) W.fromArray(parent.getWorldMatrix()).invert()
    const pos = new Float32Array(quads.length * 3)
    quads.forEach((q, i) => { p3.set(q[0], q[1], q[2]).applyMatrix4(W); pos[i * 3] = p3.x; pos[i * 3 + 1] = p3.y; pos[i * 3 + 2] = p3.z })
    const prim = doc.createPrimitive().setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buf)).setMaterial(mat)
    const node = doc.createNode(`M1_Backing_${parent ? parent.getName() : 'Static'}`).setMesh(doc.createMesh('M1_Backing').addPrimitive(prim))
    if (parent) parent.addChild(node); else root.listScenes()[0].addChild(node)
  }
}
await doc.transform(fns.prune({ keepLeaves: true, keepAttributes: false }), fns.dedup(), fns.weld({ tolerance: 0 }))
doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })
await io.write(outPath, doc)
console.log(JSON.stringify({ totalBefore: total, totalAfter: kept, perNode: report }))
