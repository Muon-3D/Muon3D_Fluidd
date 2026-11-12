#!/usr/bin/env node
/**
 * KAN-2048: small look fixes to the accurate M1 GLB, after m1-exterior-only.mjs.
 *
 *   node tools/m1-look-patch.mjs <in.glb> <out.glb>
 *
 * Needs the same packages as m1-exterior-only.mjs (M1_DEPS).
 *
 *  1. The filament motor indicator on top of the toolhead is black, not silver
 *     (Jack, 11 Nov): the part under INDICATOR_AT gets its own near-black material.
 *  2. The slot to the right of the nozzle is not on the real printer: the part
 *     under SLOT_AT (the slot's insert) is removed, the opening is covered flush
 *     in the top's own material, and a small heating-warning triangle
 *     (yellow, black border) goes in its place.
 * Points are world-space millimetres on the file's rest pose; parts are found by
 * casting a ray straight down at them, so nothing here copies model geometry.
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const req = createRequire(pathToFileURL((process.env.M1_DEPS || process.cwd()) + '/').href)
const imp = (m) => import(pathToFileURL(req.resolve(m)).href)
const THREE = await imp('three')
const { NodeIO } = await imp('@gltf-transform/core')
const { ALL_EXTENSIONS, KHRDracoMeshCompression } = await imp('@gltf-transform/extensions')
const draco3d = await imp('draco3dgltf')

const HEAD = 'M1_X_Carriage'
const INDICATOR_AT = [6.3, 55]
const SLOT_AT = [30, -3.2]
// the slot opening on the toolhead top (y = TOP), x from..to, z from..to, covered in the top's own material
const SLOT = { x0: 19.5, x1: 42.5, z0: -5.4, z1: -1.2 }
const LIGHT_AT = [30, -7]
const TRI = { cx: 31, cz: -3.3, side: 6, border: 0.7 }

const [inPath, outPath] = process.argv.slice(2)
if (!inPath || !outPath) { console.error('usage: m1-look-patch.mjs in.glb out.glb'); process.exit(2) }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule()
})
const doc = await io.read(inPath)
const root = doc.getRoot()
const node = root.listNodes().find(n => n.getName() === HEAD)
const M = new THREE.Matrix4().fromArray(node.getWorldMatrix()); const Minv = M.clone().invert()
const prims = node.getMesh().listPrimitives()

// world-space triangles of the toolhead
const list = []
for (const p of prims) {
  const pos = p.getAttribute('POSITION').getArray(); const ia = p.getIndices()?.getArray()
  const n = (ia ? ia.length : pos.length / 3) / 3
  for (let i = 0; i < n; i++) {
    const v = [0, 1, 2].map(k => { const vi = ia ? ia[i * 3 + k] : i * 3 + k; return new THREE.Vector3(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]).applyMatrix4(M) })
    list.push({ p, i, v })
  }
}
function pick ([x, z]) {
  const ray = new THREE.Ray(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0)); const hit = new THREE.Vector3()
  let best = null
  for (const t of list) {
    const h = ray.intersectTriangle(t.v[0], t.v[1], t.v[2], false, hit)
    if (h && (!best || h.y > best.y)) best = { ...t, y: h.y }
  }
  if (!best) throw new Error(`nothing under ${x},${z}`)
  return best
}
// triangles of the connected piece (shared positions) a triangle belongs to, in its primitive
function piece (t) {
  const p = t.p; const pos = p.getAttribute('POSITION').getArray(); const ia = p.getIndices().getArray()
  const key = (vi) => `${Math.round(pos[vi * 3] * 1e4)},${Math.round(pos[vi * 3 + 1] * 1e4)},${Math.round(pos[vi * 3 + 2] * 1e4)}`
  const by = new Map(); const n = ia.length / 3
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const kk = key(ia[i * 3 + k]); if (!by.has(kk)) by.set(kk, []); by.get(kk).push(i) }
  const seen = new Set([t.i]); const st = [t.i]
  while (st.length) { const i = st.pop(); for (let k = 0; k < 3; k++) for (const j of by.get(key(ia[i * 3 + k]))) if (!seen.has(j)) { seen.add(j); st.push(j) } }
  return seen
}

// 1. indicator
const ind = pick(INDICATOR_AT)
const black = doc.createMaterial('M1_Indicator_Black').setBaseColorFactor([0.02, 0.02, 0.02, 1]).setMetallicFactor(0).setRoughnessFactor(0.45)
ind.p.setMaterial(black)
console.log(`indicator: ${ind.p.getIndices().getCount() / 3} triangles now black`)

// 2. slot: drop the insert, cover the opening, add the triangle
const light = pick(LIGHT_AT); const top = light.y
const slot = pick(SLOT_AT)
const gone = piece(slot)
{ const ia = slot.p.getIndices().getArray(); const out = []
  for (let i = 0; i < ia.length / 3; i++) if (!gone.has(i)) out.push(ia[i * 3], ia[i * 3 + 1], ia[i * 3 + 2])
  slot.p.getIndices().setArray(new Uint32Array(out)) }
console.log(`slot insert: ${gone.size} triangles removed; top at y = ${top.toFixed(2)}`)

const buf = root.listBuffers()[0]
const v3 = new THREE.Vector3()
function addPrim (worldTris, material, lift) {
  const pos = new Float32Array(worldTris.length * 3); const nrm = new Float32Array(worldTris.length * 3)
  const nLocal = new THREE.Vector3(0, 1, 0).transformDirection(Minv)
  worldTris.forEach(([x, z], i) => {
    v3.set(x, top + lift, z).applyMatrix4(Minv); pos.set([v3.x, v3.y, v3.z], i * 3); nrm.set([nLocal.x, nLocal.y, nLocal.z], i * 3)
  })
  const p = doc.createPrimitive().setMaterial(material)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nrm).setBuffer(buf))
  p.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(worldTris, (_, i) => i)).setBuffer(buf))
  if (prims[0].getAttribute('TEXCOORD_0')) p.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(worldTris.length * 2)).setBuffer(buf))
  node.getMesh().addPrimitive(p)
}
// counter-clockwise seen from above (+Y): (x, z) order a, c, b for a quad a-b-c-d going +x then +z
const quad = (x0, x1, z0, z1) => [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]
addPrim(quad(SLOT.x0, SLOT.x1, SLOT.z0, SLOT.z1), light.p.getMaterial(), 0.02)
const yellow = doc.createMaterial('M1_Heat_Warning').setBaseColorFactor([1, 0.78, 0.05, 1]).setMetallicFactor(0).setRoughnessFactor(0.6)
const edge = doc.createMaterial('M1_Heat_Warning_Edge').setBaseColorFactor([0.01, 0.01, 0.01, 1]).setMetallicFactor(0).setRoughnessFactor(0.6)
const triPts = (s) => { const h = s * Math.sqrt(3) / 2; return [[TRI.cx, TRI.cz - h * 2 / 3], [TRI.cx - s / 2, TRI.cz + h / 3], [TRI.cx + s / 2, TRI.cz + h / 3]] }
const outer = triPts(TRI.side); const inner = triPts(TRI.side - TRI.border * 2 * Math.sqrt(3))
const ccw = ([a, b, c]) => [a, b, c] // apex at -z, base at +z: a, b(left), c(right) is CCW from +Y
addPrim(ccw(outer), edge, 0.05)
addPrim(ccw(inner), yellow, 0.08)
// heat waves: three short black bars inside the triangle
const waves = []
for (const dx of [-0.9, 0, 0.9]) waves.push(...quad(TRI.cx + dx - 0.18, TRI.cx + dx + 0.18, TRI.cz - 0.9, TRI.cz + 0.9))
addPrim(waves, edge, 0.1)

doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })
await io.write(outPath, doc)
console.log('written', outPath)
