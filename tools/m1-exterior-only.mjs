#!/usr/bin/env node
/**
 * KAN-2048: strip a printer GLB down to what is visible from outside.
 *
 *   node tools/m1-exterior-only.mjs <in.glb> <out.glb> [--views 240] [--res 640] [--workers 4]
 *
 * Needs (not repo dependencies; install them somewhere and point M1_DEPS at it):
 *   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
 *         draco3dgltf three three-mesh-bvh
 *   M1_DEPS=<dir holding that node_modules>   (defaults to the current directory)
 *
 * What it does
 *  1. Every triangle goes to world space. Ray casts from a dense sphere of
 *     orthographic views (camera above the floor, like Control's) mark the
 *     triangles that are the first thing hit. Glass is transparent to the rays.
 *  2. A seen triangle is only kept if it is also exposed: rays from its hit
 *     point over the hemisphere on the viewer's side must mostly reach open
 *     air. A face that is only visible by peeking through a slot into the
 *     shell fails this, so inner walls and everything in the cavity go and
 *     the openings show an empty hollow.
 *  3. Triangles under 0.25 mm2 that touch a kept triangle stay (no pin holes).
 *  4. Unused vertices, empty meshes and nodes with nothing under them are
 *     dropped; the rest is re-welded and re-compressed with Draco.
 * Node names, materials, skins, UVs and extras are untouched.
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
// Parts under the (transparent) glass keep whatever the rays saw through it:
const SEEN_THROUGH_GLASS = /Z_Stage/
const KEEP_WHOLE = /Panel_Screen|Base_Decals|BuildPlate_Glass|PlateDecal/

function buildScene (tris) {
  const n = tris.length / 9
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(tris, 3))
  g.setIndex(new THREE.BufferAttribute(Uint32Array.from({ length: n * 3 }, (_, i) => i), 1))
  return new MeshBVH(g, { targetLeafSize: 8 })
}

function viewDirs (count) {
  // Fibonacci hemisphere, elevation >= 2 degrees above the floor plane (Y up).
  const dirs = []
  const y0 = Math.sin(2 * Math.PI / 180)
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = y0 + (1 - y0) * (i + 0.5) / count
    const r = Math.sqrt(1 - y * y)
    dirs.push([Math.cos(phi * i) * r, y, Math.sin(phi * i) * r])
  }
  return dirs
}

if (!isMainThread) {
  const { tris, transparentTri, task } = workerData
  const bvh = buildScene(tris)
  const nTri = tris.length / 9
  const ray = new THREE.Ray()
  const A = new THREE.Vector3(); const B = new THREE.Vector3(); const C = new THREE.Vector3(); const N = new THREE.Vector3()
  const faceN = (t) => {
    const o = t * 9
    A.set(tris[o], tris[o + 1], tris[o + 2]); B.set(tris[o + 3], tris[o + 4], tris[o + 5]); C.set(tris[o + 6], tris[o + 7], tris[o + 8])
    return N.copy(B).sub(A).cross(C.sub(A)).normalize()
  }
  if (task.kind === 'views') {
    const seen = new Uint16Array(nTri)
    const pt = new Float32Array(nTri * 4) // first hit point + side (+1/-1); w = 0 means unset
    const { dirs, res, center, radius } = task
    for (const d of dirs) {
      const dir = new THREE.Vector3(...d).negate() // the camera looks along -d
      const up = Math.abs(d[1]) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      const right = dir.clone().cross(up).normalize(); const u2 = right.clone().cross(dir)
      const eye = new THREE.Vector3(...center).addScaledVector(dir, -radius * 2)
      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const a = ((x + 0.5) / res - 0.5) * 2 * radius; const b = (0.5 - (y + 0.5) / res) * 2 * radius
          ray.origin.copy(eye).addScaledVector(right, a).addScaledVector(u2, b); ray.direction.copy(dir)
          for (let step = 0; step < 4; step++) {
            const h = bvh.raycastFirst(ray, THREE.DoubleSide)
            if (!h) break
            const t = h.faceIndex
            if (seen[t] < 65535) seen[t]++
            if (pt[t * 4 + 3] === 0) {
              const side = faceN(t).dot(dir) < 0 ? 1 : -1
              pt[t * 4] = h.point.x; pt[t * 4 + 1] = h.point.y; pt[t * 4 + 2] = h.point.z; pt[t * 4 + 3] = side
            }
            if (!transparentTri[t]) break
            ray.origin.copy(h.point).addScaledVector(dir, 0.02) // glass: carry on through
          }
        }
      }
    }
    parentPort.postMessage({ seen, pt }, [seen.buffer, pt.buffer])
  }
  process.exit(0)
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2)
const [inPath, outPath] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'))
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? Number(args[i + 1]) : d }
if (!inPath || !outPath) { console.error('usage: m1-exterior-only.mjs in.glb out.glb [--views N] [--res N]'); process.exit(2) }
const VIEWS = opt('views', 240); const RES = opt('res', 640); const WORKERS = opt('workers', 4)

const { NodeIO } = await imp('@gltf-transform/core')
const { ALL_EXTENSIONS } = await imp('@gltf-transform/extensions')
const fns = await imp('@gltf-transform/functions')
const draco3d = await imp('draco3dgltf')
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule()
})
const doc = await io.read(inPath)
const root = doc.getRoot()

// world-space triangles, remembering which primitive each one belongs to
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
const keepWhole = new Uint8Array(total)
const underGlass = new Uint8Array(total)
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
  if (SEEN_THROUGH_GLASS.test(it.name)) underGlass.fill(1, it.start, it.start + it.n)
  if (KEEP_WHOLE.test(it.name)) keepWhole.fill(1, it.start, it.start + it.n)
}
const center = bb.getCenter(new THREE.Vector3()).toArray()
const radius = bb.getSize(new THREE.Vector3()).length() / 2
console.log(`triangles in: ${total}`)

const run = (task) => new Promise((resolve, reject) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { tris, transparentTri, task } })
  w.on('message', resolve); w.on('error', reject)
})
const dirs = viewDirs(VIEWS)
const parts = Array.from({ length: WORKERS }, (_, i) => dirs.filter((_, j) => j % WORKERS === i))
console.log(`views: ${VIEWS} x ${RES}px, ${WORKERS} workers`)
const seen = new Uint32Array(total)
const cache = process.env.M1_SEEN_CACHE // optional: reuse the ray pass while tuning the later steps
if (cache && existsSync(cache)) { const b = readFileSync(cache); seen.set(new Uint32Array(b.buffer, b.byteOffset, total)) } else {
  const res1 = await Promise.all(parts.map(d => run({ kind: 'views', dirs: d, res: RES, center, radius })))
  for (const r of res1) for (let t = 0; t < total; t++) seen[t] += r.seen[t]
  if (cache) writeFileSync(cache, new Uint8Array(seen.buffer))
}
const ids = []; for (let t = 0; t < total; t++) if (seen[t] > 0 && !keepWhole[t]) ids.push(t)
console.log(`seen from outside: ${ids.length}`)

// Sealed-cavity test. Occupancy grid, dilated by SEAL mm so openings smaller
// than 2*SEAL close, then flood the air in from outside. A triangle is exterior
// skin only if it was seen and open air that the flood reached lies close to it.
const VOX = 1.5; const SEAL = Number(process.env.M1_SEAL_MM || 6)
const lo = [bb.min.x - SEAL * 3, bb.min.y - SEAL * 3, bb.min.z - SEAL * 3]
const dims = [0, 1, 2].map(i => Math.ceil(((i === 0 ? bb.max.x : i === 1 ? bb.max.y : bb.max.z) + SEAL * 3 - lo[i]) / VOX))
const [NX, NY, NZ] = dims; const NV = NX * NY * NZ
const vi = (x, y, z) => (z * NY + y) * NX + x
const cell = (p, i) => Math.min(dims[i] - 1, Math.max(0, Math.floor((p - lo[i]) / VOX)))
const occ = new Uint8Array(NV)
for (let t = 0; t < total; t++) {
  const o = t * 9
  const ex = Math.max(Math.hypot(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2]), Math.hypot(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2]), Math.hypot(tris[o + 6] - tris[o + 3], tris[o + 7] - tris[o + 4], tris[o + 8] - tris[o + 5]))
  const n = Math.max(1, Math.ceil(ex / (VOX * 0.6)))
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n - i; j++) {
      const u = i / n; const w = j / n; const q = 1 - u - w
      occ[vi(cell(q * tris[o] + u * tris[o + 3] + w * tris[o + 6], 0), cell(q * tris[o + 1] + u * tris[o + 4] + w * tris[o + 7], 1), cell(q * tris[o + 2] + u * tris[o + 5] + w * tris[o + 8], 2))] = 1
    }
  }
}
// The underside of the shell is open, which would let the flood fill walk straight
// in. Close it with a virtual floor (grid only, never written out) a little above
// the lowest point; M1_CAP_MM sets how far.
const capY = bb.min.y + Number(process.env.M1_CAP_MM || 10)
for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) { occ[vi(x, cell(capY, 1), z)] = 1; occ[vi(x, Math.min(NY - 1, cell(capY, 1) + 1), z)] = 1 }
const R = Math.round(SEAL / VOX)
function dilate (src, axis) {
  const dst = new Uint8Array(NV); const st = [1, NX, NX * NY][axis]; const len = dims[axis]
  for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const base = vi(x, y, z); const c = [x, y, z][axis]
    let hit = 0
    for (let d = -R; d <= R && !hit; d++) { const cc = c + d; if (cc >= 0 && cc < len && src[base + d * st]) hit = 1 }
    dst[base] = hit
  }
  return dst
}
const closed = dilate(dilate(dilate(occ, 0), 1), 2)
const air = new Uint8Array(NV) // 1 = air the flood reached from outside
const queue = new Int32Array(NV); let qh = 0; let qt = 0
const push = (i) => { if (!closed[i] && !air[i]) { air[i] = 1; queue[qt++] = i } }
for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) { push(vi(0, y, z)); push(vi(NX - 1, y, z)) }
for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) { push(vi(x, 0, z)); push(vi(x, NY - 1, z)) }
for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) { push(vi(x, y, 0)); push(vi(x, y, NZ - 1)) }
while (qh < qt) {
  const i = queue[qh++]; const x = i % NX; const y = Math.floor(i / NX) % NY; const z = Math.floor(i / (NX * NY))
  if (x > 0) push(i - 1); if (x < NX - 1) push(i + 1)
  if (y > 0) push(i - NX); if (y < NY - 1) push(i + NX)
  if (z > 0) push(i - NX * NY); if (z < NZ - 1) push(i + NX * NY)
}
// Grow the reached air back toward the surfaces (through empty cells only), DEPTH
// mm deep. That undoes the dilation where the air really is outside, and stops
// at the sealed openings: cavities behind them stay out of reach.
const DEPTH = Math.round(Number(process.env.M1_DEPTH_MM || 12) / VOX)
const dist = new Uint8Array(NV).fill(255)
let frontier = []
for (let i = 0; i < NV; i++) if (air[i]) { dist[i] = 0; frontier.push(i) }
for (let d = 1; d <= DEPTH + R; d++) {
  const next = []
  for (const i of frontier) {
    const x = i % NX; const y = Math.floor(i / NX) % NY; const z = Math.floor(i / (NX * NY))
    for (const [dx, dy, dz] of [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]]) {
      const xx = x + dx; const yy = y + dy; const zz = z + dz
      if (xx < 0 || yy < 0 || zz < 0 || xx >= NX || yy >= NY || zz >= NZ) continue
      const j = vi(xx, yy, zz)
      if (dist[j] !== 255 || (occ[j] && !closedSurface(j))) continue
      dist[j] = d; next.push(j)
    }
  }
  frontier = next
}
function closedSurface () { return false }
const airNear = (px, py, pz) => {
  const cx = cell(px, 0); const cy = cell(py, 1); const cz = cell(pz, 2)
  for (let z = Math.max(0, cz - 1); z <= Math.min(NZ - 1, cz + 1); z++) for (let y = Math.max(0, cy - 1); y <= Math.min(NY - 1, cy + 1); y++) for (let x = Math.max(0, cx - 1); x <= Math.min(NX - 1, cx + 1); x++) if (dist[vi(x, y, z)] !== 255 && !occ[vi(x, y, z)]) return true
  return false
}
// Rays at a finite resolution miss some sub-pixel facets of a seen surface, so
// "seen" is spread SPREAD cells (about 3 mm) before it is combined with the air test.
const e1 = new THREE.Vector3(); const e2 = new THREE.Vector3()
const seenGrid = new Uint8Array(NV)
for (let t = 0; t < total; t++) if (seen[t]) { const o = t * 9; seenGrid[vi(cell((tris[o] + tris[o + 3] + tris[o + 6]) / 3, 0), cell((tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3, 1), cell((tris[o + 2] + tris[o + 5] + tris[o + 8]) / 3, 2))] = 1 }
const SPREAD = 2
const seenNear = (o) => {
  const cx = cell((tris[o] + tris[o + 3] + tris[o + 6]) / 3, 0); const cy = cell((tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3, 1); const cz = cell((tris[o + 2] + tris[o + 5] + tris[o + 8]) / 3, 2)
  for (let z = Math.max(0, cz - SPREAD); z <= Math.min(NZ - 1, cz + SPREAD); z++) for (let y = Math.max(0, cy - SPREAD); y <= Math.min(NY - 1, cy + SPREAD); y++) for (let x = Math.max(0, cx - SPREAD); x <= Math.min(NX - 1, cx + SPREAD); x++) if (seenGrid[vi(x, y, z)]) return true
  return false
}
const keep = new Uint8Array(total)
for (let t = 0; t < total; t++) {
  if (keepWhole[t] || (underGlass[t] && seen[t])) { keep[t] = 1; continue }
  const o = t * 9
  if ((process.env.M1_USE_SEEN ? seenNear(o) : true) && airNear((tris[o] + tris[o + 3] + tris[o + 6]) / 3, (tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3, (tris[o + 2] + tris[o + 5] + tris[o + 8]) / 3)) keep[t] = 1
}
if (process.env.M1_DEBUG) {
  let big = 0, bigSeen = 0, bigKept = 0
  for (let t = 0; t < total; t++) { const o = t * 9; e1.set(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2]); e2.set(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2]); if (e1.cross(e2).length() / 2 > 100) { big++; if (seen[t]) bigSeen++; if (keep[t]) bigKept++ } }
  console.log('big', big, bigSeen, bigKept)
}
if (process.env.M1_DEBUG_KEEP) writeFileSync(process.env.M1_DEBUG_KEEP, keep)
console.log(`exterior skin: ${keep.reduce((s, k) => s + k, 0)}`)

// tiny triangles that touch a kept one stay, so no pin holes open up
const key = (o) => `${Math.round(tris[o] * 50)},${Math.round(tris[o + 1] * 50)},${Math.round(tris[o + 2] * 50)}`
const keptVerts = new Set()
for (let t = 0; t < total; t++) if (keep[t]) for (let k = 0; k < 3; k++) keptVerts.add(key(t * 9 + k * 3))
for (let t = 0; t < total; t++) {
  if (keep[t]) continue
  const o = t * 9
  e1.set(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2])
  e2.set(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2])
  if (e1.cross(e2).length() / 2 < 0.25 && [0, 1, 2].every(k => keptVerts.has(key(o + k * 3))) && airNear((tris[o] + tris[o + 3] + tris[o + 6]) / 3, (tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3, (tris[o + 2] + tris[o + 5] + tris[o + 8]) / 3)) keep[t] = 1
}

if (process.env.M1_KEEP_ALL) keep.fill(1) // debug: round-trip through the writer only
// write the kept triangles back into the document
const report = {}
let kept = 0
for (const it of prims) {
  const idx = it.p.getIndices(); const ia = idx ? idx.getArray() : null
  const out = []
  for (let i = 0; i < it.n; i++) {
    if (!keep[it.start + i]) continue
    for (let k = 0; k < 3; k++) out.push(ia ? ia[i * 3 + k] : i * 3 + k)
  }
  kept += out.length / 3
  const r = report[it.name] || (report[it.name] = { before: 0, after: 0 })
  r.before += it.n; r.after += out.length / 3
  if (idx) idx.setArray(new Uint32Array(out))
  else {
    // non-indexed: build an index
    const acc = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(out)).setBuffer(root.listBuffers()[0])
    it.p.setIndices(acc)
  }
}
console.log(`triangles out: ${kept}`)

// drop empty primitives, meshes and nodes; clean up and recompress
for (const it of prims) {
  const i = it.p.getIndices()
  if (!i || i.getCount() === 0) { it.node.getMesh().removePrimitive(it.p); it.p.dispose() }
}
for (const mesh of root.listMeshes()) if (mesh.listPrimitives().length === 0) { for (const p of mesh.listParents()) { if (p.propertyType === 'Node') p.setMesh(null) } mesh.dispose() }
await doc.transform(
  fns.prune({ keepLeaves: true, keepAttributes: false }),
  fns.dedup(),
  fns.weld({ tolerance: 0 })
)
const { KHRDracoMeshCompression } = await imp('@gltf-transform/extensions')
doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })
await io.write(outPath, doc)
const sum = Object.values(report).reduce((s, r) => ({ before: s.before + r.before, after: s.after + r.after }), { before: 0, after: 0 })
console.log(JSON.stringify({ totalBefore: sum.before, totalAfter: sum.after, perNode: report }))
