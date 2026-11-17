import * as THREE from 'three'
import type { LedStrip, ScreenState } from '../live-state'

/**
 * The accurate M1's LED strip and round screen, live.
 *
 * The LED chips (their emissive material, `LED_MATERIAL`) lie about 25 mm
 * under the deck, in the trough, and almost none of them shows from outside.
 * What a person sees is their light guides, `DIFFUSER_MATERIAL` meshes in
 * `M1_Base`, through the trough's slot (the asset's README). So the lit strip
 * is shown on those: they glow in the pixels' average colour, and go back to
 * plain milky white with the light off. The chips follow too. The diffuser
 * material is shared with the hose and parts of the head, so the base's
 * light guides get a copy of it of their own.
 *
 * The panel (`M1_Panel_Screen`, a static LCD picture whose UVs wrap a 2048 by
 * 282 strip) sits 1.5 mm under its frosted window, which blurs it to a glow.
 * It gets the simple model's own drawing of MuonUI's Home screen
 * (02-materials.js drawPanel) on a planar UV laid across its face.
 */
export const LED_MATERIAL = 'M1_0.80_0.80_0.80_m0.0_r0.50_e0.00_0.54_1.00'
export const DIFFUSER_MATERIAL = 'M1_Diffuser'
/** The node whose diffuser meshes are the LED trough's light guides. */
export const DIFFUSER_PARENT = 'M1_Base'
export const SCREEN_NODE = 'M1_Panel_Screen'
/** The light guides' glow at a full-strength pixel. */
const DIFFUSER_GLOW = 2.2

interface PanelDrawing {
  drawPanel: (canvas: HTMLCanvasElement, view: unknown) => HTMLCanvasElement;
  panelView: (state: Partial<ScreenState>) => unknown;
  screenCanvas: (px: number, state: Partial<ScreenState> | null) => HTMLCanvasElement;
}

export interface AccurateLights {
  /** The light's switch; with no strip pixels reported it alone lights the strip in the asset's own colour. */
  setLed: (on: boolean) => void;
  /** Klipper's color_data for the two chains, or nulls. */
  setLeds: (left: LedStrip, right: LedStrip) => void;
  setScreen: (screen: ScreenState) => void;
  /** Whether the asset had the LED chips, their light guides and the panel. */
  found: { led: boolean; diffusers: boolean; screen: boolean };
}

/** The strips' average colour, 0 to 1 a channel (a white channel adds to all three), or null with none reported. */
export function averageColour (left: LedStrip, right: LedStrip): [number, number, number] | null {
  const pixels = [...(left ?? []), ...(right ?? [])]
  if (!pixels.length) return null
  const sum = [0, 0, 0]
  for (const p of pixels) {
    const w = Number(p[3]) || 0
    for (let i = 0; i < 3; i++) sum[i] += Math.min(1, (Number(p[i]) || 0) + w)
  }
  return [sum[0] / pixels.length, sum[1] / pixels.length, sum[2] / pixels.length]
}

