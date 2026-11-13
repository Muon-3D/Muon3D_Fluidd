/**
 * Loading in the glass look (KAN-2257, plan B; Jack: "very glitchy when
 * loading"). What a person sees while Control starts is the same background,
 * text colour and typeface as the page it hands over to, so nothing flips
 * colour or font as it loads, and the bar grows without relaying out.
 */
import { test, expect, ready } from '../fixtures'
import { PRINTER } from '../fixtures'
import type { Page } from '@playwright/test'

const loaderLook = (page: Page) => page.locator('#muon-loader').evaluate(el => {
  const s = getComputedStyle(el)
  const fill = el.querySelector('.muon-loader__fill') as HTMLElement
  const bar = el.querySelector('.muon-loader__bar') as HTMLElement
  return {
    background: s.backgroundColor,
    color: s.color,
    font: s.fontFamily.split(',')[0].trim(),
    fillWidth: fill.getBoundingClientRect().width,
    fillLayoutWidth: fill.offsetWidth,
    barWidth: bar.offsetWidth,
    fillTransition: getComputedStyle(fill).transitionProperty
  }
})

const appLook = (page: Page) => page.evaluate(() => {
  const body = getComputedStyle(document.body)
  const app = getComputedStyle(document.querySelector('.v-application') as Element)
  return { background: body.backgroundColor, color: app.color, font: app.fontFamily.split(',')[0].trim() }
})

// Hold the app's entry script back so the loader can be looked at.
async function holdEntry (page: Page) {
  let release: () => void = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route(/\/src\/main\.ts|\/assets\/index-[^/]*\.js/, async route => {
    await held
    await route.continue()
  })
  return release
}

test('the loader is the glass page the app becomes: same background, text and typeface', async ({ page }) => {
  const release = await holdEntry(page)
  await page.goto(`${PRINTER}/`, { waitUntil: 'commit' })
  await expect(page.locator('#muon-loader')).toBeVisible()
  const loading = await loaderLook(page)
  release()
  await ready(page)
  const app = await appLook(page)
  expect(loading.background).toBe(app.background)
  expect(loading.color).toBe(app.color)
  expect(loading.font).toBe(app.font)
  // Glass dark: black, not the retired #13171a.
  expect(loading.background).toBe('rgb(0, 0, 0)')
})

test('in light mode the loader is glass light from the first frame', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('muon3d.theme', 'light') } catch {} })
  const release = await holdEntry(page)
  await page.goto(`${PRINTER}/`, { waitUntil: 'commit' })
  await expect(page.locator('#muon-loader')).toBeVisible()
  const loading = await loaderLook(page)
  release()
  expect(loading.background).toBe('rgb(242, 242, 247)')
  expect(loading.color).toBe('rgb(29, 29, 31)')
})

test('the loading bar grows by transform: its box stays full width while it fills', async ({ page }) => {
  const release = await holdEntry(page)
  await page.goto(`${PRINTER}/`, { waitUntil: 'commit' })
  await page.locator('#muon-loader').evaluate(el => (el as HTMLElement).style.setProperty('--muon-loader-progress', '0.4'))
  await page.waitForTimeout(400)
  const look = await loaderLook(page)
  release()
  expect(look.fillLayoutWidth).toBe(look.barWidth)
  expect(look.fillWidth).toBeGreaterThan(look.barWidth * 0.35)
  expect(look.fillWidth).toBeLessThan(look.barWidth * 0.45)
  expect(look.fillTransition).not.toMatch(/width|all/)
})
