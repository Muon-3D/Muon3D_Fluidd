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
  it('defaults to glass', () => {
    expect(DEFAULT_UI_STYLE).toBe('glass')
  })

  it('marks <html> with the style and remembers it for the sign-in page', () => {
    applyUiStyle('flat')

    expect(document.documentElement.dataset.m3dStyle).toBe('flat')

    delete document.documentElement.dataset.m3dStyle
    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe('flat')
  })

  it.each([undefined, 'rounded', 42])('falls back to the default for %s', (value) => {
    applyUiStyle(value)

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('restores the default when this browser has never chosen one', () => {
    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('ignores a stored value it does not recognise', () => {
    localStorage.setItem('muon.uiStyle', 'rounded')

    restoreUiStyle()

    expect(document.documentElement.dataset.m3dStyle).toBe(DEFAULT_UI_STYLE)
  })

  it('returns the restored style, for the store to hold until settings load', () => {
    localStorage.setItem('muon.uiStyle', 'flat')

    expect(restoreUiStyle()).toBe('flat')
  })

  it('gives a theme saved before styles existed the default style', () => {
    const state = defaultState()
    const saved = { theme: { color: '#2196F3', isDark: false, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: true } }

    mutations.setInitUiSettings(state, saved as unknown as Partial<UiSettings>)

    expect(state.uiSettings.theme.style).toBe(DEFAULT_UI_STYLE)
    expect(state.uiSettings.theme.color).toBe('#2196F3')
  })

  it("lets the printer's saved settings replace the style restored for sign-in", () => {
    const withoutStyle = defaultState()
    mutations.setRestoredUiStyle(withoutStyle, 'flat')
    mutations.setInitUiSettings(withoutStyle, { theme: { color: '#2196F3', isDark: true, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: false } } as unknown as Partial<UiSettings>)

    expect(withoutStyle.uiSettings.theme.style).toBe(DEFAULT_UI_STYLE)

    const withStyle = defaultState()
    mutations.setRestoredUiStyle(withStyle, 'glass')
    mutations.setInitUiSettings(withStyle, { theme: { style: 'flat' } } as unknown as Partial<UiSettings>)

    expect(withStyle.uiSettings.theme.style).toBe('flat')
  })

  it('tells the charts the font of the current style', () => {
    const state = defaultState()
    state.uiSettings.theme = { ...state.uiSettings.theme, style: 'flat' } satisfies ThemeConfig

    expect(getChartFontFamily(state)).toBe(Globals.CHART_FONT_FAMILY)

    state.uiSettings.theme = { ...state.uiSettings.theme, style: 'glass' } satisfies ThemeConfig

    expect(getChartFontFamily(state)).toBe(Globals.CHART_FONT_FAMILY_GLASS)
  })
})
