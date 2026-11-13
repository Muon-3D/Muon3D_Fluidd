/**
 * Motion, press / hover / focus (KAN-2257, motion gallery "Press, hover, focus").
 *
 * What a person sees: a button sinks a little the moment it is pressed and
 * springs back when let go; a focused button gets a ring that grows out of it;
 * a switch's thumb slides across. With reduced motion (the system setting,
 * and Control's Animations switch left on "Like this device") nothing scales.
 * Stop and E-STOP never animate their press.
 */
import { test, expect, type Page, type Locator } from '../fixtures'
import { frameTimes } from './motion'

// A button every Control page view has, which does nothing until clicked
// (the tests press and slide off, so it is never clicked).
const editLayout = (page: Page) => page.getByRole('button', { name: 'Edit layout' })

const scaleOf = (el: Locator) => el.evaluate(e => {
  const t = getComputedStyle(e).transform
  return t === 'none' ? 1 : new DOMMatrixReadOnly(t).a
})

const ringOf = (el: Locator) => el.evaluate(e => {
  const s = getComputedStyle(e, '::after')
  return { opacity: +s.opacity, content: s.content }
})

async function pressAndRead (page: Page, button: Locator, ms: number) {
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(ms)
  const pressed = await scaleOf(button)
  // Slide off before letting go, so the press never becomes a click.
  await page.mouse.move(1, 1)
  await page.mouse.up()
  return pressed
}

test.describe('buttons answer the finger', () => {
  test('a button sinks on press inside 80 ms and springs back when let go', async ({ page, open }) => {
    await open('/control')
    const button = editLayout(page)
    await expect(button).toBeVisible()
    expect(await scaleOf(button)).toBe(1)
    // Pressed: at 0.95 within the 80 ms press-in plus a frame or two.
    const pressed = await pressAndRead(page, button, 140)
    expect(pressed).toBeLessThan(0.96)
    expect(pressed).toBeGreaterThan(0.945)
    // Let go: back at rest once the 320 ms release has run.
    await page.mouse.move(0, 0)
    await expect.poll(() => scaleOf(button), { timeout: 2000 }).toBe(1)
  })

  test('the focus ring grows out of a button reached with the keyboard', async ({ page, open }) => {
    await open('/control')
    await expect(editLayout(page)).toBeVisible()
    let found = false
    for (let i = 0; i < 60 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => !!document.activeElement?.matches('.v-btn, .cbtn'))
    }
    expect(found).toBe(true)
    await page.evaluate(() => document.activeElement!.setAttribute('data-motion-probe', ''))
    const button = page.locator('[data-motion-probe]')
    await expect.poll(async () => (await ringOf(button)).opacity, { timeout: 2000 }).toBe(1)
    // Focus moves on: the ring leaves with it.
    await page.keyboard.press('Tab')
    await expect.poll(async () => (await ringOf(button)).opacity, { timeout: 2000 }).toBe(0)
  })

  test('E-STOP shows its press at once, with nothing easing in', async ({ page, open }) => {
    await open('/')
    const estop = page.getByTestId('estop').locator('visible=true').first()
    await expect(estop).toBeVisible()
    // Pressed: no transform eases in (it has none to ease), and nothing about
    // it is delayed; it stays exactly where it is.
    const transition = await estop.evaluate(e => getComputedStyle(e).transitionProperty)
    expect(transition).not.toMatch(/transform|all/)
    expect(await pressAndRead(page, estop, 60)).toBe(1)
  })

  test('a stop-coloured button does not sink: stopping is never eased', async ({ page, open }) => {
    await open('/control')
    await expect(editLayout(page)).toBeVisible()
    // Any stop-coloured Control button on the page (Cancel, Stop print…), else a stand-in with the same class.
    const danger = page.locator('.cbtn--danger:visible').first()
    const target = await danger.count()
      ? danger
      : await (async () => {
        await page.evaluate(() => {
          const b = document.createElement('button')
          b.className = 'cbtn cbtn--danger'
          b.textContent = 'Stop'
          b.setAttribute('data-motion-probe-stop', '')
        document.querySelector('main')!.prepend(b)
        })
        return page.locator('[data-motion-probe-stop]')
      })()
    expect(await pressAndRead(page, target, 140)).toBe(1)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing scales when the system asks for less motion', async ({ page, open }) => {
    await open('/control')
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('m3d-reduced-motion'))).toBe(true)
    const button = editLayout(page)
    await expect(button).toBeVisible()
    expect(await pressAndRead(page, button, 140)).toBe(1)
  })
})

test('pressing buttons costs no frames: 60 a second where the page runs at 60', async ({ page, open }, info) => {
  await open('/control')
  const button = editLayout(page)
  await expect(button).toBeVisible()
  // The page's own frame rate first (a headless browser on a busy machine may
  // run below 60 everywhere), then the same page while pressing.
  const idle = await frameTimes(page, 1500)
  const times = frameTimes(page, 2000)
  for (let i = 0; i < 6; i++) await pressAndRead(page, button, 120)
  const t = await times
  const result = { idle, pressing: t }
  info.annotations.push({ type: 'frame-times', description: JSON.stringify(result) })
  console.log(`[frame-times] press ${info.project.name}: ${JSON.stringify(result)}`)
  // Pressing costs no more than one extra frame at the 95th percentile.
  expect(t.p95).toBeLessThanOrEqual(Math.max(34, idle.p95 + 17))
})
