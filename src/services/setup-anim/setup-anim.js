/* eslint-disable */
// Copied UNCHANGED from the design lab: muon-design-lab setup-anim.js at lab commit febaec3.
// Do not edit the drawing here. Changes to geometry or motion go to proj-design (KAN-6010),
// so the printer screen (MuonUI) and Control keep the same copy. Control wiring: KAN-6012.
// Setup animations (KAN-6010): what to attach, in the order a person does it.
// Four short loops in a wireframe side view of the M1: toolhead, spine, lever, plate.
//
// Framework-free and stateless. Canvas 2D only: strokes and fills, no blur,
// shadows, filters or gradients. The frame depends only on `tMs`, so the host
// drives it from its own rAF (MuonUI's 480 px round canvas, Control's pop-up).
//
//   drawSetup(ctx, 'spine', tMs, { size: 480, theme: 'dark', label: true })
//
// The printer is traced from the accurate M1 model Control renders
// (Muon3D_Fluidd src/assets/m1/m1-accurate.glb): each outline below is that
// model's silhouette, straight on, in millimetres. Toolhead, spine and plate are
// seen from the printer's right side (front on the right, spine on the left);
// the lever is seen from behind, where it sits on the left of the spine.
// Coordinates: u across, v down, 1 unit = 1 mm, from the model's own origin (the
// middle of the plate's top at its modelled height).

export const SETUP_STEPS = ['toolhead', 'spine', 'lever', 'plate']

export const SETUP_MESSAGES = {
  toolhead: { title: 'Toolhead disconnected', hint: 'Plug the toolhead in at both ends' },
  spine: { title: 'Fit the spine', hint: 'Stand it up, slide it down, wiggle to seat' },
  lever: { title: 'Push the lever down', hint: 'It locks the spine' },
  plate: { title: 'Put the plate on', hint: 'Hook the back, lower it, press flat' }
}

export const LOOP_MS = { toolhead: 4400, spine: 5000, lever: 2800, plate: 4800 }

// MuonUI src/panel/theme.ts values. Control passes its own bg, ink and accent.
export const SETUP_THEMES = {
  dark: { bg: '#000000', ink: '#f2f5f5', mute: '#8c989a', accent: '#80d6d1' },
  light: { bg: '#ffffff', ink: '#0f1719', mute: '#6a7679', accent: '#24958f' }
}

// The step to show: the highest-priority one still missing, or null.
// `missing` is a list or a Set of step names.
export function nextSetupStep (missing) {
  const has = s => missing instanceof Set ? missing.has(s) : Array.isArray(missing) && missing.indexOf(s) >= 0
  for (let i = 0; i < SETUP_STEPS.length; i++) if (has(SETUP_STEPS[i])) return SETUP_STEPS[i]
  return null
}

/* ------------------------------------------------------------------ maths */

const TAU = Math.PI * 2
const DEG = Math.PI / 180
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v
const seg = (t, a, b) => clamp01((t - a) / (b - a))
const lerp = (a, b, k) => a + (b - a) * k
const easeOut = k => 1 - Math.pow(1 - k, 3)
const easeIn = k => k * k * k
const easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
// Arrives a little past the end and comes back: the click.
const backOut = (k, c = 2.2) => 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2)
// The moving part fades in at the start of a loop and out at its end, so the loop never jumps.
const fade = (t, L) => Math.min(seg(t, 0, 220), 1 - seg(t, L - 260, L))

/* --------------------------------------------------------------- geometry */

const W_INK = 2.2; const W_ACC = 2.6; const W_MUTE = 1.6

