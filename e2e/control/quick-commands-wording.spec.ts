/**
 * KAN-1952 (Jack, 10 Nov): people see "Quick commands", never "Macro".
 * Overview, Control and Settings (with its Quick commands page open) must
 * show no "macro" anywhere: text, tooltips, placeholders or labels.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const MACRO = /\bmacros?\b/i

async function visibleMacroWords (page: Page): Promise<string[]> {
  return page.evaluate((src) => {
    const re = new RegExp(src, 'i')
    const out: string[] = []
    const shown = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect?.()
      const s = getComputedStyle(el as HTMLElement)
      return !!r && (r.width > 0 || r.height > 0) && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent ?? ''
      if (re.test(text) && n.parentElement && shown(n.parentElement)) out.push(text.trim())
    }
    for (const el of Array.from(document.querySelectorAll('[title], [placeholder], [aria-label]'))) {
      if (!shown(el)) continue
      for (const a of ['title', 'placeholder', 'aria-label']) {
        const v = el.getAttribute(a)
        if (v && re.test(v)) out.push(`${a}="${v}"`)
      }
    }
    return out
  }, MACRO.source)
}

for (const path of ['/', '/control']) {
  test(`${path} never says "macro"`, async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open(path)
    await page.waitForTimeout(1500)
    expect(await visibleMacroWords(page)).toEqual([])
    await expect(page.getByText('Quick commands').first()).toBeVisible()
  })
}

test('Settings never says "macro", on its Quick commands page too', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/settings')
  await page.waitForTimeout(1000)
  expect(await visibleMacroWords(page)).toEqual([])
  await open('/settings#macros')
  await expect(page.getByTestId('macro-panel')).toBeVisible()
  await page.waitForTimeout(500)
  expect(await visibleMacroWords(page)).toEqual([])
  await expect(page.getByTestId('macro-panel').getByRole('heading', { name: 'Quick commands' })).toBeVisible()
})
