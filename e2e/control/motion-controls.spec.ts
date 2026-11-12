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
    await open('/settings')
    const button = page.locator('.v-main .v-btn:not(.v-btn--disabled)').filter({ hasText: /\S/ }).first()
    await expect(button).toBeVisible()
    expect(await scaleOf(button)).toBe(1)
    // Pressed: at 0.96 within about one instant (80 ms) plus a frame or two.
    const pressed = await pressAndRead(page, button, 140)
    expect(pressed).toBeLessThan(0.975)
    expect(pressed).toBeGreaterThan(0.95)
    // Let go: back at rest once the snappy spring (303 ms) has run.
    await page.mouse.move(0, 0)
    await expect.poll(() => scaleOf(button), { timeout: 2000 }).toBe(1)
  })

  test('the focus ring grows out of a button reached with the keyboard', async ({ page, open }) => {
    await open('/settings')
    await page.locator('.v-main').click({ position: { x: 2, y: 2 } })
    let found = false
    for (let i = 0; i < 60 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => !!document.activeElement?.matches('.v-btn'))
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
    const estop = page.getByRole('button', { name: /e-?stop|emergency stop/i }).first()
    await expect(estop).toBeVisible()
    const transition = await estop.evaluate(e => getComputedStyle(e).transitionProperty)
    expect(transition).not.toMatch(/transform|all/)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing scales when the system asks for less motion', async ({ page, open }) => {
    await open('/settings')
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('m3d-reduced-motion'))).toBe(true)
    const button = page.locator('.v-main .v-btn:not(.v-btn--disabled)').filter({ hasText: /\S/ }).first()
    expect(await pressAndRead(page, button, 140)).toBe(1)
  })
})

test('pressing buttons keeps 60 frames a second', async ({ page, open }, info) => {
  await open('/settings')
  const button = page.locator('.v-main .v-btn:not(.v-btn--disabled)').filter({ hasText: /\S/ }).first()
  const times = frameTimes(page, 2000)
  for (let i = 0; i < 6; i++) await pressAndRead(page, button, 120)
  const t = await times
  info.annotations.push({ type: 'frame-times', description: JSON.stringify(t) })
  console.log(`[frame-times] press ${info.project.name}: ${JSON.stringify(t)}`)
  expect(t.p95).toBeLessThan(34)
})
