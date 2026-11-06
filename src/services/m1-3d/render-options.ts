/** How much detail the printer's 3D model (Overview) draws with: Settings › G-code preview and 3D. */
export type ModelDetail = 'auto' | 'high' | 'low'
/** The glass panels on the model: the device decides (auto), always real, or always plain. */
export type ModelGlass = 'auto' | 'real' | 'plain'

export const MODEL_DETAILS: ReadonlyArray<{ value: ModelDetail, label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' }
]

export const MODEL_GLASSES: ReadonlyArray<{ value: ModelGlass, label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'real', label: 'Real' },
  { value: 'plain', label: 'Plain' }
]

export interface ModelRenderOptions {
  /** The canvas's pixels per CSS pixel. */
  pixelRatio: number;
  /** Whether the machine casts its shadow on the stage. */
  shadows: boolean;
  /** The shadow map's size, in texels a side. */
  shadowMapSize: number;
  /** Which model to show: the accurate one (falling back to simple if it fails), or the simple one. */
  model: 'accurate' | 'simple';
  /** Whether the accurate model falls back to the simple one when it's slow to load. */
  loadTimeout: boolean;
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
  return value === 'high' || value === 'low' ? value : 'auto'
}

export function modelGlass (value: unknown): ModelGlass {
  return value === 'real' || value === 'plain' ? value : 'auto'
}

/** Whether the model animates: the setting when set, else not under prefers-reduced-motion. */
export function modelAnimates (animations: boolean | null | undefined, reducedMotion: boolean): boolean {
  return typeof animations === 'boolean' ? animations : !reducedMotion
}

/**
 * What the live M1's renderer draws with. Auto is how it always drew: the
 * accurate model if it loads in time, else the simple one. High waits for
 * the accurate model; Low draws the simple one at one pixel per pixel,
 * without the shadow.
 */
export function modelRenderOptions (input: ModelRenderInput): ModelRenderOptions {
  const dpr = input.devicePixelRatio || 1
  const detail = modelDetail(input.detail)
  const low = detail === 'low'
  return {
    pixelRatio: Math.min(dpr, low ? 1 : input.width < 600 ? 1.5 : 2),
    shadows: !low,
    shadowMapSize: low ? 512 : 1024,
    model: low ? 'simple' : 'accurate',
    loadTimeout: detail === 'auto',
    animate: modelAnimates(input.animations, input.reducedMotion)
  }
}

/**
 * Whether the glass panels go plain: a ?m1glass= flag first (kept for
 * measuring), then the setting; on auto, the device decides.
 */
export function glassChoice (setting: ModelGlass, flag: 'cheap' | 'real' | null): 'plain' | 'real' | 'auto' {
  if (flag === 'cheap') return 'plain'
  if (flag === 'real') return 'real'
  return setting
}

/** The G-code preview's SVG: low draws for speed, else for precision (and for speed while panning). */
export function gcodeShapeRendering (detail: unknown, panning: boolean): 'optimizeSpeed' | 'geometricPrecision' {
  return panning || modelDetail(detail) === 'low' ? 'optimizeSpeed' : 'geometricPrecision'
}