// Traced silhouettes (KAN-6010 draft 2). Side view unless the name ends in B (back view).
// The plate's dock is at its top, packing position. plugA is the toolhead's tube
// connector past its end face (z 86.5), plugB the chassis end's, clip the plate's back clip.
const TRACE = {
  base: 'M-134 141L-134 149.5L-130 150L-129.5 151.5L-126 151.5L-125.5 154L-123.5 155L-118.5 154.5L-117.5 151.5L-1.5 151.5L-1 154L1 155L6 154.5L7 151.5L113.5 151.5L114.5 154.5L119.5 155L121.5 154L122 151.5L126.5 151.5L127 150L131 149.5L131 107L-89 107L-93 102.5L-94.5 102L-95 99.5L-99 96.5L-102 97L-105 101L-108 101L-109 87.5L-111.5 86L-120.5 86L-123 88.5L-123 140.5Z',
  knob: 'M-15.5 119.5L-15.5 138.5L-14 139L18 139L22 137L22 120.5L20.5 119L18.5 119L16 118L-11 118Z',
  head: 'M-15 75.5L-15 91.5L-14.5 93.5L-10.5 94L-10.5 106.5L86 106.5L86 75L66.5 75L65 74L45.5 74L44.5 75L7 75L5.5 74L1.5 74L0.5 72L-3 70L-5.5 72L-6 74L-14 74Z',
  plugA: 'M87.5 75L87.5 84.5L88 85L87.5 87L87.5 96.5L101 96.5L103 96L103.5 96.5L112.5 96.5L113 97L122.5 98L123 97L122.5 96L124.5 84.5L126 84L127 81.5L126.5 78.5L125.5 77.5L115 75.5Z',
  plugB: 'M64.5 116.5L64.5 145L74.5 145L86.5 142L97.5 141.5L99 139.5L98.5 121.5L97.5 120.5L92 120.5L91.5 120L85 119.5L78 116.5L72.5 115L68.5 115L67 116.5Z',
  spine: 'M-132 -109.5L-132.5 -107L-138 -107L-139.5 -108L-139.5 -107L-141.5 -105L-141.5 -102.5L-139.5 -100.5L-139.5 -93L-141.5 -91L-141.5 -88.5L-139.5 -86.5L-139.5 -71L-138.5 -71L-138.5 -86.5L-132 -86.5L-132 -2L-138 -1.5L-138.5 -0.5L-139.5 -0.5L-139.5 3.5L-141.5 5.5L-141.5 8L-139.5 10L-139.5 14L-138.5 14L-138 15L-132 15.5L-132 132.5L-138.5 132.5L-138.5 118L-139.5 118L-139.5 132.5L-141.5 134.5L-141.5 137L-139.5 139L-139.5 140L-138.5 140L-138 138.5L-132.5 138.5L-132 140L-114.5 140L-114.5 117L-112 116.5L-112 112L-114 111.5L-114 105L-117 104.5L-117 36.5L-114 35.5L-114 33.5L-117 33L-117 -52L-116 -52.5L-115.5 -57.5L-111.5 -57.5L-109.5 -59L-109 -60.5L-106 -60.5L-103.5 -62L-103 -65.5L-99.5 -65.5L-99.5 -82L-103 -82L-105 -84.5L-105.5 -100L-114 -100L-114.5 -106.5L-116.5 -107.5L-117.5 -109.5Z',
  clip: 'M-99 -82.5L-99 -65.5L-94.5 -65.5L-94 -66L-66.5 -66L-66.5 -69.5L-89.5 -69.5L-90 -70L-90 -73L-89.5 -73.5L-66.5 -73.5L-66.5 -82L-96.5 -82L-98 -83Z',
  glass: 'M-90 -73.5L-90 -70.5L-89.5 -70L89 -70L89.5 -70.5L89.5 -73.5Z',
  baseB: 'M-128.5 107L-128.5 149.5L-125.5 150L-125 151.5L-100.5 151.5L-100 154L-98 155L-94.5 155L-92.5 154L-92 151.5L-4.5 151.5L-4 154L-2 155L3 154.5L4 151.5L106.5 151.5L107 154L109 155L112.5 155L114.5 154L115 151.5L123.5 151.5L124 150L128 150L128 135.5L129.5 135L129.5 134L128.5 134L128.5 135L127 135.5L125 138.5L121 138.5L120 137L120 123.5L123.5 123L124 124.5L125 124.5L125 123.5L126.5 123L126.5 122L125 121.5L125 117.5L128 117L128 107L23.5 107L23 105.5L18.5 102.5L14.5 102L14 86L9 86L9 96L3.5 98.5L2.5 107L-3 107L-3.5 104L-6 102L-6.5 98.5L-9.5 98L-9.5 86L-14.5 86L-15 102L-20 103L-23 105.5L-23.5 107Z',
  knobB: 'M118.5 119L118.5 120L119.5 121L119.5 136.5L117.5 138.5L116 138.5L116 139L129 139L130.5 137.5L131 136L131 121L129 118.5L127.5 118L122 118L120 119Z',
  headB: 'M-125.5 97.5L-125 101.5L-122.5 104L-119.5 105L-115.5 104L-113.5 101.5L-52.5 101.5L-52 104.5L-48.5 104.5L-48 106.5L-23 106.5L-23 105L-21.5 104L-18.5 104L-17.5 105.5L-15 103.5L-15 86.5L-14 85.5L-9.5 85.5L-9 106.5L-5 107L-5 110L-6 111L5.5 111L3 109L3 98.5L8 98.5L8.5 106.5L8.5 86L13.5 85.5L14.5 86.5L14.5 103.5L17 105.5L17.5 103L19.5 101.5L113 101.5L114.5 103.5L119.5 105L123 103.5L125 100L125 96.5L123.5 94L119 92L116 92.5L113 95.5L22.5 95.5L22 76L20.5 75L8.5 75L7 74L3.5 74L3 72.5L-0.5 70L-4 72L-5 74L-17 74L-18 75L-51.5 75L-52.5 95.5L-113.5 95.5L-115 93.5L-120 92L-122.5 93ZM-2.5 117L-2 122L-3.5 126.5L5.5 126.5L6 131.5L8 131.5L8.5 117.5Z',
  leverB: 'M-10 101L-14 102.5L-15.5 102.5L-18 103.5L-20 103.5L-20.5 104L-24 104L-24.5 104.5L-28 104.5L-28.5 105L-32 105L-32.5 105.5L-34 105.5L-37 107.5L-42 114.5L-42 116L-41 117L-40 117L-34.5 111L-31 109.5L-26 109.5L-25.5 110L-10 110Z',
  spineB: 'M-9 -109.5L-9 -100.5L-15 -100L-15 -67L-20.5 -66.5L-20 -58.5L-9 -57.5L-9.5 123.5L-15 123.5L-15 117.5L-31 117.5L-31 126L-29 129L-20 138L-16 140L16 140L20 137.5L29.5 127.5L30.5 125.5L30.5 117L31.5 116.5L31.5 112L29.5 111.5L29.5 105.5L26 104.5L26 21.5L21.5 21.5L21.5 104.5L14.5 105L8.5 100L8.5 -57.5L20.5 -57.5L20.5 -52.5L21.5 -52L21.5 7L25.5 7.5L26 6L24 5.5L24 1.5L26 1L26 -52L27 -52.5L27.5 -57.5L31 -57.5L32 -59L33.5 -59L33.5 -66.5L32 -67L32 -72.5L26 -73L26 -85.5L30.5 -86L30.5 -96.5L22.5 -104.5L19 -107L14 -109Z',
}
const HOSE = [100.2, 130.3, 108.2, 131.1, 119.7, 132, 131.2, 133.2, 142.6, 135.5, 153.5, 138.8, 164.8, 142.8, 176.1, 146.1, 187.8, 148.4, 199.4, 149.4, 210.5, 149.9, 220.7, 148.6, 228.6, 145.9, 234.3, 141.3, 237.8, 136, 238.3, 129.9, 235.5, 123, 230.6, 116.5, 222.8, 110.4, 213.2, 105.2, 202.8, 100.6, 191.5, 97.3, 179.8, 94.8, 168.5, 93.8, 155.3, 92.5, 144.1, 92.1, 132.4, 91, 124.9, 90.3]
const HOSE_R = 8.4 // the tube's radius
const OUT = 22; const NEAR = 5 // a plug's travel out of its socket, and where it waits before the click
const HINGE_U = -118.4; const HINGE_V = 136.4 // the spine's foot (the model's hinge point)
const LIFT = 75 // how far the spine stands above its seat before it slides down
const PVU = -97.5; const PVV = -71.7 // the bar on the plate's clip, where it docks
const PLATE_IN = 60 * DEG; const PLATE_REST = 30 * DEG
const LVU = -11; const LVV = 106 // lever pivot (back view)
const LEVER_UP = 55 * DEG

