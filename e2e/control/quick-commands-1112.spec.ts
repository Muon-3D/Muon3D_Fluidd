/**
 * Jack's Quick commands notes (12 Nov brief, section F):
 * - OV-29 / KAN-2121: the tile reaches the right edge and the floor; very small
 *   is small icon-only buttons; bigger sizes show more commands.
 * - OV-30 / KAN-2122: the Manage button is named for the Macros page and opens
 *   it; the Macros page has a "Quick commands" section to tick which commands
 *   Overview and Control show, kept across a reload.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { overlay, usePrinter, useDatabase, PRESETS, type PrinterHandle } from './printer'

/** An M1 with a few more commands than the shared mock has, so there is something to choose. */
const EXTRA = ['PURGE_LINE', 'PARK_HEAD', 'LIGHTS_ON', 'LIGHTS_OFF', 'CHECK_FANS', 'COOL_THE_CHAMBER', 'WIPE_NOZZLE', 'PRIME_NOZZLE', 'MEASURE_PLATE', 'TEST_SPEED', 'BEEP']
function withCommands () {
  const settings: Record<string, unknown> = {}
  const objects: Record<string, unknown> = {}
  for (const name of EXTRA) {
    settings[`gcode_macro ${name.toLowerCase()}`] = { gcode: 'M118 hello', description: '' }
    objects[`gcode_macro ${name}`] = {}
  }
  return overlay(PRESETS.idleHomed(), { ...objects, configfile: { settings } })
}

const tile = (page: Page) => page.locator('[data-tile="macros"]')
const chipNames = (page: Page) => tile(page).locator('[data-tid="macro-chip"]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.macro))

/** A saved Overview layout for this page with only Quick commands, at `span` by `rows` (the printer's own saved layouts blanked, so none from another test wins). */
async function onlyQuickCommands (page: Page, printer: PrinterHandle, span: number, rows: number) {
  const db = await useDatabase(page, printer)
  db.saved.uiSettings = { overview: { layouts: null } }
  await page.addInitScript((json: string) => {
    const get = Storage.prototype.getItem
    Storage.prototype.getItem = function (this: Storage, key: string) {
      return key.startsWith('muon.overview.layout.v3') ? json : get.call(this, key)
    }
  }, JSON.stringify({ version: 1, savedAt: 1, tiles: [{ id: 'macros', span, rows }], hidden: [] }))
}

test.describe('OV-29: Quick commands grows with its size', () => {
  for (const [size, span, rows] of [['XS', 3, 1], ['S', 3, 2], ['M', 8, 1], ['L', 12, 1]] as const) {
    test(`${size}`, async ({ page, open, isMobile }) => {
      const printer = await usePrinter(page, withCommands())
      await onlyQuickCommands(page, printer, span, rows)
      await open('/')
      await expect(page.locator('[data-cell="macros"]')).toHaveAttribute('data-size', size)
      const chips = tile(page).locator('[data-tid="macro-chip"]')
      const expected = { XS: 5, S: 3, M: 7, L: 11 }[size]
      await expect(chips).toHaveCount(expected)
      if (size === 'XS') {
        // Icon-only: no names drawn, each still named for a screen reader and on hover.
        await expect(tile(page).locator('.mt__label')).toHaveCount(0)
        for (const chip of await chips.all()) {
          await expect(chip).toHaveAttribute('aria-label', /\S/)
          await expect(chip.locator('svg.frame-icon')).toHaveCount(1)
        }
      } else {
        await expect(tile(page).locator('[data-tid="macro-chip"] .mt__label')).toHaveCount(expected)
      }
      // Edge to edge: the buttons reach the tile's floor and right side, inside its padding.
      const t = (await tile(page).boundingBox())!
      const extent = await tile(page).locator('[data-tid="macro-chips"] > button').evaluateAll(els => ({
        right: Math.max(...els.map(e => e.getBoundingClientRect().right)),
        bottom: Math.max(...els.map(e => e.getBoundingClientRect().bottom))
      }))
      expect(t.x + t.width - extent.right).toBeLessThanOrEqual(isMobile ? 20 : 24)
      expect(t.y + t.height - extent.bottom).toBeLessThanOrEqual(24)
    })
  }

  test('in the default layout it sits under Jog, out to the right edge and down to the Trackpad floor', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone stacks tiles one under another.')
    await usePrinter(page, withCommands())
    await open('/')
    const box = (id: string) => page.locator(`[data-cell="${id}"]`).evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height } })
    const grid = await page.locator('.overview__grid').evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width } })
    const [m, j, t] = [await box('macros'), await box('jog'), await box('trackpad')]
    expect(Math.abs(m.x + m.w - (grid.x + grid.w))).toBeLessThan(2)
    expect(Math.abs(m.x - j.x)).toBeLessThan(2)
    expect(Math.abs(m.y + m.h - (t.y + t.h))).toBeLessThan(2)
  })
})

