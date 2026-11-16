import Vue from 'vue'
import { modelAnimates, modelRenderOptions, type ModelDetail, type ModelGlass, type ModelRenderOptions } from './render-options'

/**
 * Settings › G-code preview and 3D: the 3D printer and animation choices.
 * They are this person's on this device (a phone may want Low while the
 * desk PC wants High), so they live in local storage, not on the printer.
 */
export interface ModelDeviceSettings {
  /** Off, Overview shows the camera, or a still picture of the printer. */
  show: boolean;
  detail: ModelDetail;
  glass: ModelGlass;
  /** The layers printed so far, drawn on the model's plate. */
  printGrowing: boolean;
  /** On, off, or null to follow the device's reduce-motion setting. */
  animations: boolean | null;
  /** What Overview's stage opens on when it has a camera. */
  opensOn: '3d' | 'camera';
}

export const MODEL_SETTINGS_KEY = 'muon3d.model3d'

export const MODEL_SETTINGS_DEFAULTS: Readonly<ModelDeviceSettings> = Object.freeze({
  show: true,
  detail: 'auto',
  glass: 'auto',
  printGrowing: true,
  animations: null,
  opensOn: '3d'
})

/** The stored settings, any missing or unknown value its default. */
export function parseModelSettings (raw: string | null): ModelDeviceSettings {
  let v: Record<string, unknown> = {}
  try {
    const parsed = raw ? JSON.parse(raw) : {}
    if (parsed && typeof parsed === 'object') v = parsed
  } catch {}
  const d = MODEL_SETTINGS_DEFAULTS
  return {
    show: typeof v.show === 'boolean' ? v.show : d.show,
    detail: v.detail === 'high' || v.detail === 'low' ? v.detail : d.detail,
    glass: v.glass === 'real' || v.glass === 'plain' ? v.glass : d.glass,
    printGrowing: typeof v.printGrowing === 'boolean' ? v.printGrowing : d.printGrowing,
    animations: typeof v.animations === 'boolean' ? v.animations : null,
    opensOn: v.opensOn === 'camera' ? 'camera' : d.opensOn
  }
}

/** Set once the printer's old per-printer Animations choice has been looked at on this device. */
export const LEGACY_ANIMATIONS_KEY = 'muon3d.model3d.legacyAnimations'

/**
 * Animations used to be `uiSettings.gcodePreview.showAnimations`, saved on
 * the printer. They are this device's now, so the first time the old value
 * is seen, and this device hasn't chosen yet, it starts from it. Only a
 * saved `false` carries over: `true` was the default, and keeping the device
 * following its reduce-motion setting is what the default meant.
 */
export function migrateLegacyAnimations (legacy: unknown) {
  if (typeof legacy !== 'boolean') return
  try {
    if (localStorage.getItem(LEGACY_ANIMATIONS_KEY)) return
    localStorage.setItem(LEGACY_ANIMATIONS_KEY, '1')
  } catch {
    return
  }
  if (legacy === false && modelSettings.animations === null) setModelSetting('animations', false)
}

function read (): string | null {
  try {
    return localStorage.getItem(MODEL_SETTINGS_KEY)
  } catch {
    return null
  }
}

export const modelSettings: ModelDeviceSettings = Vue.observable(parseModelSettings(read()))

export function setModelSetting<K extends keyof ModelDeviceSettings> (key: K, value: ModelDeviceSettings[K]) {
  modelSettings[key] = value
  try {
    localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(modelSettings))
  } catch {}
}

/** The system's prefers-reduced-motion, asked now. */
function prefersReducedMotion (): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/** What the renderer draws with now: the settings above, the device's pixel ratio and its reduced-motion choice. */
export function liveRenderOptions (width: number): ModelRenderOptions {
  return modelRenderOptions({
    detail: modelSettings.detail,
    animations: modelSettings.animations,
    reducedMotion: prefersReducedMotion(),
    devicePixelRatio: window.devicePixelRatio || 1,
    width
  })
}

/** On the root element while the whole app moves without motion (Animations Off, or Like this device under reduce motion). */
export const REDUCED_MOTION_CLASS = 'm3d-reduced-motion'

/**
 * Keeps the root element's reduced-motion class in step with the Animations
 * setting and the device's reduce-motion choice, so one switch covers the
 * model, the G-code preview, tile springs, sheets and page transitions.
 * Returns a function that stops watching.
 */
export function followMotionSetting (root: HTMLElement = document.documentElement): () => void {
  let query: MediaQueryList | null = null
  try {
    query = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  } catch {}
  const apply = () => {
    root.classList.toggle(REDUCED_MOTION_CLASS, !modelAnimates(modelSettings.animations, query?.matches ?? false))
  }
  apply()
  const stopWatch = new Vue().$watch(() => modelSettings.animations, apply)
  query?.addEventListener?.('change', apply)
  return () => {
    stopWatch()
    query?.removeEventListener?.('change', apply)
  }
}
