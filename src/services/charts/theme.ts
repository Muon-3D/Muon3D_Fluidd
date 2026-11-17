/**
 * Chart text in the glass theme's own colours. Charts draw on a canvas, where
 * CSS variables don't reach, so these mirror the tokens in
 * src/scss/muon3d-glass.scss (a unit test keeps them in step).
 */
export const GLASS_TOKENS = {
  dark: { text: '#f5f5f7', muted: '#98989d', surface: '#1c1c1e', bg: '#000000' },
  light: { text: '#1d1d1f', muted: '#6e6e73', surface: '#ffffff', bg: '#f2f2f7' }
} as const

export interface ChartInk {
  /** Axis labels, axis names and legends: the theme's muted text. */
  label: string
  /** Tooltip values: the theme's text. */
  text: string
}

export function chartInk (dark: boolean): ChartInk {
  const tokens = dark ? GLASS_TOKENS.dark : GLASS_TOKENS.light
  return { label: tokens.muted, text: tokens.text }
}

const channel = (c: number) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio of two opaque #rgb or #rrggbb colours. */
export function contrastRatio (a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
