import { afterEach, describe, expect, it } from 'vitest'
import { applyUiStyle, DEFAULT_UI_STYLE, restoreUiStyle } from '../ui-style'
import { defaultState } from '@/store/config/state'
import { mutations } from '@/store/config/mutations'
import { getters } from '@/store/config/getters'
import { Globals } from '@/globals'
import type { ConfigState, ThemeConfig, UiSettings } from '@/store/config/types'

const getChartFontFamily = getters.getChartFontFamily as (state: ConfigState) => string

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.m3dStyle
})

describe('interface style', () => {
  it('marks <html> with the style and remembers it for the sign-in page', () => {
    applyUiStyle('rounded')

    expect(document.documentElement.dataset.m3dStyle).toBe('rounded')

    delete document.documentElement.dataset.m3dStyle
    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe('rounded')
  })

  it.each([undefined, 'glass', 42])('falls back to the default for %s', (value) => {
    applyUiStyle(value)

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('restores the default when this browser has never chosen one', () => {
    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('ignores a stored value it does not recognise', () => {
    localStorage.setItem('muon.uiStyle', 'glass')

    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('gives a theme saved before styles existed the default style', () => {
    const state = defaultState()
    const saved = { theme: { color: '#2196F3', isDark: false, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: true } }

    mutations.setInitUiSettings(state, saved as unknown as Partial<UiSettings>)

    expect(state.uiSettings.theme.style).toBe(DEFAULT_UI_STYLE)
    expect(state.uiSettings.theme.color).toBe('#2196F3')
  })

  it('tells the charts the font of the current style', () => {
    const state = defaultState()

    expect(getChartFontFamily(state)).toBe(Globals.CHART_FONT_FAMILY)

    state.uiSettings.theme = { ...state.uiSettings.theme, style: 'rounded' } satisfies ThemeConfig

    expect(getChartFontFamily(state)).toBe(Globals.CHART_FONT_FAMILY_ROUNDED)
  })
})
