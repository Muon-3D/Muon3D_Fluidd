import type { UiStyle } from '@/store/config/types'

export const DEFAULT_UI_STYLE: UiStyle = 'flat'

export const UI_STYLES: readonly UiStyle[] = ['flat', 'rounded']

const STORAGE_KEY = 'muon.uiStyle'

export const isUiStyle = (value: unknown): value is UiStyle => UI_STYLES.includes(value as UiStyle)

// The style is an attribute on <html> rather than a class on v-app, so the
// rounded token layer also reaches the page background and every overlay
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
// so it uses the last style this browser applied.
export const restoreUiStyle = () => {
  let value: string | null = null

  try {
    value = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Fall through to the default.
  }

  document.documentElement.dataset.m3dStyle = isUiStyle(value) ? value : DEFAULT_UI_STYLE
}
