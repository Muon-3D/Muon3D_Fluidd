import { THREE, m1, type M1Root } from './load'
import { placeModel, type Calibration, type ModelPlacement, type ModelPose } from './pose'
import type { Toolpath } from './toolpath'
import type { LiveSync } from './live-sync'
import { middleHeight, stripsLit, tapColour, tapKey, type LedStrip, type PlateTap, type ScreenState } from './live-state'
import { Y_TOWARD_FRONT } from '@/services/machine/orientation'
import { buildAccessories } from './accessory-parts'
import { CROSSFADE_MS, type AccessoryFrame } from './accessory-motion'
import { CONTENTS_ORDER, flattenGlass } from './glass-material'
import { createRenderGate } from './render-gate'
import { createFrameLoop } from './frame-loop'
import { FrameWatch, wantsCheapGlass } from './glass-cost'
import { glassChoice } from './render-options'
import { liveRenderOptions, modelSettings } from './device-settings'
import { placeAccurate } from './accurate/klipper-map'
import type { AccurateRig } from './accurate/rig'
import { LEAN_LIMIT, NO_LEAN, PART_IDS, leanToward, partMeshes, partOf, type Lean, type PartId } from './parts'
import { PartLight, type LightMode } from './part-light'

/** Frees a model's GPU resources: geometries, materials, their textures, and a rigged mesh's bone texture. */
function disposeTree (root: THREE.Object3D) {
  root.traverse(o => {
    const mesh = o as THREE.SkinnedMesh
    mesh.geometry?.dispose()
    if (mesh.isSkinnedMesh) mesh.skeleton?.dispose()
    for (const m of ([] as THREE.Material[]).concat(mesh.material ?? [])) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose()
      m.dispose()
    }
  })
}

/**
 * The live M1 on a stage: the photoreal model, lit as its product shots
 * are, in front of the stage's own backdrop. It follows its printer through
 * a LiveSync (live-sync.ts), drawing up to 30 times a second while anything
 * moves and not at all while nothing does, so an idle printer costs nothing.
 * A mouse drag turns it; touch is left to the page, so a phone still
 * scrolls past it.
 *
 * The lighting and the studio environment follow the model's own viewer
 * (m1-model/src/04-viewer.js), which measured them against the photographs.
 */
export interface M1Viewer {
  /** The printer to follow: where its head is, its print, the lines no file drew. */
  follow: (sync: LiveSync) => void;
  /** Something changed that the sync will show: draw. */
  wake: () => void;
  /** The print to draw under the plate, in the printer's millimetres, or null for none; its colour is also the loose lines'. */
  setPrint: (path: Toolpath | null, colour: number) => void;
  /** What the base's round screen shows. */
  setScreen: (screen: ScreenState) => void;
  /** The LED strips (Klipper's color_data for `neopixel Left` and `neopixel Right`), or nulls to go by the light alone. */
  setLeds: (left: LedStrip, right: LedStrip) => void;
  /** The touches of the plate to mark; a new one pulses. */
  setTaps: (taps: PlateTap[]) => void;
  /** Draws while shown; stops drawing while scrolled away or hidden. */
  setActive: (active: boolean) => void;
  /** Reads the stage's colours again, after the theme changes. */
  restyle: () => void;
  /** Moves the machine left by this share of the stage's width, to clear something on the right. */
  setShift: (share: number) => void;
  /** Called after each frame drawn; the first means it can be shown. */
  onFrame: (() => void) | null;
  /** Called after every frame drawn with the model shown and the accessories as drawn (for the page's data attributes and tests). */
  onDraw: ((drawn: DrawnState) => void) | null;
  /** The part under this point of the page (clientX, clientY), if any. */
  pick: (x: number, y: number) => PartId | null;
  /** Lights a part (or none) and, with `lean`, leans the camera toward it; with none, the camera eases back. */
  setFocus: (part: PartId | null, mode: LightMode, lean: boolean) => void;
  /** Where a part's middle is drawn, in CSS pixels from the canvas's top left, or null if this model hasn't it. */
  anchor: (part: PartId) => { x: number, y: number } | null;
  /**
   * 'top' looks straight down, the front of the printer at the bottom and X
   * to the right (as the jog buttons are seen from above), with the plate
   * hidden so the head shows; 'screen' flies in square-on to the printer's
   * screen, close; 'free' goes back to where the person had it.
   */
  setView: (mode: 'free' | 'top' | 'screen') => void;
  /** Whether a mouse drag turns the model (off while a drag moves a part instead). */
  setOrbit: (on: boolean) => void;
  /** Whether this is the accurate model, the one whose millimetres a drag can be read in. */
  readonly accurate: boolean;
  /** A world point, in CSS pixels from the canvas's top left. */
  project: (p: { x: number, y: number, z: number }) => { x: number, y: number } | null;
  /** Where the ray under this page point (clientX, clientY) meets the level plane at world height `y`, or null. */
  onLevel: (x: number, y: number, planeY: number) => { x: number, y: number, z: number } | null;
  /** Where that ray meets the upright plane through `through`, turned to face the camera, or null. */
  onUpright: (x: number, y: number, through: { x: number, y: number, z: number }) => { x: number, y: number, z: number } | null;
  dispose: () => void;
}

/** What a frame drew: which model, and the plate, hose, column and filament as placed. */
export interface DrawnState {
  model: 'pending' | 'accurate' | 'simple';
  accessories: AccessoryFrame | null;
}

/** Seen from the mast side and a little above, as the s1_1 product shot is. */
const VIEW = { theta: -0.366, phi: 1.033 }
/** From well above down to a little under the plate, where the print hangs. */
const PHI_RANGE = [0.72, 1.62]
/** Following the printer, a frame at most this often (30 a second); a turn by hand draws every frame. */
const FRAME_MS = 1000 / 30
/** A new mark on the plate swells and settles over this long. */
const PULSE_MS = 900
/** The most marks on the plate at once. */
const MAX_TAPS = 256

