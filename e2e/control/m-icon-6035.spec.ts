/**
 * KAN-6035 (Jack, 24 Nov): Control wears the slicer's "M" icon: the tab's
 * favicon, the icon an iPhone or Android puts on the home screen (and the
 * maskable one), and the logo inside the app. Desktop and phone both run it.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'

const TEAL = [0x80, 0xd6, 0xd1]
const DARK = [0x10, 0x17, 0x19]

test.beforeEach(async ({ page }) => {
  await page.goto('/account/appearance')
  await ready(page)
})

/** The decoded size of an icon, and whether it holds the M's teal on the slicer's dark tile. */
async function look (page: Page, href: string) {
  return page.evaluate(async ({ href, teal, dark }) => {
    const blob = await (await fetch(href)).blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const near = (i: number, c: number[]) => Math.abs(data[i] - c[0]) < 24 && Math.abs(data[i + 1] - c[1]) < 24 && Math.abs(data[i + 2] - c[2]) < 24 && data[i + 3] > 200
    let hasTeal = false
    let hasDark = false
    for (let i = 0; i < data.length; i += 4) {
      if (!hasTeal && near(i, teal)) hasTeal = true
      if (!hasDark && near(i, dark)) hasDark = true
      if (hasTeal && hasDark) break
    }
    return { width: bitmap.width, height: bitmap.height, hasTeal, hasDark }
  }, { href, teal: TEAL, dark: DARK })
}

test('the tab icon and the home-screen icon are the slicer M', async ({ page }) => {
  const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll(
    (links: HTMLLinkElement[]) => links.map(l => ({ rel: l.rel, href: l.href, sizes: l.getAttribute('sizes') }))
  )
  expect(icons.length).toBeGreaterThanOrEqual(3)
  for (const icon of icons) {
    const seen = await look(page, icon.href)
    expect(seen.width, icon.href).toBeGreaterThanOrEqual(16)
    expect(seen.hasTeal, `${icon.href} shows the M`).toBe(true)
    if (icon.sizes) expect(`${seen.width}x${seen.height}`, icon.href).toBe(icon.sizes)
  }
  const touch = icons.find(i => i.rel === 'apple-touch-icon')
  expect(touch, 'an apple-touch-icon').toBeTruthy()
  expect((await look(page, touch!.href)).hasDark).toBe(true)
})

test('the install manifest lists the M, plain and maskable, and every file is real', async ({ page }) => {
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()
  const manifest = await (await page.request.get(new URL(href!, page.url()).href)).json()
  const purposes = (manifest.icons as Array<{ purpose?: string }>).map(i => i.purpose ?? 'any')
  expect(purposes).toContain('any')
  expect(purposes).toContain('maskable')
  for (const icon of manifest.icons as Array<{ src: string, sizes: string }>) {
    const seen = await look(page, new URL(icon.src, new URL(href!, page.url())).href)
    expect(`${seen.width}x${seen.height}`, icon.src).toBe(icon.sizes)
    expect(seen.hasTeal, `${icon.src} shows the M`).toBe(true)
    expect(seen.hasDark, `${icon.src} sits on the slicer's tile`).toBe(true)
  }
})

test('the logo inside the app is the slicer M', async ({ page }) => {
  const response = await page.request.get(new URL('/logo_fluidd.svg', page.url()).href)
  expect(response.ok()).toBe(true)
  const svg = await response.text()
  expect(svg).toContain('#80D6D1')
  expect(svg).toContain('M16 44V20h7l9 13 9-13h7v24h-7V32l-9 12-9-12v12z')
})
