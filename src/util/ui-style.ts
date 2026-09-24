import type { UiStyle } from '@/store/config/types'

// Glass is the Muon3D interface; Flat stays in Settings as the alternative.
export const DEFAULT_UI_STYLE: UiStyle = 'glass'

export const UI_STYLES: readonly UiStyle[] = ['glass', 'flat']

const STORAGE_KEY = 'muon.uiStyle'

export const isUiStyle = (value: unknown): value is UiStyle => UI_STYLES.includes(value as UiStyle)

// The style is an attribute on <html> rather than a class on v-app, so the
// glass token layer also reaches the page background and every overlay
// Vuetify detaches from the component that opened it.
export const applyUiStyle = (style: unknown) => {
  const value = isUiStyle(style) ? style : DEFAULT_UI_STYLE

  document.documentElement.dataset.m3dStyle = value

  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage can be unavailable (private mode); the style still applies.
  }
}

// The sign-in page renders before the printer's saved settings can be read,
// so it uses the last style this browser applied. The caller puts the result
// in the store, so components and stylesheet agree until settings load.
export const restoreUiStyle = (): UiStyle => {
  let value: string | null = null

  try {
    value = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Fall through to the default.
  }

  const style = isUiStyle(value) ? value : DEFAULT_UI_STYLE

  document.documentElement.dataset.m3dStyle = style

  return style
}
