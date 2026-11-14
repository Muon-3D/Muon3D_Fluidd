/**
 * Accessibility evidence for the Library (App Store checklist, section 8):
 * axe on four views (no serious or critical findings), a keyboard walk-through
 * of Discover (reach, open, close, focus return, focus on a new page, visible
 * focus), and reduced motion (nothing animates when the system asks).
 *
 * Kept to three tests on purpose: the e2e shards are at their time limit, so
 * each test reuses one page load for as much as it can.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { ownItem } from '../fakes/models'
import type { ModelServiceState } from '../fakes/models'

test.use({ signedIn: true })

const root = (page: Page) => page.getByTestId('muon-library')
const look = (page: Page) => page.getByTestId('library-quick-look')
const popular = (page: Page) => page.getByTestId('library-shelf-popular')

/** Every Library region has finished loading: none still says aria-busy="true". */
async function settled (page: Page) {
  await expect(root(page).locator('[aria-busy="true"]')).toHaveCount(0)
}

/**
 * axe on the Library root. serious and critical findings fail the test, and
 * the message names each rule and the elements it found, so a red run says
 * what to fix without opening a trace.
 */
async function expectNoSeriousViolations (page: Page, view: string) {
  const { violations } = await new AxeBuilder({ page })
    .include('[data-tid="muon-library"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const serious = violations
    .filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${view}: ${v.id} (${v.impact}) ${v.help}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)
  expect(serious, `axe found serious or critical problems:\n${serious.join('\n')}`).toEqual([])
}

/** Yours with something on every shelf the fake can fill, and a public collection to open. */
function stock (models: ModelServiceState) {
  models.items.push(ownItem('a', { name: 'Hex planter' }))
  for (const n of [0, 1]) models.saves.push({ id: `save-${n + 1}`, target: models.publications[n].id })
  models.collections.push({ id: 'col-1', name: 'Workshop', items: ['save-1', 'save-2'] })
  models.others.push({ id: 'other-1', name: 'Maker picks', items: [models.publications[0].id, models.publications[1].id], visibility: 'public' })
}

test('axe finds nothing serious on Discover, Yours, a model page and a public collection', async ({ page, models, open }) => {
  stock(models)
  // Reduced motion keeps pictures and skeletons from fading while axe reads colours,
  // which would otherwise make the contrast rule flaky.
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await open('/library?view=discover')
  await expect(popular(page).getByRole('button', { name: /^Quick look at/ }).first()).toBeVisible()
  await settled(page)
  await expectNoSeriousViolations(page, 'Discover')

  await page.getByTestId('library-view-mine').click()
  await expect(page.getByTestId('library-shelf-sliced')).toContainText('Hex planter')
  await expect(page.getByTestId('library-collection-col-1')).toBeVisible()
  await settled(page)
  await expectNoSeriousViolations(page, 'Yours')

  await page.getByTestId('library-view-discover').click()
  await popular(page).getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  await look(page).getByTestId('library-quick-look-page').click()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
  await expect(page.getByTestId('library-print-profile')).toBeVisible()
  await settled(page)
  await expectNoSeriousViolations(page, 'Model page')

  await open('/library?view=mine&collection=other-1')
  await expect(page.getByTestId('library-collection-title')).toHaveText('Maker picks')
  await expect(page.getByTestId('library-collection-cards').locator('.mcard__title')).toHaveText(['Print 1', 'Print 2'])
  await settled(page)
  await expectNoSeriousViolations(page, 'Public collection')
})

interface Stop {
  name: string;
  tid: string | null;
  inPopular: boolean;
  marked: boolean;
}

/** The focused element, and whether it shows a focus indicator (an outline, or a box-shadow). */
const focused = (page: Page): Promise<Stop | null> => page.evaluate(() => {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return null
  const ring = (e: Element) => {
    const s = getComputedStyle(e)
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && s.outlineColor !== 'rgba(0, 0, 0, 0)'
    return outline || s.boxShadow !== 'none'
  }
  // A search box draws its ring on the label around it (:focus-within).
  const wrap = el.tagName === 'INPUT' ? el.closest('label') : null
  return {
    name: el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 40) || el.tagName,
    tid: el.getAttribute('data-tid'),
    inPopular: !!el.closest('[data-tid="library-shelf-popular"]'),
    marked: ring(el) || (!!wrap && ring(wrap))
  }
})