let P = null
// Built once, on the first frame (not at import, so the module loads without a DOM).
function paths () {
  if (P) return P
  P = {}
  for (const k in TRACE) P[k] = new Path2D(TRACE[k])
  P.plate = new Path2D(TRACE.glass + TRACE.clip)
  P.bar = new Path2D(); P.bar.arc(PVU, PVV, 2.6, 0, TAU)
  P.screw = new Path2D(); P.screw.moveTo(-120.5, 108); P.screw.lineTo(-120.5, 70)
  for (let v = 104; v > 72; v -= 4) { P.screw.moveTo(-122.6, v); P.screw.lineTo(-118.4, v - 1.8) }
  return P
}

/* ---------------------------------------------------------------- drawing */

// One reused frame record: nothing is allocated per frame.
const K = { c: null, u: 1, s: 1, ox: 0, oy: 0, ga: 1, ink: '', mute: '', accent: '', bg: '' }

function begin (cx, cy, s) {
  const c = K.c; const z = s * K.u
  c.save(); c.translate(K.ox, K.oy); c.scale(z, z); c.translate(-cx, -cy); K.s = s
}
const end = () => K.c.restore()
// A stroke width given in design px (of a 480 px screen), in drawing units.
const lw = w => Math.max(w * K.u, 1.2) / (K.s * K.u)

