/**
 * Motion, dialogs / menus / sheets (KAN-2257, motion gallery "Dialogs, menus,
 * toasts").
 *
 * What a person sees: a menu grows from its own corner, quickly, and is gone
 * faster than it came; a dialog arrives from just under full size on a gentle
 * spring, not from half size; a phone sheet rises from the bottom edge; the
 * scrim behind a dialog fades in and out. A select's menu is left to Vuetify.
 * With reduced motion, nothing moves.
 *
 * The enter and leave transitions are read by a MutationObserver installed
 * before the action (see watchClass), so a slow frame cannot skip them.
 */
import { test, expect } from '../fixtures'
import { frameTimes, sampleMotion, watchClass, type MotionSample } from './motion'

const smallest = (s: MotionSample[]) => Math.min(...s.map(x => x.scale))
const settledBy = (s: MotionSample[]) => s.find(x => x.opacity === 1 && Math.abs(x.scale - 1) < 0.002 && Math.abs(x.y) < 0.5)?.t ?? Infinity

test.describe('on a computer', () => {
  test.skip(({ isMobile }) => !!isMobile, 'the printer menu is a sheet on a phone')

  test('the printer menu grows in about 160 ms and leaves faster', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__menu', 600)
    const entering = await watchClass(page, '.printer-switch__menu', 'v-menu-transition-enter-active')
    const times = frameTimes(page, 600)
    await button.click()
    // 160 ms on the enter curve.
    const enter = await entering()
    expect(enter?.duration).toMatch(/^0\.16s(, 0\.16s)*$/)
    expect(enter?.easing).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
    // It grows from 90 % (read with the -enter class still on).
    expect(enter?.classes).toContain('v-menu-transition-enter')
    expect(enter!.scale).toBeCloseTo(0.9, 2)
    const s = await opening
    info.annotations.push({ type: 'menu open samples', description: JSON.stringify(s.slice(0, 14)) })
    // Its first frame on screen is see-through (it fades in, not pops).
    expect(s[0].opacity).toBeLessThan(1)
    console.log(`[menu-open] ${info.project.name}: settled by ${settledBy(s)} ms`)
    const t = await times
    console.log(`[frame-times] menu ${info.project.name}: ${JSON.stringify(t)}`)

    // A click outside: the menu leaves in three quarters of the entry (120 ms)
    // on the exit curve, read from the page by an observer at the moment the
    // class lands (timing it from outside is unreliable on a busy machine).
    const leaving = await watchClass(page, '.printer-switch__menu', 'v-menu-transition-leave-active')
    const leavingTo = await watchClass(page, '.printer-switch__menu', 'v-menu-transition-leave-to')
    // Outside the menu: the bottom-right corner of the page, well clear of it
    // and of anything that does something when clicked.
    const view = page.viewportSize()!
    await page.mouse.click(view.width - 260, view.height - 6)
    const leave = await leaving()
    console.log(`[menu-close] ${info.project.name}: ${JSON.stringify(leave)}`)
    expect(leave?.duration).toMatch(/^0\.12s(, 0\.12s)*$/)
    expect(leave?.easing).toContain('cubic-bezier(0.4, 0, 1, 1)')
    // It leaves to 96 %, a smaller step than it arrived with. The -leave-to
    // class lands a frame after -leave-active, so its computed transform is
    // already part-way along; the probe in watchClass reads the value the
    // -leave-to rule declares (same classes, transition off).
    const leaveTo = await leavingTo()
    expect(leaveTo?.classes).toContain('v-menu-transition-leave-to')
    expect(leaveTo!.declaredScale).toBeCloseTo(0.96, 2)
    await expect(page.locator('.printer-switch__menu:visible')).toHaveCount(0, { timeout: 5000 })
  })

  test('a dialog arrives from just under full size on a gentle spring, not from half size', async ({ page, open }, info) => {
    await open('/')
    const search = page.getByText('Search or run a command').first()
    await expect(search).toBeVisible()
    const opening = sampleMotion(page, '.command-bar__dialog', 900)
    const entering = await watchClass(page, '.command-bar__dialog', 'dialog-transition-enter-active')
    await search.click()
    // A fast fade for its opacity (listed first, so reduced motion keeps it),
    // the gentle spring for its size.
    const enter = await entering()
    // It grows from 92 % (read with the -enter class still on), not 50 %.
    expect(enter?.classes).toContain('dialog-transition-enter')
    expect(enter!.scale).toBeCloseTo(0.92, 2)
    expect(enter?.property).toMatch(/^opacity/)
    expect(enter?.duration).toMatch(/0\.536s/)
    expect(enter?.easing).toMatch(/linear\(/)
    const s = await opening
    info.annotations.push({ type: 'dialog open samples', description: JSON.stringify(s.slice(0, 20)) })
    // Vuetify's own dialog grows from 50 %; ours from 92 %, fading in.
    expect(s[0].opacity).toBeLessThan(1)
    expect(smallest(s)).toBeGreaterThanOrEqual(0.91)
    // The gentle spring passes 1 by a little before it settles.
    expect(Math.max(...s.map(x => x.scale))).toBeLessThan(1.03)
    console.log(`[dialog-open] ${info.project.name}: settled by ${settledBy(s)} ms`)

    // Escape: it leaves in 120 ms on the exit curve, opacity first, to 97 %
    // (declared value, read as for the menu).
    const leaving = await watchClass(page, '.command-bar__dialog', 'dialog-transition-leave-active')
    const leavingTo = await watchClass(page, '.command-bar__dialog', 'dialog-transition-leave-to')
    await page.keyboard.press('Escape')
    const leave = await leaving()
    expect(leave?.property).toMatch(/^opacity/)
    expect(leave?.duration).toMatch(/^0\.12s/)
    expect(leave?.easing).toMatch(/^cubic-bezier\(0\.4, 0, 1, 1\)/)
    const leaveTo = await leavingTo()
    expect(leaveTo?.classes).toContain('dialog-transition-leave-to')
    expect(leaveTo!.declaredScale).toBeCloseTo(0.97, 2)
  })

  test('the scrim fades in over 240 ms and out in 160 ms on the exit curve', async ({ page, open }) => {
    await open('/')
    const search = page.getByText('Search or run a command').first()
    await expect(search).toBeVisible()
    // Mark the overlay that becomes active for the dialog, so the closing
    // watch follows that very scrim and no other overlay on the page.
    const opening = await watchClass(page, '.v-overlay', 'v-overlay--active', 8000, '1')
    await search.click()
    // Open: the base step on the standard ease (opacity is the first entry).
    const shown = await opening()
    expect(shown?.property).toMatch(/^opacity/)
    expect(shown?.duration).toMatch(/^0\.24s/)
    expect(shown?.easing).toMatch(/^cubic-bezier\(0\.2, 0, 0, 1\)/)
    await expect(page.locator('.command-bar__dialog')).toBeVisible()
    // Closing: no .v-overlay--active, so the exit rule applies; a fast step on the exit curve.
    const closing = await watchClass(page, '.v-overlay[data-m3d-watch="1"]', '!v-overlay--active')
    await page.keyboard.press('Escape')
    const gone = await closing()
    expect(gone).not.toBeNull()
    expect(gone?.property).toMatch(/^opacity/)
    expect(gone?.duration).toMatch(/^0\.16s/)
    expect(gone?.easing).toMatch(/^cubic-bezier\(0\.4, 0, 1, 1\)/)
  })
})

