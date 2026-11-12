import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EASE, MOTION, SPRINGS, spring } from '../motion'

// The stylesheet and the script must say the same thing, or CSS transitions
// and Web Animations in one view drift apart. Read the stylesheet as text.
const scss = readFileSync(`${process.cwd()}/src/scss/muon3d.scss`, 'utf8')
const token = (name: string) => {
  const m = scss.match(new RegExp(`--m3d-${name}:\\s*([^;]+);`))
  return m ? m[1].trim() : undefined
}

describe('motion tokens', () => {
  it('has the six durations and the stagger from the gallery, in the stylesheet and the script alike', () => {
    expect(MOTION).toEqual({ instant: 80, fast: 160, base: 240, slow: 340, slower: 520, camera: 800, stagger: 40 })
    for (const [name, ms] of Object.entries(MOTION)) expect(token(`motion-${name}`)).toBe(`${ms}ms`)
  })

  it('has the three curves in both places', () => {
    expect(token('ease-standard')).toBe(EASE.standard)
    expect(token('ease-enter')).toBe(EASE.enter)
    expect(token('ease-exit')).toBe(EASE.exit)
  })

  it('keeps each spring in the stylesheet equal to the one the script generates', () => {
    for (const [name, s] of Object.entries(SPRINGS)) {
      expect(token(`spring-${name}`)).toBe(s.css)
      expect(token(`spring-${name}-duration`)).toBe(`${s.ms}ms`)
    }
  })

  it('makes snappy settle without overshoot, gentle overshoot a little and bouncy about 13 %', () => {
    const peak = (s: ReturnType<typeof spring>) => Math.max(...Array.from({ length: 400 }, (_, i) => s.at(i / 400)))
    expect(peak(SPRINGS.snappy)).toBeLessThanOrEqual(1)
    expect(peak(SPRINGS.gentle)).toBeGreaterThan(1.01)
    expect(peak(SPRINGS.gentle)).toBeLessThan(1.03)
    expect(peak(SPRINGS.bouncy)).toBeGreaterThan(1.1)
    expect(peak(SPRINGS.bouncy)).toBeLessThan(1.15)
    for (const s of Object.values(SPRINGS)) expect(s.at(1)).toBe(1)
  })
})
