import * as THREE from 'three'
import type { LedStrip, ScreenState } from '../live-state'

/**
 * The accurate M1's LED strip and round screen, live. The GLB has one LED
 * mesh in the trough (its emissive material, `LED_MATERIAL`) and the panel
 * (`M1_Panel_Screen`, a static LCD picture whose UVs wrap a 2048 by 282
 * strip). The strip takes the pixels' average colour, or goes dark with the
 * light off; the panel gets the simple model's own drawing of MuonUI's Home
 * screen (02-materials.js drawPanel) on a planar UV laid across its face.
 */
export const LED_MATERIAL = 'M1_0.80_0.80_0.80_m0.0_r0.50_e0.00_0.54_1.00'
export const SCREEN_NODE = 'M1_Panel_Screen'

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
  /** Whether the asset had the strip and the panel. */
  found: { led: boolean; screen: boolean };
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
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    if (mesh.name === SCREEN_NODE) screenMesh = mesh
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
      if (m.name === LED_MATERIAL) led = m as THREE.MeshStandardMaterial
    }
  })

  // -- the strip ----------------------------------------------------------------
  const ledMaterial = led as THREE.MeshStandardMaterial | null
  const ownColour = ledMaterial?.emissive.clone() ?? new THREE.Color()
  const ownIntensity = ledMaterial?.emissiveIntensity ?? 0
  let on = true
  let colour: [number, number, number] | null = null
  const showLed = () => {
    if (!ledMaterial) return
    if (!on) {
      ledMaterial.emissiveIntensity = 0
      return
    }
    if (!colour) {
      ledMaterial.emissive.copy(ownColour)
      ledMaterial.emissiveIntensity = ownIntensity
      return
    }
    const peak = Math.max(...colour)
    if (peak < 0.004) {
      ledMaterial.emissiveIntensity = 0
      return
    }
    // The hue at full strength; the brightness in the intensity.
    ledMaterial.emissive.setRGB(colour[0] / peak, colour[1] / peak, colour[2] / peak, THREE.SRGBColorSpace)
    ledMaterial.emissiveIntensity = ownIntensity * peak
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
    material.emissiveIntensity = 1.3
    material.map = null
    material.needsUpdate = true
    mesh.material = material
    setScreen = screen => {
      drawPanel(canvas, panelView(screen))
      texture.needsUpdate = true
    }
  }

  return {
    found: { led: !!ledMaterial, screen: !!mesh },
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