test.describe('on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the printer sheet is a menu on a computer')

  test('the printer sheet rises from the bottom edge and settles', async ({ page, open }, info) => {
    await open('/')
    const button = page.getByTestId('printer-switch').first()
    await expect(button).toBeVisible()
    const opening = sampleMotion(page, '.printer-switch__sheet', 900)
    const entering = await watchClass(page, '.printer-switch__sheet', 'bottom-sheet-transition-enter-active')
    const times = frameTimes(page, 900)
    await button.click()
    // A slow step on the enter curve: no spring, so no overshoot.
    const enter = await entering()
    expect(enter?.duration).toMatch(/^0\.34s/)
    expect(enter?.easing).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
    // It starts below the screen: translated down by at least its own height,
    // read in the same callback, with the -enter class still on.
    expect(enter?.classes).toContain('bottom-sheet-transition-enter')
    expect(enter!.height).toBeGreaterThan(0)
    expect(enter!.ty).toBeGreaterThanOrEqual(enter!.height - 1)
    const s = await opening
    info.annotations.push({ type: 'sheet open samples', description: JSON.stringify(s.slice(0, 20)) })
    // No overshoot: the sheet never rises past its resting place, so no gap
    // opens under it.
    expect(Math.min(...s.map(x => x.y))).toBeGreaterThanOrEqual(-0.5)
    // It ends fully on screen, its bottom at the bottom of the viewport.
    const view = page.viewportSize()!
    const bottom = () => page.evaluate(sel => document.querySelector(sel)!.getBoundingClientRect().bottom, '.printer-switch__sheet')
    await expect.poll(async () => Math.abs((await bottom()) - view.height)).toBeLessThanOrEqual(2)
    console.log(`[sheet-open] ${info.project.name}: settled by ${settledBy(s)} ms`)

    // Escape: it drops away in three quarters of the entry (255 ms) on the exit curve.
    const leaving = await watchClass(page, '.printer-switch__sheet', 'bottom-sheet-transition-leave-active')
    await page.keyboard.press('Escape')
    const leave = await leaving()
    expect(leave?.duration).toMatch(/^0\.255s/)
    expect(leave?.easing).toContain('cubic-bezier(0.4, 0, 1, 1)')
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

  test('a dialog fades in a fast step, not over the spring\'s length', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'the command bar dialog is measured on a computer')
    await open('/')
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('m3d-reduced-motion'))).toBe(true)
    const search = page.getByText('Search or run a command').first()
    await expect(search).toBeVisible()
    const entering = await watchClass(page, '.command-bar__dialog', 'dialog-transition-enter-active')
    await search.click()
    const enter = await entering()
    // The reduced-motion rule keeps only the first property: it must be
    // opacity, on the fast step (160 ms), not the spring's 536 ms.
    expect(enter?.property).toBe('opacity')
    expect(parseFloat(enter!.duration.split(',')[0])).toBeLessThanOrEqual(0.16)
    expect(enter?.duration).not.toMatch(/^0\.536s/)
  })
})