test('keyboard: Tab reaches search, a card and its actions; Enter opens, Escape closes and returns focus; a page takes focus', async ({ page, open }) => {
  await open('/library?view=discover')
  const pic = popular(page).getByRole('button', { name: /^Quick look at/ }).first()
  await expect(pic).toBeVisible()
  await settled(page)

  // From the start of the page, in tab order, until the first Popular card's Save.
  const stops: Stop[] = []
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab')
    const stop = await focused(page)
    if (!stop) continue
    stops.push(stop)
    if (stop.inPopular && stop.tid === 'library-card-save') break
  }
  const names = stops.map(s => s.name)
  const save = stops.length - 1
  expect(stops[save]?.tid, `Tab never reached a Popular card's Save. Stops: ${names.join(' > ')}`).toBe('library-card-save')
  const search = names.indexOf('Search Discover')
  const card = stops.findIndex(s => s.inPopular && s.name.startsWith('Quick look at'))
  expect(search, `Tab never reached the search box. Stops: ${names.join(' > ')}`).toBeGreaterThanOrEqual(0)
  expect(card, `Search comes before the first Popular card. Stops: ${names.join(' > ')}`).toBeGreaterThan(search)
  expect(stops[card + 1]?.tid, 'the card is followed by its Print').toBe('library-card-print')
  expect(save, 'then its Save').toBe(card + 2)
  // Every stop on the way showed where focus was.
  expect(stops.filter(s => !s.marked).map(s => s.name), 'focused elements with no outline or box-shadow').toEqual([])

  // Enter opens the quick look; Escape closes it and focus goes back to the card.
  await pic.focus()
  await page.keyboard.press('Enter')
  await expect(look(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(look(page)).toHaveCount(0)
  await expect(pic).toBeFocused()

  // A model page takes focus to its heading.
  await page.keyboard.press('Enter')
  await expect(look(page)).toBeVisible()
  await look(page).getByTestId('library-quick-look-page').click()
  const heading = page.getByTestId('library-print-title')
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
})

test('reduced motion: nothing in the Library keeps animating when the system asks, with the quick look and Print on… open', async ({ page, account, open }) => {
  account.printers.push({ id: 'p-walnut', name: 'Walnut', model: 'Muon3D M1', state: 'online', version: '1', linked_at: 0, last_seen: 0, online: true, online_since: null } as never)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open('/library?view=discover')
  await expect(popular(page).getByRole('button', { name: /^Quick look at/ }).first()).toBeVisible()

  // The Library, its quick look and its Print on… dialog (the last two mount outside the root).
  const running = () => page.evaluate(() => document.getAnimations()
    .filter(a => {
      const target = (a.effect as KeyframeEffect | null)?.target as Element | null | undefined
      return !!target?.closest('[data-tid="muon-library"], .mlook, .m3-dlg-frame') && a.playState === 'running'
    })
    .map(a => {
      const target = (a.effect as KeyframeEffect).target as Element
      const what = a instanceof CSSAnimation ? a.animationName : a instanceof CSSTransition ? a.transitionProperty : a.id
      return `${what} on ${target.tagName.toLowerCase()}.${String(target.className)}`
    }))

  // Empty, or finished within a moment (a dialog may still end a fast fade).
  await expect.poll(running, { message: 'animations running in the Library page' }).toEqual([])
  await popular(page).getByRole('button', { name: /^Quick look at/ }).first().click()
  await expect(look(page)).toBeVisible()
  await expect.poll(running, { message: 'animations running with the quick look open' }).toEqual([])
  await page.keyboard.press('Escape')
  await expect(look(page)).toHaveCount(0)

  await popular(page).getByRole('button', { name: /^Print .* on Boxwood$/ }).first().click()
  await expect(page.getByTestId('print-on')).toBeVisible()
  await expect.poll(running, { message: 'animations running with Print on… open' }).toEqual([])
})