function st (path, col, w, a) {
  const c = K.c
  c.globalAlpha = K.ga * a; c.strokeStyle = col; c.lineWidth = lw(w)
  if (path) c.stroke(path); else c.stroke()
}
function fl (path, col, a) { const c = K.c; c.globalAlpha = K.ga * a; c.fillStyle = col; c.fill(path) }
// A part: its silhouette hides what is behind it, then its outline is drawn.
// `solid` fills it with its own colour instead.
function part (path, col, w, a, solid) {
  if (solid) return fl(path, col, a)
  fl(path, K.bg, Math.min(1, a * 1.6)); st(path, col, w, a)
}
// The same, moved by (du, dv) and turned by `rot` about (pu, pv).
function partAt (path, pu, pv, rot, du, dv, col, w, a, solid) {
  const c = K.c
  c.save(); c.translate(pu + du, pv + dv); if (rot) c.rotate(rot); c.translate(-pu, -pv)
  part(path, col, w, a, solid)
  c.restore()
}

// A little arrow with its tip at (x, y). `len` 0 draws the head alone.
function arrow (x, y, ang, a, len) {
  if (a <= 0.02) return
  const c = K.c; const q = 1 / K.s; const ca = Math.cos(ang); const sa = Math.sin(ang); const h = 6.5 * q
  c.beginPath()
  if (len) { c.moveTo(x - ca * len * q, y - sa * len * q); c.lineTo(x, y) }
  c.moveTo(x - ca * h + sa * h * 0.85, y - sa * h - ca * h * 0.85); c.lineTo(x, y); c.lineTo(x - ca * h - sa * h * 0.85, y - sa * h + ca * h * 0.85)
  st(null, K.accent, W_ACC, a)
}
// An arrow moves forward and fades; another comes in behind it.
function flow (x, y, ang, travel, ph, env, rm) {
  for (let i = 0; i < 2; i++) {
    if (rm && i) break
    const p = rm ? 0.5 : (ph + i * 0.5) % 1
    const d = (p - 0.5) * travel
    arrow(x + Math.cos(ang) * d, y + Math.sin(ang) * d, ang, rm ? env : env * Math.min(1, 1.5 * Math.sin(Math.PI * p)), 12)
  }
}
// The same along an arc, from angle a0 to a1 about (cx, cy).
function arcFlow (cx, cy, r, a0, a1, n, ph, env, rm) {
  const turn = a1 > a0 ? Math.PI / 2 : -Math.PI / 2
  for (let i = 0; i < n; i++) {
    const p = rm ? (i + 0.5) / n : (ph + i / n) % 1
    const al = lerp(a0, a1, p)
    arrow(cx + Math.cos(al) * r, cy + Math.sin(al) * r, al + turn, rm ? env : env * Math.min(1, 1.6 * Math.sin(Math.PI * p)), 9)
  }
}
// The click: three short marks that spring out and fade.
function tick (x, y, ang, age) {
  if (age < 0 || age > 520) return
  const c = K.c; const k = age / 520; const q = 1 / K.s
  const r0 = (6 + 7 * easeOut(k)) * q; const r1 = r0 + (7 * (1 - k) + 1.5) * q
  c.beginPath()
  for (let i = -1; i <= 1; i++) { const a = ang + i * 0.55; c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1) }
  st(null, K.accent, W_ACC, 1 - k * k)
}

