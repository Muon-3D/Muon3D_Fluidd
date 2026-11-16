/**
 * KAN-1952 (Jack, 10 Nov): people see "Quick commands", never "Macro".
 * Overview and Control must show no "macro" anywhere: text, tooltips,
 * placeholders or labels. Jack's later note (KAN-2122, 11 Nov) wins for one
 * place: the management page is called Macros, and the links to it say so.
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
    // The one exception (KAN-2122): the link to the Macros page, named for it.
    const words = (await visibleMacroWords(page)).filter(w => w !== 'Manage in Macros' && !/on the Macros page"?$/.test(w))
    expect(words).toEqual([])
    await expect(page.getByText('Quick commands').first()).toBeVisible()
  })
}

test('Settings: the management page is "Macros" (KAN-2122), with its "Quick commands" section; nothing else says macro', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/settings#macros')
  const panel = page.getByTestId('macro-panel')
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Macros', exact: true })).toBeVisible()
  await expect(panel.getByTestId('quick-command-picker').getByRole('heading', { name: 'Quick commands' })).toBeVisible()
  // The only "macro" words are the page's own name: its heading, its line, and the Settings list entry for it.
  const words = await visibleMacroWords(page)
  expect(words.filter(w => !/^Macros$/.test(w))).toEqual([])
})

test('Control and Overview link to the Macros page by its name, and say "Quick commands" for the feature', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/control')
  await expect(page.getByTestId('control-quick').getByRole('heading', { name: 'Quick commands' }).or(page.getByTestId('control-quick').getByText('Quick commands').first())).toBeVisible()
  await expect(page.getByTestId('quick-manage')).toHaveText('Manage in Macros')
})