/** The share of the stage the machine fills, edge to edge. */
const FILL = 0.86
/** Straight down, nearly: exactly 0 has no "up" to look along. */
const TOP_PHI = 0.0015
/** Flying in to the screen, it fills this share of the stage's height; each frame closes this share of the gap. */
const SCREEN_FILL = 0.62
const ZOOM_EASE = 0.16
/** Each frame the lean closes this share of the gap: about 450 ms to settle at 30 frames a second, easing out. */
const LEAN_EASE = 0.16

/** The accurate model gets this long to load before the simple one is shown instead. */
const ACCURATE_TIMEOUT_MS = 20000

/**
 * The model on the stage, whichever it is: the accurate M1 (a GLB, loaded
 * when the view first opens) or the simple one built in code, which is also
 * what shows if the GLB can't load.
 */
interface Rig {
  kind: 'pending' | 'accurate' | 'simple';
  root: THREE.Object3D;
  /** The plate and what hangs from it: the print, the loose lines, the touches. */
  cargo: THREE.Object3D;
  /** Print coordinates to the cargo's space. */
  printFrame: THREE.Matrix4;
  place: (pose: ModelPose) => ModelPlacement;
  /** Poses the model and lights its strips. */
  show: (placement: ModelPlacement, led: boolean) => void;
  setSpool: (shown: boolean) => void;
  setScreen: (screen: ScreenState) => void;
  setLeds: (left: LedStrip, right: LedStrip) => void;
  apply: (accessories: AccessoryFrame, partGone: boolean) => void;
  plateOff: () => number;
  plateOffBox: THREE.Box3;
  setColour: (colour: number) => void;
  /** Swaps the transmissive glass for a plain one, if this model has any. */
  useCheapGlass: () => void;
}

/** ?m1glass=cheap or real forces the glass plate's kind, for measuring; otherwise the device decides. */
function glassOverride (): 'cheap' | 'real' | null {
  try {
    const v = new URLSearchParams(location.search).get('m1glass')
    return v === 'cheap' || v === 'real' ? v : null
  } catch {
    return null
  }
}

/** Whether the page asked for the simple model: ?m1model=simple, or localStorage m1model=simple. */
function wantsSimpleModel (): boolean {
  try {
    return new URLSearchParams(location.search).get('m1model') === 'simple' || localStorage.getItem('m1model') === 'simple'
  } catch {
    return false
  }
}