test.describe('OV-30: Manage is the Macros page, which picks the Quick commands', () => {
  test('the tile menu says "Manage in Macros" and opens the Macros page and its Quick commands section', async ({ page, open }) => {
    await usePrinter(page, withCommands())
    await open('/')
    await tile(page).scrollIntoViewIfNeeded()
    await tile(page).getByTestId('tile-more').click()
    await expect(page.getByRole('menuitem', { name: /quick commands/i })).toHaveCount(0)
    await page.getByRole('menuitem', { name: 'Manage in Macros…' }).click()
    const panel = page.getByTestId('macro-panel')
    await expect(panel.getByRole('heading', { name: 'Macros', exact: true })).toBeVisible()
    await expect(panel.getByTestId('quick-command-picker').getByRole('heading', { name: 'Quick commands' })).toBeVisible()
  })

  test('Control\'s card links to the Macros page too', async ({ page, open }) => {
    await usePrinter(page, withCommands())
    await open('/control')
    await page.getByTestId('quick-manage').click()
    await expect(page.getByTestId('macro-panel').getByRole('heading', { name: 'Macros', exact: true })).toBeVisible()
  })

  test('ticking and unticking changes the Overview tile and Control, and it is kept across a reload', async ({ page, open }) => {
    const printer = await usePrinter(page, withCommands())
    await useDatabase(page, printer)
    await open('/settings#macros')
    const picker = page.getByTestId('quick-command-picker')
    await expect(picker).toBeVisible()
    const box = (name: string) => picker.getByTestId(`quick-pick-${name}`).getByRole('checkbox')

    // Untick one the automatic pick shows (and Control lists); tick one it doesn't.
    const rows = await picker.locator('[data-tid^="quick-pick-"]').evaluateAll(els => els.map(e => ({ name: (e as HTMLElement).dataset.tid!.slice('quick-pick-'.length), on: (e.querySelector('input') as HTMLInputElement).checked })))
    const ON = 'CLEAN_NOZZLE'
    expect(rows.find(r => r.name === ON)?.on).toBe(true)
    const OFF = rows.find(r => !r.on && EXTRA.includes(r.name))?.name
    if (!OFF) throw new Error('every command is already ticked')
    await box(ON).uncheck()
    await box(OFF).check()
    await expect(box(ON)).not.toBeChecked()
    await expect(box(OFF)).toBeChecked()
    await expect.poll(() => printer.called('server.database.post_item').some(p => p.key === 'uiSettings.general.quickCommands')).toBe(true)

    // In-app navigation between the pages (as a person clicks through), then once more after a full reload.
    const go = (path: string) => page.evaluate(to => (document.querySelector('#app') as any).__vue__.$router.push(to).then(() => true, () => true), `${PRINTER}${path}`)
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 1) { await page.reload(); await expect(picker).toBeVisible() }
      await go('/')
      await tile(page).scrollIntoViewIfNeeded()
      await expect.poll(() => chipNames(page)).toContain(OFF)
      expect(await chipNames(page)).not.toContain(ON)
      await go('/control')
      await expect(page.getByTestId(`qc-${OFF}`)).toBeVisible()
      await expect(page.getByTestId(`qc-${ON}`)).toHaveCount(0)
      await go('/settings#macros')
    }
  })

  test('print controls are never offered, and a saved Cancel print does not become a one-tap button', async ({ page, open }) => {
    const printer = await usePrinter(page, withCommands())
    const db = await useDatabase(page, printer)
    db.saved.uiSettings = { general: { quickCommands: ['CANCEL_PRINT', 'CLEAN_NOZZLE'] } }
    await open('/settings#macros')
    const picker = page.getByTestId('quick-command-picker')
    await expect(picker.getByTestId('quick-pick-CLEAN_NOZZLE')).toBeVisible()
    await expect(picker.getByTestId('quick-pick-CANCEL_PRINT')).toHaveCount(0)
    await expect(picker.getByTestId('quick-pick-PAUSE')).toHaveCount(0)
    await page.evaluate(to => (document.querySelector('#app') as any).__vue__.$router.push(to).then(() => true, () => true), `${PRINTER}/`)
    await tile(page).scrollIntoViewIfNeeded()
    await expect.poll(() => chipNames(page)).toEqual(['CLEAN_NOZZLE'])
  })
})