export function buildAccurateLights (root: THREE.Object3D): AccurateLights {
  let led: THREE.MeshStandardMaterial | null = null
  let screenMesh: THREE.Mesh | null = null
  const guides: THREE.Mesh[] = []
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    if (mesh.name === SCREEN_NODE) screenMesh = mesh
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
      if (m.name === LED_MATERIAL) led = m as THREE.MeshStandardMaterial
      // three splits a multi-material glTF mesh into children of the node, so the base's own are its children.
      if (m.name === DIFFUSER_MATERIAL && (mesh.name === DIFFUSER_PARENT || mesh.parent?.name === DIFFUSER_PARENT)) guides.push(mesh)
    }
  })
  // The light guides' own copy of the diffuser, so the hose and the head stay white.
  let glow: THREE.MeshStandardMaterial | null = null
  for (const mesh of guides) {
    const shared = mesh.material as THREE.MeshStandardMaterial
    glow ??= shared.clone()
    mesh.material = glow
  }
  const guideMaterial = glow as THREE.MeshStandardMaterial | null
  const guideWhite = guideMaterial?.color.clone() ?? new THREE.Color(1, 1, 1)
  if (guideMaterial) {
    guideMaterial.name = `${DIFFUSER_MATERIAL}_LedGlow`
    guideMaterial.emissiveIntensity = 0
  }

  // -- the strip ----------------------------------------------------------------
  const ledMaterial = led as THREE.MeshStandardMaterial | null
  const ownColour = ledMaterial?.emissive.clone() ?? new THREE.Color()
  const ownIntensity = ledMaterial?.emissiveIntensity ?? 0
  let on = true
  let colour: [number, number, number] | null = null
  const hue = new THREE.Color()
  /** Lights the chips and their light guides in `hue` at `level` (0 off, 1 full), or puts both out. */
  const light = (level: number) => {
    if (ledMaterial) {
      ledMaterial.emissive.copy(hue)
      ledMaterial.emissiveIntensity = ownIntensity * level
    }
    if (guideMaterial) {
      guideMaterial.emissive.copy(hue)
      guideMaterial.emissiveIntensity = DIFFUSER_GLOW * level
      // Lit, the milky guide takes the light's colour: white over it would wash any hue out to white.
      guideMaterial.color.copy(guideWhite).lerp(hue, level).multiplyScalar(1 - 0.55 * level)
    }
  }
  const showLed = () => {
    if (!on) return light(0)
    if (!colour) {
      // The light's switch alone: the asset's own LED colour.
      hue.copy(ownColour)
      return light(1)
    }
    const peak = Math.max(...colour)
    if (peak < 0.004) return light(0)
    // The hue at full strength; the brightness in the intensity.
    hue.setRGB(colour[0] / peak, colour[1] / peak, colour[2] / peak, THREE.SRGBColorSpace)
    light(peak)
  }

  // -- the panel ------------------------------------------------------------------
  const drawing = (window as unknown as { M1?: Partial<PanelDrawing> }).M1
  const mesh = screenMesh as THREE.Mesh | null
  let setScreen: (screen: ScreenState) => void = () => {}
  if (mesh && drawing?.drawPanel && drawing.panelView && drawing.screenCanvas) {
    const { drawPanel, panelView, screenCanvas } = drawing as PanelDrawing
    // A planar UV across the panel's face, as seen from above: u along world X, v along world Z.
    mesh.updateMatrixWorld(true)
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute
    const world = new THREE.Vector3()
    const box = new THREE.Box3()
    for (let i = 0; i < position.count; i++) box.expandByPoint(world.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld))
    const size = box.getSize(new THREE.Vector3())
    const side = Math.max(size.x, size.z) || 1
    const middle = box.getCenter(new THREE.Vector3())
    const uv = new Float32Array(position.count * 2)
    for (let i = 0; i < position.count; i++) {
      world.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
      // The panel's top (the canvas's first row) toward the back of the machine, so it reads from the front.
      uv[i * 2] = 0.5 + (world.x - middle.x) / side
      uv[i * 2 + 1] = 0.5 - (world.z - middle.z) / side
    }
    mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    const canvas = screenCanvas(512, null)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    const material = (mesh.material as THREE.MeshStandardMaterial).clone()
    material.emissiveMap = texture
    material.emissive.setRGB(1, 1, 1)
    // The panel is drawn light; brighter than this it clips to white under its frosted window.
    material.emissiveIntensity = 1
    material.map = null
    material.needsUpdate = true
    mesh.material = material
    setScreen = screen => {
      drawPanel(canvas, panelView(screen))
      texture.needsUpdate = true
    }
  }

  showLed()

  return {
    found: { led: !!ledMaterial, diffusers: !!guideMaterial, screen: !!mesh },
    setLed (next) {
      if (next === on) return
      on = next
      showLed()
    },
    setLeds (left, right) {
      colour = averageColour(left, right)
      showLed()
    },
    setScreen
  }
}
