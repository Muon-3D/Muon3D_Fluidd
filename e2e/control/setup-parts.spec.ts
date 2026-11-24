/**
 * The pop-up for an action that needs parts (KAN-6012).
 *
 * The printer says, in `m1_machine.missing`, what each action still needs. When
 * Home is pressed and a part is missing (toolhead, spine, lever or plate), a
 * pop-up shows the setup animation for the first one, its words, and a checklist
 * of all of them. It follows the printer as parts are fitted, and when none is
 * missing it closes and Home goes ahead. The printer's answers are faked per test.
 * Object shape: Muon3D_Klipper (klippy/extras/m1_machine.py).
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

type Step = 'toolhead' | 'spine' | 'lever' | 'plate'

const CODE: Record<Step, string> = {
  toolhead: 'toolhead_disconnected',
  spine: 'column_absent',
  lever: 'column_unlocked',
  plate: 'plate_absent'
}

const WORDS: Record<Step, { title: string, hint: string }> = {
  toolhead: { title: 'Toolhead disconnected', hint: 'Plug the toolhead in at both ends' },
  spine: { title: 'Fit the spine', hint: 'Stand it up, slide it down, wiggle to seat' },
  lever: { title: 'Push the lever down', hint: 'It locks the spine' },
  plate: { title: 'Put the plate on', hint: 'Hook the back, lower it, press flat' }
}

const ORDER: Step[] = ['toolhead', 'spine', 'lever', 'plate']

/** Home needs the toolhead and the spine; Home Z also the lever and the plate (audit 4.3). */
const machine = (parts: Step[]) => {
  const codes = (steps: Step[]) => parts.filter(p => steps.includes(p)).map(p => CODE[p])
  return {
    m1_machine: {
      activity: 'idle',
      conditions: { plate_cleared: true },
      missing: {
        print: codes(ORDER),
        resume: codes(ORDER),
        home_z: codes(ORDER),
        home_xy: codes(['toolhead', 'spine'])
      },
      ready: {},
      faults: [],
      pause_reason: null,
      gate: null
    }
  }
}

async function start (page: Page, parts: Step[]) {
  const status = { ...PRESETS.idleHomed(), ...machine(parts) }
  const printer = await usePrinter(page, status, { ticks: false })
  return { printer, status }
}

const popup = (page: Page) => page.getByTestId('setup-parts')
const canvas = (page: Page) => page.getByTestId('setup-parts-canvas')
const items = (page: Page) => page.locator('[data-tid^="setup-parts-item-"]')

/** How many pixels of the canvas differ from its corner (the surface): zero means nothing was drawn. */
const drawn = (page: Page) => canvas(page).evaluate((el: HTMLCanvasElement) => {
  const ctx = el.getContext('2d')!
  const { data } = ctx.getImageData(0, 0, el.width, el.height)
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) n++
  }
  return n
})

const homeAll = async (page: Page) => { await page.getByTestId('home-all').click() }

async function expectStep (page: Page, step: Step, listed: Step[]) {
  await expect(popup(page)).toBeVisible()
  await expect(canvas(page)).toHaveAttribute('data-step', step)
  await expect(page.getByTestId('setup-parts-title')).toHaveText(WORDS[step].title)
  await expect(page.getByTestId('setup-parts-hint')).toHaveText(WORDS[step].hint)
  await expect(items(page)).toHaveCount(listed.length)
  for (const s of listed) await expect(page.getByTestId(`setup-parts-item-${s}`)).toHaveText(WORDS[s].title)
}

for (const step of ORDER) {
  test.describe(`a missing ${step}`, () => {
    test('Home opens the pop-up with this step and its checklist, and sends nothing', async ({ page, open }) => {
      const { printer } = await start(page, [step])
      await open('/control')
      await homeAll(page)
      await expectStep(page, step, [step])
      expect(printer.gcode).toEqual([])
    })

    test('fitting the part closes the pop-up and Home goes ahead', async ({ page, open }) => {
      const { printer, status } = await start(page, [step])
      await open('/control')
      await homeAll(page)
      await expectStep(page, step, [step])
      printer.report({ ...status, ...machine([]) })
      await expect(popup(page)).toBeHidden()
      await expect.poll(() => printer.gcode).toEqual(['G28'])
    })
  })
}

