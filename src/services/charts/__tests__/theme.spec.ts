import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GLASS_TOKENS, chartInk, contrastRatio } from '../theme'
import { buildGraphOption } from '../graph-option'

const scss = readFileSync(resolve(__dirname, '../../../scss/muon3d-glass.scss'), 'utf8')

/** A token's value in the glass theme's `.theme--dark {` or `.theme--light {` block. */
function token (theme: 'dark' | 'light', name: string): string {
  const start = scss.indexOf(`.v-application.theme--${theme} {`)
  const block = scss.slice(start, scss.indexOf('}', start))
  const found = new RegExp(`--m3d-${name}:\\s*([^;]+);`).exec(block)
  if (!found) throw new Error(`--m3d-${name} not found for ${theme}`)
  return found[1].trim()
}

const hex6 = (v: string) => v.length === 4 ? '#' + v.slice(1).split('').map(c => c + c).join('') : v

describe('chart text uses the glass theme tokens', () => {
  for (const theme of ['dark', 'light'] as const) {
    it(`matches muon3d-glass.scss (${theme})`, () => {
      expect(GLASS_TOKENS[theme].text).toBe(hex6(token(theme, 'text')))
      expect(GLASS_TOKENS[theme].muted).toBe(hex6(token(theme, 'text-muted')))
      expect(GLASS_TOKENS[theme].surface).toBe(hex6(token(theme, 'surface')))
    })

    it(`reads at WCAG AA (4.5:1) on the card and the page (${theme})`, () => {
      const ink = chartInk(theme === 'dark')
      const { surface, bg } = GLASS_TOKENS[theme]
      for (const back of [surface, bg]) {
        expect(contrastRatio(ink.label, back)).toBeGreaterThanOrEqual(4.5)
        expect(contrastRatio(ink.text, back)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('the temperature graph labels its axes with the token', () => {
    for (const dark of [true, false]) {
      const option: any = buildGraphOption({ from: 0, to: 1, dark, markers: [], lines: [] })
      expect(option.xAxis.axisLabel.color).toBe(chartInk(dark).label)
      expect(option.yAxis[0].axisLabel.color).toBe(chartInk(dark).label)
    }
  })

  it('computes contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#fff', '#fff')).toBe(1)
  })
})
