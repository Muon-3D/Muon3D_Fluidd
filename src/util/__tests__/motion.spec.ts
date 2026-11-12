import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EASE, MOTION, PRESS, SPRINGS, animate, reducedMotion, spring } from '../motion'

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

  it('has the press scale and timings in both places', () => {
    expect(PRESS).toEqual({ scale: 0.95, in: 80, out: 320 })
    expect(token('motion-press-scale')).toBe(String(PRESS.scale))
    expect(token('motion-press-in')).toBe(`${PRESS.in}ms`)
    expect(token('motion-press-out')).toBe(`${PRESS.out}ms`)
  })

  it('points the older aliases at the approved tokens', () => {
    expect(token('duration-fast')).toBe('var(--m3d-motion-fast)')
    expect(token('duration-base')).toBe('var(--m3d-motion-base)')
    expect(token('ease')).toBe('var(--m3d-ease-standard)')
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

  it('reads reduced motion from the class the Animations setting puts on the root', () => {
    const source = readFileSync(`${process.cwd()}/src/services/m1-3d/device-settings.ts`, 'utf8')
    expect(source).toMatch(/REDUCED_MOTION_CLASS = 'm3d-reduced-motion'/)
    document.documentElement.classList.remove('m3d-reduced-motion')
    expect(reducedMotion()).toBe(false)
    document.documentElement.classList.add('m3d-reduced-motion')
    expect(reducedMotion()).toBe(true)
    document.documentElement.classList.remove('m3d-reduced-motion')
  })

  it('under reduced motion keeps only a short fade, whatever the caller asked for', () => {
    const calls: [Keyframe[], KeyframeAnimationOptions][] = []
    const el = { animate: (f: Keyframe[], o: KeyframeAnimationOptions) => { calls.push([f, o]); return null } } as unknown as Element
    document.documentElement.classList.add('m3d-reduced-motion')
    animate(el, [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], 500, EASE.enter, { duration: 900, iterations: Infinity, delay: 300 })
    document.documentElement.classList.remove('m3d-reduced-motion')
    const [frames, options] = calls[0]
    expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }])
    expect(options).toMatchObject({ duration: 120, easing: 'linear', iterations: 1, delay: 0 })
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
