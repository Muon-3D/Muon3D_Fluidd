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
import { frameTimes, sampleMotion, type MotionSample } from './motion'

const smallest = (s: MotionSample[]) => Math.min(...s.map(x => x.scale))
const settledBy = (s: MotionSample[]) => s.find(x => x.opacity === 1 && Math.abs(x.scale - 1) < 0.002 && Math.abs(x.y) < 0.5)?.t ?? Infinity

test.describe('on a computer', () => {
  test.skip(({ isMobile }) => !!isMobile, 'the printer menu is a sheet on a phone')

  test('the printer menu grows out of its button in about 160 ms and leaves faster', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__menu', 600)
    const times = frameTimes(page, 600)
    await button.click()
    const s = await opening
    info.annotations.push({ type: 'menu open samples', description: JSON.stringify(s.slice(0, 14)) })
    // It starts small and see-through, from 94 %, and is settled inside ~250 ms.
    expect(s[0].opacity).toBeLessThan(1)
    expect(smallest(s)).toBeGreaterThanOrEqual(0.93)
    expect(smallest(s)).toBeLessThan(0.99)
    // 160 ms on the enter curve; the bound allows a busy machine's dropped frames.
    expect(settledBy(s)).toBeLessThan(500)
    const t = await times
    console.log(`[frame-times] menu ${info.project.name}: ${JSON.stringify(t)}`)

    // A click outside: it is gone within three quarters of the entry (120 ms),
    // plus a frame or two, timed in the page from the click.
    const closing = page.evaluate(sel => new Promise<Array<[number, number, boolean]>>(resolve => {
      const start = performance.now()
      const out: Array<[number, number, boolean]> = []
      const tick = () => {
        const el = document.querySelector(sel) as HTMLElement | null
        const t = Math.round(performance.now() - start)
        const style = el ? getComputedStyle(el) : null
        out.push([t, style ? +style.opacity : 0, !!style && style.display !== 'none'])
        if (t > 1500 || (out.length > 1 && !out[out.length - 1][2])) return resolve(out)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }), '.printer-switch__menu')
    await page.mouse.click(700, 600)
    const frames = await closing
    // From the first frame it starts to fade to the frame it is gone: three
    // quarters of a fast step (120 ms), plus a frame or two.
    const fading = frames.find(([, o]) => o < 1)?.[0] ?? Infinity
    const gone = frames.find(([, o, shown]) => !shown || o < 0.01)?.[0] ?? Infinity
    console.log(`[menu-close] ${info.project.name}: fades ${gone - fading} ms; frames ${JSON.stringify(frames)}`)
    expect(gone).toBeLessThan(Infinity)
    expect(gone - fading).toBeLessThan(300)
  })

  test('a dialog arrives from just under full size on a gentle spring, not from half size', async ({ page, open }, info) => {
    await open('/')
    const search = page.getByText('Search or run a command').first()
    await expect(search).toBeVisible()
    const opening = sampleMotion(page, '.command-bar__dialog', 900)
    await search.click()
    const s = await opening
    info.annotations.push({ type: 'dialog open samples', description: JSON.stringify(s.slice(0, 20)) })
    // Vuetify's own dialog grows from 50 %; ours from 92 %.
    expect(smallest(s)).toBeGreaterThanOrEqual(0.91)
    expect(smallest(s)).toBeLessThan(0.99)
    // The gentle spring passes 1 by a little before it settles.
    expect(Math.max(...s.map(x => x.scale))).toBeLessThan(1.03)
    expect(settledBy(s)).toBeLessThan(700)
  })
})

test.describe('on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the printer sheet is a menu on a computer')

  test('the printer sheet rises from the bottom edge and settles', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__sheet', 900)
    const times = frameTimes(page, 900)
    await button.click()
    const s = await opening
    info.annotations.push({ type: 'sheet open samples', description: JSON.stringify(s.slice(0, 20)) })
    expect(Math.max(...s.map(x => x.y))).toBeGreaterThan(40)
    expect(settledBy(s)).toBeLessThan(800)
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