test('with every part missing the toolhead shows first, the checklist lists all four, and each fitted part moves it on', async ({ page, open }) => {
  const { printer, status } = await start(page, ORDER)
  await open('/control')
  await homeAll(page)
  await expectStep(page, 'toolhead', ORDER)
  let left = [...ORDER]
  for (const fitted of ['toolhead', 'spine', 'lever'] as Step[]) {
    left = left.filter(s => s !== fitted)
    printer.report({ ...status, ...machine(left) })
    await expectStep(page, left[0], left)
    expect(printer.gcode).toEqual([])
  }
  printer.report({ ...status, ...machine([]) })
  await expect(popup(page)).toBeHidden()
  await expect.poll(() => printer.gcode).toEqual(['G28'])
})

test('parts that are not a setup step (filament, bed power) never open the pop-up', async ({ page, open }) => {
  const status = { ...PRESETS.idleHomed(), m1_machine: { ...machine([]).m1_machine, missing: { home_z: ['filament_absent', 'bed_power_fault', 'column_reading'], home_xy: [] } } }
  const printer = await usePrinter(page, status, { ticks: false })
  await open('/control')
  await homeAll(page)
  await expect.poll(() => printer.gcode).toEqual(['G28'])
  await expect(popup(page)).toHaveCount(0)
})

test('negative control: nothing missing, Home goes straight to the printer', async ({ page, open }) => {
  const { printer } = await start(page, [])
  await open('/control')
  await homeAll(page)
  await expect.poll(() => printer.gcode).toEqual(['G28'])
  await expect(popup(page)).toHaveCount(0)
})

test('a print the printer is holding for a part opens the pop-up by itself, and it closes when the part is fitted', async ({ page, open }) => {
  const { printer, status } = await start(page, [])
  await open('/control')
  await expect(popup(page)).toHaveCount(0)
  const held = (parts: Step[]) => ({ ...status, m1_machine: { ...machine(parts).m1_machine, activity: 'waiting', gate: { action: 'print', missing: parts.map(p => CODE[p]), since: 100 } } })
  printer.report(held(['lever', 'plate']))
  await expectStep(page, 'lever', ['lever', 'plate'])
  printer.report(held(['plate']))
  await expectStep(page, 'plate', ['plate'])
  printer.report({ ...status, ...machine([]) })
  await expect(popup(page)).toBeHidden()
})

test('closing the pop-up sends nothing, and fitting the part afterwards does not run Home', async ({ page, open }) => {
  const { printer, status } = await start(page, ['spine'])
  await open('/control')
  await homeAll(page)
  await expectStep(page, 'spine', ['spine'])
  await page.getByTestId('m3-dlg-close').click()
  await expect(popup(page)).toBeHidden()
  printer.report({ ...status, ...machine([]) })
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('the picture is drawn, and it moves', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await start(page, ['toolhead'])
  await open('/control')
  await homeAll(page)
  await expect(canvas(page)).toHaveAttribute('data-running', 'true')
  await expect.poll(() => drawn(page)).toBeGreaterThan(200)
  const first = await canvas(page).evaluate((el: HTMLCanvasElement) => el.toDataURL())
  await expect.poll(() => canvas(page).evaluate((el: HTMLCanvasElement) => el.toDataURL()), { timeout: 4000 }).not.toBe(first)
})

test('reduced motion: one still frame, drawn once, and the loop never runs', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await start(page, ['plate'])
  await open('/control')
  await homeAll(page)
  await expectStep(page, 'plate', ['plate'])
  await expect.poll(() => drawn(page)).toBeGreaterThan(200)
  await expect(canvas(page)).toHaveAttribute('data-running', 'false')
  const first = await canvas(page).evaluate((el: HTMLCanvasElement) => el.toDataURL())
  await page.waitForTimeout(1200)
  expect(await canvas(page).evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(first)
})

test('the frame loop stops when the pop-up closes', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const { printer, status } = await start(page, ['lever'])
  await open('/control')
  await homeAll(page)
  await expect(canvas(page)).toHaveAttribute('data-running', 'true')
  printer.report({ ...status, ...machine([]) })
  await expect(popup(page)).toBeHidden()
  await expect(canvas(page)).toHaveAttribute('data-running', 'false')
})

for (const scheme of ['dark', 'light'] as const) {
  test(`${scheme}: the picture sits on the pop-up's own surface`, async ({ page, open }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    await start(page, ['spine'])
    await open('/control')
    await homeAll(page)
    await expectStep(page, 'spine', ['spine'])
    await expect.poll(() => drawn(page)).toBeGreaterThan(200)
    const corner = await canvas(page).evaluate((el: HTMLCanvasElement) => Array.from(el.getContext('2d')!.getImageData(2, 2, 1, 1).data.slice(0, 3)))
    const surface = await page.locator('.m3-dlg').evaluate(el => getComputedStyle(el).backgroundColor)
    expect(`rgb(${corner.join(', ')})`).toBe(surface)
  })
}