// The umbilical: the tube along its real centre line, from the chassis (first
// point) round to the front of the toolhead (last), a plug at each end. dA is how
// far the toolhead's plug is out, dB the chassis one; the tube follows as the
// model's own does, each point by its share of either end.
function hose (dA, dB, col, a) {
  const c = K.c; const n = HOSE.length / 2
  c.beginPath()
  let pu = 0; let pv = 0
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1); const w = s * s * (3 - 2 * s)
    const u = HOSE[i * 2] + w * dA + (1 - w) * dB; const v = HOSE[i * 2 + 1]
    if (!i) c.moveTo(u - 4, v)
    else if (i === n - 1) { c.quadraticCurveTo(pu, pv, u, v); c.lineTo(u + 3, v) } else c.quadraticCurveTo(pu, pv, (pu + u) / 2, (pv + v) / 2)
    pu = u; pv = v
  }
  const e = lw(W_ACC)
  c.lineCap = 'butt'
  c.globalAlpha = K.ga * a; c.strokeStyle = col; c.lineWidth = HOSE_R * 2 + e; c.stroke()
  c.strokeStyle = K.bg; c.lineWidth = HOSE_R * 2 - e; c.stroke()
  c.lineCap = 'round'
  const solid = col === K.accent
  partAt(P.plugA, 0, 0, 0, dA, 0, col, W_ACC, a, solid); partAt(P.plugB, 0, 0, 0, dB, 0, col, W_ACC, a, solid)
}

// Everything already in place, from the side. `a` dims it behind the close-up.
function printer (a, withHose, withSpine) {
  part(P.head, K.ink, W_INK, a); part(P.base, K.ink, W_INK, a); st(P.knob, K.ink, W_INK, a)
  if (withSpine) part(P.spine, K.ink, W_INK, a)
  if (withHose) hose(0, 0, K.mute, a)
}

/* ----------------------------------------------------------- 1. toolhead */

// One end: pushed almost in, a breath, then the last bit snaps.
const plugAt = (t, t0) => t < t0 ? OUT : t < t0 + 800 ? lerp(OUT, NEAR, easeOut((t - t0) / 800)) : t < t0 + 950 ? NEAR : NEAR * (1 - backOut(seg(t, t0 + 950, t0 + 1110)))
const pushEnv = (t, t0) => seg(t, t0, t0 + 120) * (1 - seg(t, t0 + 840, t0 + 960))

