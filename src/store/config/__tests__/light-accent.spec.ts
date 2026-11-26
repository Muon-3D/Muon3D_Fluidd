// KAN-6497: the company teal on the light theme is the design system's fixed #1e7f79
// (tokens v0.6.1), not a darkened copy of the dark accent. Other accents still darken.
import { describe, expect, it, vi } from 'vitest'

const theme: any = vi.hoisted(() => ({ dark: false, currentTheme: {}, themes: { dark: {}, light: {} } }))
vi.mock('@/plugins/vuetify', () => ({
  default: { framework: { theme, icons: { values: {} } } }
}))
vi.mock('@/util/ui-style', () => ({ applyUiStyle: vi.fn() }))
vi.mock('@/util/glass-icons', () => ({ applyGlassIcons: vi.fn() }))

import { actions } from '../actions'

const apply = (color: string, isDark: boolean) =>
  (actions as any).onThemeChange({}, { color, isDark, logo: { light: '#fff', dark: '#000' }, style: 'glass' })

describe('light-theme accent', () => {
  it('is #1e7f79 for the default teal, with white text on it', async () => {
    await apply('#80d6d1', false)
    expect(theme.currentTheme.primary).toBe('#1e7f79')
    expect(document.documentElement.style.getPropertyValue('--m3d-on-accent')).toBe('#ffffff')
  })
  it('keeps the company teal on dark', async () => {
    await apply('#80d6d1', true)
    expect(theme.currentTheme.primary).toBe('#80d6d1')
  })
  it('still darkens another accent on light', async () => {
    await apply('#ffb36b', false)
    expect(theme.currentTheme.primary).not.toBe('#ffb36b')
  })
})