/** The studio the model is lit by: a soft sky, a grey horizon and a darker floor, with softboxes. */
function studioEnv (renderer: THREE.WebGLRenderer): THREE.Texture {
  const W = 1024
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d') as CanvasRenderingContext2D
  const sky = 0.86
  const floor = 1.30
  const lift = (hex: string, w: number) => {
    const n = parseInt(hex.slice(1), 16)
    const k = (v: number) => Math.round(Math.min(255, Math.max(0, v * w)))
    return `rgb(${k(n >> 16 & 255)},${k(n >> 8 & 255)},${k(n & 255)})`
  }
  const g = x.createLinearGradient(0, 0, 0, H)
  const stops: Array<[number, string, number]> = [
    [0.00, '#ffffff', sky], [0.20, '#fcfbf9', sky], [0.245, '#f8f7f4', sky], [0.255, '#c4c3be', sky],
    [0.40, '#9e9d99', floor], [0.46, '#7d7c77', floor], [0.54, '#6a6964', floor], [0.62, '#8a8985', floor],
    [0.72, '#aba9a5', floor], [0.86, '#bfbdb9', floor], [1.00, '#c7c5c1', floor]
  ]
  for (const [at, hex, w] of stops) g.addColorStop(at, lift(hex, w))
  x.fillStyle = g
  x.fillRect(0, 0, W, H)

  const softbox = (cx: number, cy: number, w: number, h: number, level: number, tint?: string) => {
    if (cy < H * 0.45 && !tint) level *= sky
    const r = Math.max(w, h) / 2
    const grad = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, tint ?? `rgba(255,255,255,${level})`)
    grad.addColorStop(0.55, `rgba(255,255,255,${level * 0.55})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = grad
    x.save()
    x.translate(cx, cy)
    x.scale(w / (2 * r), h / (2 * r))
    x.beginPath()
    x.arc(0, 0, r, 0, Math.PI * 2)
    x.fill()
    x.restore()
  }
  softbox(W * 0.24, H * 0.17, 440, 280, 1.0)
  softbox(W * 0.24, H * 0.15, 190, 120, 1.0)
  softbox(W * 0.72, H * 0.28, 500, 320, 0.66)
  softbox(W * 0.72, H * 0.25, 170, 110, 0.9)
  softbox(W * 0.96, H * 0.13, 180, 120, 0.95)
  softbox(W * 0.02, H * 0.13, 180, 120, 0.95)
  softbox(W * 0.50, H * 0.40, 380, 150, 0.26, 'rgba(244,242,238,0.55)')
  softbox(W * 0.50, H * 0.02, 900, 180, 0.7)

  const texture = new THREE.CanvasTexture(c)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const env = pmrem.fromEquirectangular(texture).texture
  pmrem.dispose()
  texture.dispose()
  return env
}

/**
 * The box round what is drawn. Box3.setFromObject counts hidden parts too
 * (the spool, the print), and a part is hidden when any group above it is,
 * so each mesh's whole chain is checked.
 */
function shownBox (root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3()
  const part = new THREE.Box3()
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    for (let p: THREE.Object3D | null = mesh; p && p !== root.parent; p = p.parent) if (!p.visible) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    part.copy(mesh.geometry.boundingBox as THREE.Box3).applyMatrix4(mesh.matrixWorld)
    box.union(part)
  })
  return box
}

/** The distance at which the box fills `FILL` of the view, and how far off-centre it then sits. */
function fit (camera: THREE.PerspectiveCamera, box: THREE.Box3, target: THREE.Vector3, dir: THREE.Vector3) {
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(i => new THREE.Vector3(
    i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z))
  const extent = (distance: number) => {
    camera.position.copy(target).addScaledVector(dir, distance)
    camera.lookAt(target)
    camera.updateMatrixWorld(true)
    let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity
    for (const c of corners) {
      const p = c.clone().project(camera)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y)
    }
    return { x0, x1, y0, y1 }
  }
  let lo = 100
  let hi = 20000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const e = extent(mid)
    if (Math.max(e.x1 - e.x0, e.y1 - e.y0) / 2 > FILL) lo = mid
    else hi = mid
  }
  const e = extent(hi)
  return { distance: hi, centre: [(e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2] }
}

/** The stage's colours, middle out, from the theme (muon3d.scss's --m3d-stage-*). */
function stageColours (el: Element): [string, string, string] {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return [read('--m3d-stage-hi', '#eceef0'), read('--m3d-stage-mid', '#d8dbdf'), read('--m3d-stage-lo', '#c4c8cd')]
}

/**
 * The stage's backdrop (PrinterStage's radial gradient, in the theme's
 * colours), drawn into the scene. The glass plate refracts what's behind
 * it, so the scene needs an opaque background to see through; on a
 * transparent one the plate turns milky white.
 */
function stageBackdrop (width: number, height: number, colours: [string, string, string]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.round(width / 4))
  c.height = Math.max(2, Math.round(height / 4))
  const x = c.getContext('2d') as CanvasRenderingContext2D
  // radial-gradient(120% 90% at 50% 40%, hi 0%, mid 62%, lo 100%)
  x.translate(c.width * 0.5, c.height * 0.4)
  x.scale(1.2 * c.width, 0.9 * c.height)
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, colours[0])
  g.addColorStop(0.62, colours[1])
  g.addColorStop(1, colours[2])
  x.fillStyle = g
  x.fillRect(-1, -1, 2, 2)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Measures the built model with the head centred and the bed at the bottom:
 * the plate's edges and underside, and the nozzle tip (the highest brass on
 * the head). From these the printer's millimetres place the head and the
 * bed (pose.ts), and the print hangs from the plate in the same
 * millimetres: `printFrame` takes a point (x, y, z) to the bed's own space,
 * x from the plate's left edge, y from the edge orientation.ts names, z down
 * from its underside.
 */
function calibrate (model: M1Root, mats: Record<string, THREE.Material>) {
  const dim = m1().DIM
  Object.assign(model.userData.state, { headX: 0, headZ: 0, z: 0, fold: 0 })
  model.userData.apply()
  model.updateMatrixWorld(true)

  const plate = new THREE.Box3().setFromObject(model.getObjectByName('glassPlate') as THREE.Object3D)
  let tip: THREE.Box3 | null = null
  ;(model.userData.pod as THREE.Object3D).traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || mesh.material !== mats.brass) return
    const box = new THREE.Box3().setFromObject(mesh)
    if (!tip || box.max.y > tip.max.y) tip = box
  })
  const tipBox = (tip ?? new THREE.Box3(new THREE.Vector3(), new THREE.Vector3())) as THREE.Box3
  const tipCentre = tipBox.getCenter(new THREE.Vector3())

  const cal: Calibration = {
    plateLeft: plate.min.x,
    plateFront: plate.max.z,
    plateBack: plate.min.z,
    plateUnderside: plate.min.y,
    nozzleX: tipCentre.x,
    nozzleZ: tipCentre.z,
    tipTop: tipBox.max.y,
    travelX: dim.travelX,
    travelZ: dim.travelZ,
    bedTravel: dim.bedTravel
  }

  const bed = (model.getObjectByName('bedLift') as THREE.Object3D).getWorldPosition(new THREE.Vector3())
  // Y from the plate's back edge toward the front (orientation.ts): with Z
  // building down, that keeps the part as it was sliced rather than mirrored.
  const printFrame = new THREE.Matrix4().set(
    1, 0, 0, plate.min.x - bed.x,
    0, 0, -1, plate.min.y - bed.y,
    0, Y_TOWARD_FRONT ? 1 : -1, 0, (Y_TOWARD_FRONT ? plate.min.z : plate.max.z) - bed.z,
    0, 0, 0, 1
  )
  return { cal, printFrame }
}

/** Puts the live M1 on `canvas`. Throws when the browser can't draw WebGL; the stage then keeps its picture. */
export function createViewer (canvas: HTMLCanvasElement): M1Viewer {
  // Marks for the browser's performance timeline: how long the build, the shaders and the first frame take on this device.
  performance.mark('m1:create')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const env = studioEnv(renderer)
  scene.environment = env

  const key = new THREE.DirectionalLight(0xffffff, 2.55)
  key.position.set(-520, 780, 640)
  // Settings › G-code preview and 3D › Detail: Low draws without the shadow.
  const detail = liveRenderOptions(canvas.clientWidth)
  key.castShadow = detail.shadows
  key.shadow.mapSize.set(detail.shadowMapSize, detail.shadowMapSize)
  Object.assign(key.shadow.camera, { near: 20, far: 2600, left: -420, right: 420, top: 480, bottom: -180 })
  key.shadow.bias = -0.0006
  key.shadow.normalBias = 1.35
  key.shadow.radius = 5
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xf6f4f1, 0.52)
  fill.position.set(700, 380, 300)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.60)
  rim.position.set(180, 460, -840)
  scene.add(rim)
  scene.add(new THREE.HemisphereLight(0xfffdf9, 0xa8a6a3, 0.20))

  // Only the shadow is drawn on the floor; the backdrop is the floor.
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.16 })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), shadowMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.4
  ground.receiveShadow = true
  ground.visible = detail.shadows
  scene.add(ground)

  // The part, the lines no file drew, and the line being laid now, all in the filament's colour.
  const partMaterial = new THREE.LineBasicMaterial({ color: 0xc00a66, transparent: true })
  const tapMaterial = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true })

  /** The simple model, built in code (vendor/03-model.js), with its accessories. */
  function buildSimpleRig (): Rig {
    const mats = m1().buildMaterials()
    flattenGlass(mats)
    const model: M1Root = m1().build(mats)
    scene.add(model)
    // Materials that lean on scene.environment lose their own envMapIntensity; giving each the map keeps it.
    model.traverse(o => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
        const std = m as THREE.MeshStandardMaterial
        if (std && std.envMapIntensity !== undefined && !std.envMap) {
          std.envMap = env
          std.needsUpdate = true
        }
      }
    })
    const state = model.userData.state
    state.showPrint = false
    state.showSpool = true
    const { cal, printFrame } = calibrate(model, mats)
    model.userData.apply()
    // The plate coming off and going back, the hose's end, the spool and the filament (accessory-parts.ts).
    const parts = buildAccessories(model, mats, opacity => {
      partMaterial.opacity = opacity
      tapMaterial.opacity = opacity
    })
    return {
      kind: 'simple',
      root: model,
      cargo: parts.cargo,
      printFrame,
      place: pose => placeModel(pose, cal),
      show (placement, led) {
        Object.assign(state, placement, { led })
        model.userData.apply()
      },
      setSpool (shown) { state.showSpool = shown },
      setScreen (screen) {
        Object.assign(state, screen)
        model.userData.apply()
      },
      setLeds (left, right) { Object.assign(state, { ledLeft: left, ledRight: right }) },
      apply: parts.apply,
      plateOff: parts.plateOff,
      plateOffBox: parts.plateOffBox,
      setColour: parts.setColour,
      useCheapGlass () { /* the simple model's glass is already flat */ }
    }
  }

  /** The accurate model: nodes driven by name from Klipper's position; the plate, the hose's end and the column (accurate/accessories.ts). */
  function accurateRig (a: AccurateRig): Rig {
    // The print rides in the opaque pass, so it is in the glass's transmission pass and seen through the plate.
    partMaterial.transparent = false
    tapMaterial.transparent = false
    partMaterial.opacity = 1
    tapMaterial.opacity = 1
    partMaterial.needsUpdate = true
    tapMaterial.needsUpdate = true
    return {
      kind: 'accurate',
      root: a.root,
      cargo: a.cargo,
      printFrame: a.printFrame,
      place: placeAccurate,
      show (placement, led) {
        a.place(placement)
        a.lights.setLed(led)
      },
      setSpool () { /* no spool in the exterior model */ },
      setScreen: screen => a.lights.setScreen(screen),
      setLeds: (left, right) => a.lights.setLeds(left, right),
      apply: a.apply,
      plateOff: a.plateOff,
      plateOffBox: a.plateOffBox,
      setColour () { /* the print's own material carries it */ },
      useCheapGlass () { a.useCheapGlass() }
    }
  }

  // Until a model is adopted there is only a place to hang the print.
  let rig: Rig = {
    kind: 'pending',
    root: new THREE.Group(),
    cargo: new THREE.Group(),
    printFrame: new THREE.Matrix4(),
    place: pose => placeModel(pose, { plateLeft: 0, plateFront: 0, plateBack: 0, plateUnderside: 0, nozzleX: 0, nozzleZ: 0, tipTop: 0, travelX: 1, travelZ: 1, bedTravel: 1 }),
    show () { /* nothing yet */ },
    setSpool () { /* nothing yet */ },
    setScreen () { /* nothing yet */ },
    setLeds () { /* nothing yet */ },
    apply () { /* nothing yet */ },
    plateOff: () => 0,
    plateOffBox: new THREE.Box3(),
    setColour () { /* nothing yet */ },
    useCheapGlass () { /* nothing yet */ }
  }
  scene.add(rig.root)

  /** Hangs `object` from the plate, in the printer's millimetres: it goes where the plate goes. */
  const onPlate = <T extends THREE.Object3D>(object: T): T => {
    object.matrixAutoUpdate = false
    object.matrix.copy(rig.printFrame)
    object.frustumCulled = false
    object.renderOrder = CONTENTS_ORDER
    rig.cargo.add(object)
    plated.push(object)
    return object
  }
  const plated: THREE.Object3D[] = []
  let print: THREE.LineSegments | null = null
  let toolpath: Toolpath | null = null

  const traceGeometry = new THREE.BufferGeometry()
  let traceAttribute: THREE.BufferAttribute | null = null
  onPlate(new THREE.LineSegments(traceGeometry, partMaterial))
  const traceShown = { trace: null as unknown, version: -1, count: 0 }

  const nibPositions = new Float32Array(6)
  const nibGeometry = new THREE.BufferGeometry()
  nibGeometry.setAttribute('position', new THREE.BufferAttribute(nibPositions, 3).setUsage(THREE.DynamicDrawUsage))
  const nib = onPlate(new THREE.LineSegments(nibGeometry, partMaterial))
  nib.visible = false

  // The touches of the plate: a bead each, just under it, where the nozzle met it.
  const tapGeometry = new THREE.SphereGeometry(2.6, 18, 12)
  const tapMarks = onPlate(new THREE.InstancedMesh(tapGeometry, tapMaterial, MAX_TAPS))
  tapMarks.count = 0
  let taps: PlateTap[] = []
  const tapSeen = new Map<string, number>()
  const tapMatrix = new THREE.Matrix4()
  const tapColourOf = new THREE.Color()

  const camera = new THREE.PerspectiveCamera(22.4, 1, 2, 8000)
  // The stage makes room for the plate while it is off, beside the printer.
  const onBox = new THREE.Box3()
  const offBox = new THREE.Box3()
  const box = new THREE.Box3()
  const target = box.getCenter(new THREE.Vector3())
  const view = { theta: VIEW.theta, phi: VIEW.phi, goalTheta: VIEW.theta, goalPhi: VIEW.phi }
  let distance = 1300
  /** The lean toward a pointed-at part, on top of the person's own view, and where it is going. */
  const lean: Lean = { ...NO_LEAN }
  let leanGoal: Lean = { ...NO_LEAN }
  /** The part pointed at; its middle is measured once, when it is pointed at (the hose's bounds cost too much to measure each frame). */
  let focus: { part: PartId, mode: LightMode, lean: boolean, centred: boolean } | null = null
  const light = new PartLight()
  let viewMode: 'free' | 'top' | 'screen' = 'free'
  /** How far the camera has flown in to the screen (0 out, 1 in), where it is going, and what it flies to. */
  let zoom = 0
  let zoomGoal = 0
  const zoomPoint = new THREE.Vector3()
  let zoomDistance = 0
  /** The person's own view, kept while the camera looks straight down. */
  let freeView = { theta: VIEW.theta, phi: VIEW.phi }
  let orbit = true
  const raycaster = new THREE.Raycaster()
  const focusPoint = new THREE.Vector3()
  let centre = [0, 0]
  let shift = 0
  let width = 0
  let height = 0

  const direction = () => {
    const theta = view.theta + lean.theta
    const phi = viewMode !== 'free' ? view.phi : Math.min(PHI_RANGE[1], Math.max(PHI_RANGE[0], view.phi + lean.phi))
    return new THREE.Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta))
  }

  const frame = () => {
    camera.position.copy(target).addScaledVector(direction(), distance)
    camera.lookAt(target)
    // Centre the machine itself, not its box's middle, then move it left by `shift`.
    const dx = (centre[0] + shift * 2) * width / 2
    const dy = -centre[1] * height / 2
    camera.setViewOffset(width, height, dx, dy, width, height)
  }

  const refit = () => {
    if (!width || !height) return
    camera.aspect = width / height
    camera.clearViewOffset()
    const off = rig.plateOff()
    box.min.lerpVectors(onBox.min, offBox.min, off)
    box.max.lerpVectors(onBox.max, offBox.max, off)
    box.getCenter(target)
    const f = fit(camera, box, target, direction())
    distance = f.distance * (1 - LEAN_LIMIT.closer * lean.closer)
    centre = f.centre
    // Leaning, the camera also looks a little toward the part.
    if (focus?.centred && lean.closer > 0) target.lerp(focusPoint, 0.12 * lean.closer)
    // Flying in to the screen: closer, looking at its middle.
    if (zoom > 1e-4) {
      distance += (zoomDistance - distance) * zoom
      target.lerp(zoomPoint, zoom)
      centre = [centre[0] * (1 - zoom), centre[1] * (1 - zoom)]
    }
  }

  /** A part's middle in the scene, or null if this model hasn't it. */
  function partCentre (part: PartId, into: THREE.Vector3): THREE.Vector3 | null {
    const meshes = partMeshes(rig.root, part)
    if (!meshes.length) return null
    const b = new THREE.Box3()
    for (const m of meshes) b.expandByObject(m)
    return b.getCenter(into)
  }

  /** Hides or shows the plate and what it carries (the bed stage on the accurate model, the bed lift on the simple one). */
  function showPlate (shown: boolean) {
    for (const name of ['M1_Z_Stage', 'bedLift']) {
      const node = rig.root.getObjectByName(name)
      if (node) node.visible = shown
    }
    for (const o of plated) o.visible = shown
  }

  /** The ray under a page point, or null before the first frame. */
  function rayAt (x: number, y: number): THREE.Ray | null {
    if (!ready || !width || !height) return null
    const r = canvas.getBoundingClientRect()
    raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera)
    return raycaster.ray
  }

  /**
   * Points the camera square-on at the screen, from the side of the machine
   * it is on, close enough for it to fill SCREEN_FILL of the stage. False if
   * this model hasn't a screen.
   */
  function aimAtScreen (): boolean {
    const meshes = partMeshes(rig.root, 'screen')
    if (!meshes.length) return false
    const b = new THREE.Box3()
    for (const m of meshes) b.expandByObject(m)
    b.getCenter(zoomPoint)
    const out = zoomPoint.clone().sub(box.getCenter(new THREE.Vector3()))
    const size = b.getSize(new THREE.Vector3())
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2
    zoomDistance = Math.max(size.x, size.y, size.z) / 2 / SCREEN_FILL / Math.tan(halfFov)
    // Turned the short way round to face it, and level with it.
    const theta = Math.atan2(out.x, out.z)
    const turn = Math.atan2(Math.sin(theta - view.goalTheta), Math.cos(theta - view.goalTheta))
    view.goalTheta += turn
    view.goalPhi = Math.min(PHI_RANGE[1], Math.max(PHI_RANGE[0], Math.PI / 2))
    return true
  }

  /** The lean the focus asks for now, from where the person has the camera. */
  function aimLean () {
    if (!focus?.lean || viewMode !== 'free') {
      leanGoal = { ...NO_LEAN }
      return
    }
    leanGoal = focus.centred ? leanToward(focusPoint, box.getCenter(new THREE.Vector3()), view.goalTheta, view.goalPhi) : { ...NO_LEAN }
  }

  const restyle = () => {
    const colours = stageColours(canvas)
    if (width && height) {
      const old = scene.background as THREE.Texture | null
      scene.background = stageBackdrop(width, height, colours)
      old?.dispose()
    }
    // A darker stage needs a darker shadow to show one at all.
    const { l } = new THREE.Color(colours[1]).getHSL({ h: 0, s: 0, l: 0 })
    shadowMaterial.opacity = 0.16 + (1 - l) * 0.22
  }

  let sync: LiveSync | null = null
  let lastPlacement = ''
  /** What the screen and the strips last showed, so the printer's unchanged reports draw nothing. */
  let lastScreen = ''
  /** The sync's crossfade count last drawn: with reduced motion a change is shown by fading, not moving. */
  let lastCrossfade = -1
  let lastLeds = ''
  /** The screen and the strips as last given, for a model adopted after they came (the GLB loads after the page sets them). */
  let screenShown: ScreenState | null = null
  let ledsShown: [LedStrip, LedStrip] | null = null
  /** The strips' own pixels, when the printer reports them; else the light's switch alone. */
  let strips: { lit: boolean } | null = null
  let lastDraw = 0
  let drawnAccessories: AccessoryFrame | null = null
  let dragging = false
  let ready = false
  let disposed = false

  /** Brings the trace's new lines to the GPU: only those added since the last frame, unless older ones changed. */
  function showTrace () {
    const trace = sync?.trace
    if (!trace) return
    if (!traceAttribute) {
      traceAttribute = new THREE.BufferAttribute(trace.positions, 3).setUsage(THREE.DynamicDrawUsage)
      traceGeometry.setAttribute('position', traceAttribute)
    }
    if (traceShown.trace === trace && traceShown.version === trace.version && traceShown.count === trace.count) return
    traceAttribute.clearUpdateRanges()
    if (traceShown.trace === trace && traceShown.version === trace.version && trace.count > traceShown.count) {
      traceAttribute.addUpdateRange(traceShown.count * 6, (trace.count - traceShown.count) * 6)
    }
    traceAttribute.needsUpdate = true
    traceGeometry.setDrawRange(0, trace.count * 2)
    Object.assign(traceShown, { trace, version: trace.version, count: trace.count })
  }

  /** Puts everything where the printer has it now; whether it is still moving. */
  function follow (now: number): boolean {
    if (!sync) return false
    const f = sync.frame(now)
    const accessories = f.accessories
    if (accessories.crossfade !== lastCrossfade) {
      if (lastCrossfade !== -1 && lastDraw) crossfade()
      lastCrossfade = accessories.crossfade
    }
    rig.setSpool(accessories.spool)
    const placement = rig.place(f.pose)
    const led = strips ? strips.lit : f.pose.led
    const placed = `${placement.headX.toFixed(5)},${placement.headZ.toFixed(5)},${placement.z.toFixed(5)},${led}`
    if (placed !== lastPlacement) {
      lastPlacement = placed
      rig.show(placement, led)
    }
    if (print && toolpath) print.geometry.setDrawRange(0, Math.min(f.printDone, toolpath.count) * 2)
    nib.visible = !!f.nib
    if (f.nib) {
      nibPositions.set([...f.nib[0], ...f.nib[1]])
      nibGeometry.attributes.position.needsUpdate = true
    }
    showTrace()
    rig.apply(accessories, f.partGone)
    drawnAccessories = accessories
    return f.moving || accessories.animating
  }

  /**
   * Reduced motion: the stage as it was, laid over the canvas and faded out
   * as the new state is drawn under it. Read straight after drawing, while
   * the WebGL canvas still holds the frame.
   */
  function crossfade () {
    const parent = canvas.parentElement
    if (!parent || !width || !height) return
    renderer.render(scene, camera)
    const still = document.createElement('canvas')
    still.width = canvas.width
    still.height = canvas.height
    still.getContext('2d')?.drawImage(canvas, 0, 0)
    Object.assign(still.style, {
      position: 'absolute',
      left: `${canvas.offsetLeft}px`,
      top: `${canvas.offsetTop}px`,
      width: `${canvas.clientWidth}px`,
      height: `${canvas.clientHeight}px`,
      pointerEvents: 'none',
      transition: `opacity ${CROSSFADE_MS}ms ease`
    })
    parent.insertBefore(still, canvas.nextSibling)
    requestAnimationFrame(() => requestAnimationFrame(() => { still.style.opacity = '0' }))
    window.setTimeout(() => still.remove(), CROSSFADE_MS + 120)
  }

  /** Sizes the marks: a new one swells and settles. Whether one still is. */
  function pulseTaps (now: number): boolean {
    let pulsing = false
    const animate = liveRenderOptions(width).animate
    taps.forEach((t, i) => {
      const age = now - (tapSeen.get(tapKey(t)) ?? 0)
      const swell = age < PULSE_MS && animate ? 1 + 1.4 * Math.sin(Math.PI * age / PULSE_MS) : 1
      if (age < PULSE_MS && animate) pulsing = true
      tapMatrix.makeScale(swell, swell, swell).setPosition(t.x, t.y, 0)
      tapMarks.setMatrixAt(i, tapMatrix)
    })
    tapMarks.instanceMatrix.needsUpdate = true
    return pulsing
  }

  const watch = new FrameWatch()
  let cheapGlass = false
  /** Off when the page pins the real glass (?m1glass=real), so a measurement isn't changed under it. */
  let autoCheap = true
  /** The glass plate goes plain on a small or weak screen, or once the frames come slowly. */
  function cheapenGlass (why: string) {
    if (cheapGlass) return
    cheapGlass = true
    rig.useCheapGlass()
    performance.mark(`m1:cheap-glass:${why}`)
  }

  function draw () {
    if (disposed || !gate.open || !ready || !width || !height) return
    const now = performance.now()
    if (!dragging && now - lastDraw < FRAME_MS - 4) {
      loop.invalidate()
      return
    }
    const d = liveRenderOptions(width).animate ? 0.25 : 1
    view.theta += (view.goalTheta - view.theta) * d
    view.phi += (view.goalPhi - view.phi) * d
    if (dragging) aimLean()
    lean.theta += (leanGoal.theta - lean.theta) * LEAN_EASE
    lean.phi += (leanGoal.phi - lean.phi) * LEAN_EASE
    lean.closer += (leanGoal.closer - lean.closer) * LEAN_EASE
    zoom += (zoomGoal - zoom) * ZOOM_EASE
    if (Math.abs(zoomGoal - zoom) < 1e-3) zoom = zoomGoal
    const moving = follow(now)
    const pulsing = pulseTaps(now)
    // Fitted afresh each frame, so the machine keeps filling the stage as it turns.
    refit()
    frame()
    const first = !lastDraw
    renderer.render(scene, camera)
    if (first) performance.mark('m1:first-frame')
    lastDraw = now
    if (autoCheap && rig.kind === 'accurate' && !cheapGlass) {
      watch.push(now)
      if (watch.slow) cheapenGlass('slow')
    }
    viewer.onFrame?.()
    viewer.onDraw?.({ model: rig.kind, accessories: drawnAccessories })
    const turning = Math.abs(view.goalTheta - view.theta) > 1e-3 || Math.abs(view.goalPhi - view.phi) > 1e-3 ||
      Math.abs(leanGoal.theta - lean.theta) > 1e-4 || Math.abs(leanGoal.phi - lean.phi) > 1e-4 || Math.abs(leanGoal.closer - lean.closer) > 1e-3 ||
      zoom !== zoomGoal
    if (moving || pulsing || turning) invalidate()
  }

  /** Asks for a frame. */
  function invalidate () {
    loop.invalidate()
  }

  // Frames are asked for only while the gate is open, and the one in flight is cancelled when it shuts.
  const loop = createFrameLoop(draw)
  // Draws only while switched on, the tab is visible and the canvas is on screen.
  const gate = createRenderGate(canvas, open => loop.setOpen(open))

  const viewer: M1Viewer = {
    onFrame: null,
    onDraw: null,
    follow (next) {
      sync = next
      lastCrossfade = -1
      traceShown.trace = null
      traceAttribute = null
      invalidate()
    },
    wake: invalidate,
    setPrint (path, colour) {
      partMaterial.color.setHex(colour)
      rig.setColour(colour)
      if (print) {
        print.removeFromParent()
        plated.splice(plated.indexOf(print), 1)
        print.geometry.dispose()
        print = null
      }
      toolpath = path && path.count ? path : null
      if (toolpath) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(toolpath.positions, 3))
        geometry.setDrawRange(0, 0)
        print = onPlate(new THREE.LineSegments(geometry, partMaterial))
      }
      invalidate()
    },
    setScreen (screen) {
      // As the model compares them: whole degrees, whole percent.
      const shown = [screen.status, Math.round(screen.progress), Math.round(screen.nozzleTemp), Math.round(screen.nozzleTarget),
        Math.round(screen.bedTemp), Math.round(screen.bedTarget), screen.jobName, screen.connected].join('|')
      if (shown === lastScreen) return
      lastScreen = shown
      screenShown = screen
      rig.setScreen(screen)
      invalidate()
    },
    setLeds (left, right) {
      const shown = JSON.stringify([left, right])
      if (shown === lastLeds) return
      lastLeds = shown
      ledsShown = [left, right]
      strips = left || right ? { lit: stripsLit(left, right) } : null
      rig.setLeds(left, right)
      lastPlacement = ''
      invalidate()
    },
    setTaps (next) {
      const now = performance.now()
      taps = next.slice(-MAX_TAPS)
      const keys = new Set(taps.map(tapKey))
      for (const k of [...tapSeen.keys()]) if (!keys.has(k)) tapSeen.delete(k)
      for (const t of taps) if (!tapSeen.has(tapKey(t))) tapSeen.set(tapKey(t), now)
      const middle = middleHeight(taps)
      taps.forEach((t, i) => tapMarks.setColorAt(i, tapColourOf.setHex(tapColour(t, middle))))
      if (tapMarks.instanceColor) tapMarks.instanceColor.needsUpdate = true
      tapMarks.count = taps.length
      invalidate()
    },
    setActive (on) {
      gate.setActive(on)
    },
    restyle () {
      restyle()
      invalidate()
    },
    setShift (share) {
      shift = share
      invalidate()
    },
    pick (x, y) {
      if (!ready || !width || !height) return null
      const r = canvas.getBoundingClientRect()
      const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
      // The view offset (the machine centred, then shifted) is part of the camera's projection, so the ray follows it.
      raycaster.setFromCamera(ndc, camera)
      // Only what is drawn: the plate hidden for the top-down view must not catch the ray.
      const shown = (o: THREE.Object3D | null): boolean => !o || (o.visible && shown(o.parent))
      const targets = PART_IDS.flatMap(id => partMeshes(rig.root, id)).filter(m => shown(m))
      const hit = raycaster.intersectObjects(targets, false)[0]
      return hit ? partOf(hit.object) : null
    },
    setFocus (part, mode, leanIn) {
      const same = focus?.part === part && focus?.mode === mode && focus?.lean === leanIn
      if (same) return
      const moved = focus?.part !== part
      focus = part ? { part, mode, lean: leanIn, centred: moved ? !!partCentre(part, focusPoint) : !!focus?.centred } : null
      if (part) light.light(partMeshes(rig.root, part), mode)
      else light.clear()
      aimLean()
      invalidate()
    },
    get accurate () {
      return rig.kind === 'accurate'
    },
    setView (mode) {
      if (mode === viewMode) return
      if (mode === 'screen' && !aimAtScreen()) return
      if (viewMode === 'free') freeView = { theta: view.goalTheta, phi: view.goalPhi }
      if (mode === 'top') {
        view.goalTheta = 0
        view.goalPhi = TOP_PHI
      } else if (mode === 'free') {
        view.goalTheta = freeView.theta
        view.goalPhi = freeView.phi
      }
      zoomGoal = mode === 'screen' ? 1 : 0
      viewMode = mode
      showPlate(mode !== 'top')
      aimLean()
      invalidate()
    },
    setOrbit (on) {
      orbit = on
    },
    project (p) {
      if (!width || !height) return null
      const v = new THREE.Vector3(p.x, p.y, p.z).project(camera)
      return { x: (v.x + 1) / 2 * width, y: (1 - v.y) / 2 * height }
    },
    onLevel (x, y, planeY) {
      const ray = rayAt(x, y)
      const hit = ray?.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), new THREE.Vector3())
      return hit ? { x: hit.x, y: hit.y, z: hit.z } : null
    },
    onUpright (x, y, through) {
      const ray = rayAt(x, y)
      if (!ray) return null
      const facing = camera.getWorldDirection(new THREE.Vector3()).setY(0)
      if (facing.lengthSq() < 1e-6) return null
      facing.normalize()
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(facing, new THREE.Vector3(through.x, through.y, through.z))
      const hit = ray.intersectPlane(plane, new THREE.Vector3())
      return hit ? { x: hit.x, y: hit.y, z: hit.z } : null
    },
    anchor (part) {
      if (!width || !height) return null
      // Measured as drawn now, so a line to a moving head follows it; only the hose (skinned, costly to measure) uses its measure from when it was pointed at.
      const p = part === 'filament' && focus?.part === part && focus.centred ? focusPoint.clone() : partCentre(part, new THREE.Vector3())
      if (!p) return null
      p.project(camera)
      return { x: (p.x + 1) / 2 * width, y: (1 - p.y) / 2 * height }
    },
    dispose () {
      disposed = true
      loop.stop()
      light.dispose()
      gate.dispose()
      resize.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('dblclick', onReset)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      // The trace's array is the printer's sync's, kept for the next view; only its GPU copy goes.
      disposeTree(scene)
      env.dispose()
      ;(scene.background as THREE.Texture | null)?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }

  const resize = new ResizeObserver(() => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === width && h === height)) return
    width = w
    height = h
    renderer.setPixelRatio(liveRenderOptions(w).pixelRatio)
    renderer.setSize(w, h, false)
    restyle()
    invalidate()
  })
  resize.observe(canvas)

  // Every shader is built before the first frame, off the main thread where
  // the browser can, so the page doesn't freeze while they compile. The glass
  // has no transmission pass (glass-material.ts), so each is built once.
  // Only the shadow pass's few are left to the first frame.
  scene.background = stageBackdrop(64, 64, stageColours(canvas))

  /** Puts a model on the stage: the print moves onto its plate, the stage is fitted to it, its shaders are built; then it can be drawn. */
  function adopt (next: Rig) {
    if (disposed) return
    const old = rig
    light.clear()
    focus = null
    leanGoal = { ...NO_LEAN }
    if (viewMode === 'top') {
      viewMode = 'free'
      view.goalTheta = freeView.theta
      view.goalPhi = freeView.phi
    }
    rig = next
    if (next.root.parent !== scene) scene.add(next.root)
    for (const o of plated) {
      o.matrix.copy(next.printFrame)
      next.cargo.add(o)
    }
    if (old !== next) {
      scene.remove(old.root)
      disposeTree(old.root)
    }
    if (next.kind === 'accurate') {
      const glass = glassChoice(modelSettings.glass, glassOverride())
      if (glass !== 'auto') autoCheap = false
      if (glass === 'plain') cheapenGlass('forced')
      else if (glass === 'auto' && wantsCheapGlass({
        width: canvas.clientWidth || window.innerWidth,
        cores: navigator.hardwareConcurrency,
        memory: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
        saveData: (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData
      })) cheapenGlass('device')
    }
    lastPlacement = ''
    if (screenShown) next.setScreen(screenShown)
    if (ledsShown) next.setLeds(...ledsShown)
    // Posed once so the box is the machine's; the follower puts it where the printer is on the first frame.
    next.show(next.place({ x: null, y: null, z: null, led: false, progress: 0 }), false)
    onBox.copy(shownBox(next.root))
    // The shadow falls on the floor the machine stands on. The accurate model's origin is the plate's
    // top, about 155 mm above its feet: a floor at 0 sliced through the box and printed the shadow on it.
    const feet = next.kind === 'accurate' ? next.root.getObjectByName('M1_Base') : null
    ground.position.y = (feet ? shownBox(feet).min.y : 0) - 0.4
    offBox.copy(onBox).union(next.plateOffBox.isEmpty() ? onBox : next.plateOffBox)
    box.copy(onBox)
    performance.mark('m1:built')
    refit()
    frame()
    ready = false
    renderer.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        performance.mark('m1:compiled')
        ready = true
        invalidate()
      })
  }

  /** The accurate model if the GLB loads, the simple one if it can't (or if the page asks for it). */
  async function chooseModel () {
    const options = liveRenderOptions(canvas.clientWidth)
    if (!wantsSimpleModel() && options.model === 'accurate') {
      try {
        // Behind dynamic imports, so neither the loader nor the 3 MB asset is in the first-load bundle.
        const [{ loadAccurateModel }, { buildAccurateRig }, { default: url }] = await Promise.all([
          import('./accurate/gltf-load'),
          import('./accurate/rig'),
          import('@/assets/m1/m1-accurate.glb?url')
        ])
        let timer = 0
        const timeout = new Promise<never>((_resolve, reject) => {
          if (!options.loadTimeout) return
          timer = window.setTimeout(() => reject(new Error('the accurate M1 took too long to load')), ACCURATE_TIMEOUT_MS)
        })
        const loading = loadAccurateModel(url)
        let timedOut = false
        // A load that loses the race is never used; whatever it later yields is freed.
        loading.then(late => { if (timedOut) disposeTree(late.scene) }, () => {})
        const loaded = await Promise.race([loading, timeout])
          .catch(e => { timedOut = true; throw e })
          .finally(() => clearTimeout(timer))
        if (disposed) {
          disposeTree(loaded.scene)
          return
        }
        const built = buildAccurateRig(loaded.scene as unknown as THREE.Group)
        if (built.missing.length) throw new Error(`the accurate M1 lacks nodes: ${built.missing.join(', ')}`)
        performance.mark('m1:glb-loaded')
        adopt(accurateRig(built))
        return
      } catch (e) {
        console.warn('[m1] the accurate model could not be shown; using the simple one', e)
      }
    }
    if (!disposed) adopt(buildSimpleRig())
  }
  chooseModel().catch(e => console.warn('[m1] no model could be shown', e))

  // A mouse drag turns the machine; a double click puts it back.
  let drag: { x: number, y: number } | null = null
  function onDown (e: PointerEvent) {
    if (!orbit || e.pointerType === 'touch' || e.button !== 0) return
    drag = { x: e.clientX, y: e.clientY }
    dragging = true
    canvas.setPointerCapture(e.pointerId)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp, { once: true })
    canvas.addEventListener('pointercancel', onUp, { once: true })
  }
  function onMove (e: PointerEvent) {
    if (!drag) return
    view.goalTheta -= (e.clientX - drag.x) * 0.0062
    view.goalPhi = Math.min(PHI_RANGE[1], Math.max(PHI_RANGE[0], view.goalPhi - (e.clientY - drag.y) * 0.0056))
    drag = { x: e.clientX, y: e.clientY }
    invalidate()
  }
  function onUp () {
    drag = null
    dragging = false
    canvas.removeEventListener('pointermove', onMove)
  }
  function onReset () {
    if (viewMode === 'top') return
    view.goalTheta = VIEW.theta
    view.goalPhi = VIEW.phi
    invalidate()
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('dblclick', onReset)

  // A lost GL context (GPU reset, too many contexts) must not leave a frozen canvas:
  // stop drawing (the loop's draw() sees ready=false) while it is gone; on restore, the simple model (cheap, no GPU state to rebuild) takes over.
  function onContextLost (e: Event) {
    e.preventDefault()
    ready = false
  }
  function onContextRestored () {
    if (disposed) return
    renderer.resetState()
    ready = false
    adopt(buildSimpleRig())
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  return viewer
}