function sceneToolhead (t, rm) {
  const A0 = 300; const B0 = 1750
  begin(67, 112, 0.84)
  printer(1, false, false)
  if (rm) {
    hose(13, 13, K.accent, 1)
    flow(120, 62, Math.PI, 0, 0, 1, true); flow(96, 168, Math.PI, 0, 0, 1, true)
  } else {
    const dA = plugAt(t, A0); const dB = plugAt(t, B0)
    hose(dA, dB, K.accent, fade(t, LOOP_MS.toolhead))
    flow(108 + dA, 62, Math.PI, 15, (t - A0) / 520, pushEnv(t, A0), false)
    flow(84 + dB, 168, Math.PI, 15, (t - B0) / 520, pushEnv(t, B0), false)
    tick(88, 72, -2.1, t - A0 - 1040); tick(64, 112, -2.1, t - B0 - 1040)
  }
  end()
}

/* -------------------------------------------------------------- 2. spine */

function gear (cx, cy, rx, ry, rot, col, a) {
  const c = K.c
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU)
  for (let i = 0; i < 10; i++) { const g = rot + i * TAU / 10; const ca = Math.cos(g); const sa = Math.sin(g); c.moveTo(cx + ca * rx, cy + sa * ry); c.lineTo(cx + ca * rx * 1.26, cy + sa * ry * 1.26) }
  c.moveTo(cx + rx * 0.22, cy); c.ellipse(cx, cy, rx * 0.22, ry * 0.22, 0, 0, TAU)
  st(null, col, W_ACC, a)
}

// The foot of the spine, close up and cut away: the gear at the bottom of the
// lead screw comes down beside the printer's own. A diagram, not a tracing.
function spineFoot (dv, rot, wig, t) {
  part(P.base, K.ink, W_INK, 1)
  const c = K.c
  c.save(); c.translate(0, dv); st(P.spine, K.accent, W_ACC, 0.45); st(P.screw, K.accent, W_MUTE, 1); c.restore()
  gear(-104.5, 113, 8, 3, 0.2, K.ink, 1)
  const gy = 113 + dv
  gear(-120.5, gy, 8, 3, rot, K.accent, 1)
  if (wig > 0.02) {
    // A double-headed arrow round the front of the gear, shuttling with it.
    const mid = Math.PI / 2 - rot * 1.1; const a0 = mid - 0.62; const a1 = mid + 0.62; const rx = 13.5; const ry = 7
    c.beginPath(); c.ellipse(-120.5, gy, rx, ry, 0, a0, a1); st(null, K.accent, W_ACC, wig)
    arrow(-120.5 + Math.cos(a0) * rx, gy + Math.sin(a0) * ry, Math.atan2(-ry * Math.cos(a0), rx * Math.sin(a0)), wig, 0)
    arrow(-120.5 + Math.cos(a1) * rx, gy + Math.sin(a1) * ry, Math.atan2(ry * Math.cos(a1), -rx * Math.sin(a1)), wig, 0)
  }
  tick(-112.5, 109, -1.2, t - 3860)
}

