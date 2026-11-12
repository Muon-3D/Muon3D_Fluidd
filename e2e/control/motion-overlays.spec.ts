/**
 * Motion, dialogs / menus / sheets (KAN-2257, motion gallery "Dialogs, menus,
 * toasts").
 *
 * What a person sees: a menu grows out of the button that opened it, quickly,
 * and is gone faster than it came; a dialog arrives from just under full size
 * on a gentle spring, not from half size; a phone sheet rises from the bottom
 * edge. With reduced motion, nothing moves.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { frameTimes, sampleMotion, type MotionSample } from './motion'

/** The transition an overlay has while it carries `cls` (an enter or leave class), read in the page. */
function transitionWhile (page: Page, selector: string, cls: string) {
  return page.evaluate(([sel, c]) => new Promise<{ duration: string, easing: string } | null>(resolve => {
    const start = performance.now()
    const tick = () => {
      const el = Array.from(document.querySelectorAll(sel)).find(e => e.classList.contains(c))
      if (el) {
        const s = getComputedStyle(el)
        return resolve({ duration: s.transitionDuration, easing: s.transitionTimingFunction })
      }
      if (performance.now() - start > 4000) return resolve(null)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), [selector, cls] as const)
}

const smallest = (s: MotionSample[]) => Math.min(...s.map(x => x.scale))
const settledBy = (s: MotionSample[]) => s.find(x => x.opacity === 1 && Math.abs(x.scale - 1) < 0.002 && Math.abs(x.y) < 0.5)?.t ?? Infinity

test.describe('on a computer', () => {
  test.skip(({ isMobile }) => !!isMobile, 'the printer menu is a sheet on a phone')

  test('the printer menu grows out of its button in about 160 ms and leaves faster', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__menu', 600)
    const entering = transitionWhile(page, '.printer-switch__menu', 'v-menu-transition-enter-active')
    const times = frameTimes(page, 600)
    await button.click()
    // 160 ms on the enter curve.
    const enter = await entering
    expect(enter?.duration).toMatch(/^0\.16s(, 0\.16s)*$/)
    expect(enter?.easing).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
    const s = await opening
    info.annotations.push({ type: 'menu open samples', description: JSON.stringify(s.slice(0, 14)) })
    // Its first frame on screen is see-through (it fades in, not pops), it
    // never starts smaller than 94 %, and it settles.
    expect(s[0].opacity).toBeLessThan(1)
    expect(smallest(s)).toBeGreaterThanOrEqual(0.93)
    console.log(`[menu-open] ${info.project.name}: settled by ${settledBy(s)} ms`)
    const t = await times
    console.log(`[frame-times] menu ${info.project.name}: ${JSON.stringify(t)}`)

    // A click outside: it is gone within three quarters of the entry (120 ms),
    // plus a frame or two, timed in the page from the click.
    // The menu, as it starts to leave: what its leaving transition is, read
    // from the page (a busy machine can skip frames, so timing it is unreliable).
    const leaving = page.evaluate(sel => new Promise<{ duration: string, easing: string } | null>(resolve => {
      const start = performance.now()
      const tick = () => {
        const el = document.querySelector(sel) as HTMLElement | null
        if (el && el.classList.contains('v-menu-transition-leave-active')) {
          const s = getComputedStyle(el)
          return resolve({ duration: s.transitionDuration, easing: s.transitionTimingFunction })
        }
        if (performance.now() - start > 3000) return resolve(null)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }), '.printer-switch__menu')
    // Outside the menu: the bottom-right corner of the page, well clear of it
    // and of anything that does something when clicked.
    const view = page.viewportSize()!
    await page.mouse.click(view.width - 260, view.height - 6)
    const leave = await leaving
    console.log(`[menu-close] ${info.project.name}: ${JSON.stringify(leave)}`)
    // Three quarters of the entry (120 ms), on the exit curve.
    expect(leave?.duration).toMatch(/^0\.12s(, 0\.12s)*$/)
    expect(leave?.easing).toContain('cubic-bezier(0.4, 0, 1, 1)')
    await expect(page.locator('.printer-switch__menu:visible')).toHaveCount(0, { timeout: 5000 })
  })

  test('a dialog arrives from just under full size on a gentle spring, not from half size', async ({ page, open }, info) => {
    await open('/')
    const search = page.getByText('Search or run a command').first()
    await expect(search).toBeVisible()
    const opening = sampleMotion(page, '.command-bar__dialog', 900)
    const entering = transitionWhile(page, '.command-bar__dialog', 'dialog-transition-enter-active')
    await search.click()
    // The gentle spring for its size, a fast fade for its opacity.
    const enter = await entering
    expect(enter?.duration).toMatch(/0\.536s/)
    expect(enter?.easing).toMatch(/^linear\(/)
    const s = await opening
    info.annotations.push({ type: 'dialog open samples', description: JSON.stringify(s.slice(0, 20)) })
    // Vuetify's own dialog grows from 50 %; ours from 92 %, fading in.
    expect(s[0].opacity).toBeLessThan(1)
    expect(smallest(s)).toBeGreaterThanOrEqual(0.91)
    // The gentle spring passes 1 by a little before it settles.
    expect(Math.max(...s.map(x => x.scale))).toBeLessThan(1.03)
    console.log(`[dialog-open] ${info.project.name}: settled by ${settledBy(s)} ms`)
  })
})

test.describe('on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the printer sheet is a menu on a computer')

  test('the printer sheet rises from the bottom edge and settles', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__sheet', 900)
    const entering = transitionWhile(page, '.printer-switch__sheet', 'bottom-sheet-transition-enter-active')
    const times = frameTimes(page, 900)
    await button.click()
    // A slow step on the enter curve: no spring, so no overshoot.
    const enter = await entering
    expect(enter?.duration).toMatch(/^0\.34s/)
    expect(enter?.easing).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
    const s = await opening
    info.annotations.push({ type: 'sheet open samples', description: JSON.stringify(s.slice(0, 20)) })
    expect(Math.max(...s.map(x => x.y))).toBeGreaterThan(40)
    // No overshoot: the sheet never rises past its resting place, so no gap
    // opens under it.
    expect(Math.min(...s.map(x => x.y))).toBeGreaterThanOrEqual(-0.5)
    console.log(`[sheet-open] ${info.project.name}: settled by ${settledBy(s)} ms`)
    const t = await times
    console.log(`[frame-times] sheet ${info.project.name}: ${JSON.stringify(t)}`)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('menus and sheets appear without moving', async ({ page, open, isMobile }) => {
    await open('/')
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('m3d-reduced-motion'))).toBe(true)
    const button = page.getByTestId('printer-switch').first()
    const opening = sampleMotion(page, isMobile ? '.printer-switch__sheet' : '.printer-switch__menu', 400)
    await button.click()
    // Every frame you can see (on screen, not transparent) is the final one:
    // it appears, it doesn't move.
    const seen = (await opening).filter(x => x.onScreen && x.opacity > 0.01)
    expect(seen.length).toBeGreaterThan(0)
    expect(smallest(seen)).toBeGreaterThan(0.999)
    expect(Math.max(...seen.map(x => Math.abs(x.y)))).toBeLessThan(1)
  })
})
