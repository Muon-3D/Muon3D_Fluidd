/** How much detail the printer's 3D model (Overview) and the G-code preview draw with: Settings › G-code preview. */
export type ModelDetail = 'low' | 'medium' | 'high'

export const MODEL_DETAILS: ReadonlyArray<{ value: ModelDetail, label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

export interface ModelRenderOptions {
  /** The canvas's pixels per CSS pixel. */
  pixelRatio: number;
  /** Whether the machine casts its shadow on the stage. */
  shadows: boolean;
  /** The shadow map's size, in texels a side. */
  shadowMapSize: number;
  /** The glass plate drawn plain, whatever the device. */
  cheapGlass: boolean;
  /** Turns, swells and the accessories' moves animate; off, they jump (and the accessories crossfade). */
  animate: boolean;
}

export interface ModelRenderInput {
  detail: ModelDetail | string | null | undefined;
  /** The setting: on, off, or null to follow the system's reduced-motion choice. */
  animations: boolean | null | undefined;
  reducedMotion: boolean;
  devicePixelRatio: number;
  /** The stage's width in CSS pixels. */
  width: number;
}

export function modelDetail (value: unknown): ModelDetail {
  return value === 'low' || value === 'medium' ? value : 'high'
}

/** Whether the model animates: the setting when set, else not under prefers-reduced-motion. */
export function modelAnimates (animations: boolean | null | undefined, reducedMotion: boolean): boolean {
  return typeof animations === 'boolean' ? animations : !reducedMotion
}

/** What the live M1's renderer draws with, for a detail level. High is how it always drew. */
export function modelRenderOptions (input: ModelRenderInput): ModelRenderOptions {
  const dpr = input.devicePixelRatio || 1
  const detail = modelDetail(input.detail)
  const cap = detail === 'low' ? 1 : detail === 'medium' ? 1.25 : input.width < 600 ? 1.5 : 2
  return {
    pixelRatio: Math.min(dpr, cap),
    shadows: detail !== 'low',
    shadowMapSize: detail === 'high' ? 1024 : 512,
    cheapGlass: detail !== 'high',
    animate: modelAnimates(input.animations, input.reducedMotion)
  }
}

/** The G-code preview's SVG: low draws for speed, else for precision (and for speed while panning). */
export function gcodeShapeRendering (detail: unknown, panning: boolean): 'optimizeSpeed' | 'geometricPrecision' {
  return panning || modelDetail(detail) === 'low' ? 'optimizeSpeed' : 'geometricPrecision'
}