function sceneSpine (t, rm) {
  const c = K.c; const L = LOOP_MS.spine
  let th = 0; let up = 50; let fd = 1; let z = 0; let rot = 0; let wig = 0; let lift = 1
  if (!rm) {
    fd = fade(t, L)
    lift = easeInOut(seg(t, 350, 1450)); th = Math.PI / 2 * (1 - lift)
    up = LIFT - (LIFT - 8) * easeOut(seg(t, 1600, 2300)) - 8 * backOut(seg(t, 3700, 3880))
    z = easeInOut(seg(t, 2250, 2700)) * (1 - easeInOut(seg(t, 4050, 4450)))
    wig = seg(t, 2700, 2850) * (1 - seg(t, 3600, 3720))
    rot = 0.42 * Math.sin((t - 2750) / 950 * TAU * 2.5) * wig
  }
  const dim = 1 - 0.8 * z
  begin(53, -13, 0.76)
  printer(dim, true, false)
  partAt(P.spine, HINGE_U, HINGE_V, th, 0, -up, K.accent, W_ACC, fd * dim)
  if (rm) flow(-86, 0, Math.PI / 2, 0, 0, 1, true)
  else {
    // Arrows lead the spine up, then run down beside it.
    const al = th - Math.PI / 2
    arcFlow(HINGE_U, HINGE_V - LIFT, 205, al - 0.14, al - 0.62, 2, t / 640, fd * dim * seg(t, 300, 450) * (1 - seg(lift, 0.55, 0.9)), false)
    flow(-86, 20 - up, Math.PI / 2, 16, (t - 1500) / 520, dim * seg(t, 1500, 1620) * (1 - seg(t, 2150, 2300)), false)
  }
  end()
  if (z > 0.01) {
    // The close-up opens from the foot of the spine as a round lens.
    const u = K.u; const lx = lerp(-135, 0, z) * u; const ly = lerp(96, 14, z) * u; const r = 124 * z * u
    c.save(); c.translate(K.ox + lx, K.oy + ly)
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.globalAlpha = K.ga; c.fillStyle = K.bg; c.fill()
    c.save(); c.clip()
    const zs = 5.6 * (0.6 + 0.4 * z)
    c.scale(zs * u, zs * u); c.translate(113, -108); K.s = zs
    spineFoot(-up, rot, wig, t)
    c.restore()
    K.s = 1 / u
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.globalAlpha = K.ga * z; c.strokeStyle = K.mute; c.lineWidth = Math.max(W_MUTE * u, 1.2); c.stroke()
    c.restore()
  }
}

/* -------------------------------------------------------------- 3. lever */

// From behind, closer in: the base runs off both sides and the spine off the top.
function sceneLever (t, rm) {
  let ph = LEVER_UP; let fd = 1
  begin(-4, 62, 1.5)
  part(P.headB, K.ink, W_INK, 1); part(P.baseB, K.ink, W_INK, 1); st(P.knobB, K.ink, W_INK, 1); part(P.spineB, K.ink, W_INK, 1)
  if (rm) {
    st(P.leverB, K.accent, W_ACC, 0.45)
    arcFlow(LVU, LVV, 40, Math.PI + LEVER_UP - 0.12, Math.PI + 0.3, 2, 0, 1, true)
  } else {
    fd = fade(t, LOOP_MS.lever)
    ph = LEVER_UP * (1 - 0.88 * easeInOut(seg(t, 350, 1150)))
    ph *= 1 - backOut(seg(t, 1180, 1330))
    arcFlow(LVU, LVV, 40, Math.PI + LEVER_UP - 0.08, Math.PI + 0.3, 2, t / 620, fd * (1 - seg(t, 1100, 1260)), false)
    tick(LVU - 34, LVV + 2, Math.PI + 0.9, t - 1290)
  }
  partAt(P.leverB, LVU, LVV, ph, 0, 0, K.accent, W_ACC, fd, true)
  end()
}

/* -------------------------------------------------------------- 4. plate */

function scenePlate (t, rm) {
  let ph = PLATE_REST; let fd = 1; let off = 0
  begin(53, -40, 0.74)
  printer(1, true, true)
  if (rm) {
    st(P.plate, K.accent, W_ACC, 0.45)
    arcFlow(PVU, PVV, 200, -PLATE_REST + 0.03, -0.04, 2, 0, 1, true)
  } else {
    fd = fade(t, LOOP_MS.plate)
    off = 1 - easeOut(seg(t, 200, 950))
    // Down to 30 degrees and a small settle; a light push; then the magnets take it.
    const sw = easeInOut(seg(t, 1050, 2150))
    const settle = t > 2150 ? 1.6 * DEG * Math.exp(-(t - 2150) / 110) * Math.sin((t - 2150) / 45) : 0
    ph = lerp(PLATE_IN, PLATE_REST, sw) - settle
    ph -= 9 * DEG * easeInOut(seg(t, 2700, 2920))
    ph -= 21 * DEG * easeIn(seg(t, 2920, 3060))
    if (t > 3060) ph = 1.1 * DEG * Math.exp(-(t - 3060) / 70) * Math.abs(Math.sin((t - 3060) / 38))
    arcFlow(PVU, PVV, 200, -PLATE_IN + 0.04, -0.05, 4, t / 1500, fd * seg(t, 150, 400) * (1 - seg(t, 3000, 3250)), false)
    tick(PVU + 2, PVV - 16, -Math.PI / 2 - 0.5, t - 940)
    tick(PVU + 120, PVV - 8, -Math.PI / 2, t - 3060)
  }
  partAt(P.plate, PVU, PVV, -ph, 22 * off, -30 * off, K.accent, W_ACC, fd)
  partAt(P.bar, PVU, PVV, -ph, 22 * off, -30 * off, K.accent, W_ACC, fd, true)
  end()
}

const SCENES = { toolhead: sceneToolhead, spine: sceneSpine, lever: sceneLever, plate: scenePlate }

/* -------------------------------------------------------------------- api */

/**
 * Draws one frame of a setup animation into a `size` x `size` square at the
 * ctx's origin. Stateless: the same `tMs` always gives the same frame, and any
 * `tMs` is taken modulo the step's loop.
 *
 * opts:
 *   size           side of the square, px (default 480)
 *   theme          'dark' | 'light' (default 'dark')
 *   reducedMotion  true draws one clear still with arrows
 *   accent, ink, mute, bg   colour overrides. `bg` must match the surface the
 *                  drawing sits on: nearer parts are filled with it to hide
 *                  what is behind them.
 *   background     false leaves the square unpainted (default: filled with bg)
 *   label          true writes the step's title and hint under a smaller
 *                  drawing, placed for the round screen (default false)
 *   fonts          { title, hint } CSS font strings sized for a 480 px screen
 */
export function drawSetup (ctx, step, tMs, opts) {
  const scene = SCENES[step]
  if (!scene) return
  const o = opts || {}
  const size = o.size || 480
  const th = SETUP_THEMES[o.theme === 'light' ? 'light' : 'dark']
  const label = !!o.label
  const u = size / 480
  paths()
  ctx.save()
  K.c = ctx; K.ga = ctx.globalAlpha
  K.ink = o.ink || th.ink; K.mute = o.mute || th.mute; K.accent = o.accent || th.accent; K.bg = o.bg || th.bg
  K.u = u * (label ? 1 : 1.3); K.ox = size / 2; K.oy = size * (label ? 0.425 : 0.5)
  if (o.background !== false) { ctx.fillStyle = K.bg; ctx.fillRect(0, 0, size, size) }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const L = LOOP_MS[step]
  const rm = !!o.reducedMotion
  scene(rm ? 0 : ((tMs % L) + L) % L, rm)
  if (label) {
    const m = SETUP_MESSAGES[step]; const f = o.fonts || {}
    ctx.globalAlpha = K.ga; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.save(); ctx.translate(size / 2, 0); ctx.scale(u, u)
    ctx.font = f.title || '400 16px "Krona One", sans-serif'; ctx.fillStyle = K.ink; ctx.fillText(m.title, 0, 393)
    ctx.font = f.hint || '400 11px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillStyle = K.mute; ctx.fillText(m.hint.toUpperCase(), 0, 419)
    ctx.restore()
  }
  ctx.restore()
  K.c = null
}
