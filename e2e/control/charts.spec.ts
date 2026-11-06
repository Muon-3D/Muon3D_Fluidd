/**
 * Charts (/<printer>/diagnostics): the user's own charts as D3 tiles under
 * Overview, a shared time range and Add chart in the header. Charts are
 * opt-in, so every test sets the flag (and, where it needs one, the layout)
 * on this page's read of the Fluidd database only, and usePrinter answers the
 * page's database writes itself: the shared mock's database is never changed.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

type Json = Record<string, any>

const metric = (collector: string, name: string, lineColor = '#2196f3') => ({
  collector, name, style: { lineStyle: 'solid', lineColor, fillColor: null, fillOpacity: 0, displayLegend: true }
})

const chart = (id: string, title: string, unit: string, metrics: Json[], extra: Json = {}) => ({
  id, enabled: true, collapsed: false, title, height: 220, icon: '', axes: [{ enabled: true, unit, showLegend: true, metrics }], ...extra
})

/** The page reads the Fluidd database with charts `on`, and these charts (unset: the defaults). */
async function withCharts (page: Page, on: boolean, charts?: Json[]) {
  await page.route(new RegExp(`:${MOCK_PORT}/server/database/item\\?namespace=fluidd`), async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    const response = await route.fetch()
    const json = await response.json()
    const value = json.result.value ?? {}
    value.uiSettings = { ...(value.uiSettings ?? {}), general: { ...(value.uiSettings?.general ?? {}), enableDiagnostics: on } }
    if (charts) value.layout = { layouts: { ...(value.layout?.layouts ?? {}), diagnostics: { container1: charts } } }
    else if (value.layout?.layouts) delete value.layout.layouts.diagnostics
    json.result.value = value
    await route.fulfill({ response, json })
  })
}

/** This page's printer, which keeps the page's database writes to itself. */
async function printerFor (page: Page): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.database.post_item'] = (p: Json) => ({ namespace: p.namespace, key: p.key, value: p.value })
  return printer
}

const writes = (printer: PrinterHandle, key: string) => printer.called('server.database.post_item').filter(p => p.key === key)
const tiles = (page: Page) => page.getByTestId('chart-tile')
const tile = (page: Page, title: string) => page.locator(`[data-tid="chart-tile"][data-chart="${title}"]`)

const SPEED = chart('speed', 'Speed', 'mm/s', [metric('printer.motion_report.live_velocity', 'Velocity')])
const FAN = chart('fan', 'Fans', '%', [metric('100 * printer.fan.speed', 'Part fan', '#34c759')])

test('off: the page says Charts are off and how to turn them on; turning them on saves the setting', async ({ page, open }) => {
  const printer = await printerFor(page)
  await withCharts(page, false)
  await open('/diagnostics')
  await expect(page.getByTestId('page-title')).toHaveText('Charts')
  await expect(page.getByTestId('charts-off')).toContainText('Charts are off on Boxwood')
  await expect(tiles(page)).toHaveCount(0)
  await expect(page.getByTestId('charts-add')).toHaveCount(0)
  await page.getByTestId('charts-turn-on').click()
  await expect.poll(() => writes(printer, 'uiSettings.general.enableDiagnostics').map(p => p.value)).toEqual([true])
  await expect(page.getByTestId('charts-off')).toHaveCount(0)
  await expect(tiles(page).first()).toBeVisible()
})

test('on: the default charts as tiles, the temperatures wide first, each with a live value and a legend', async ({ page, open, isMobile }) => {
  await printerFor(page)
  await withCharts(page, true)
  await open('/diagnostics')
  await expect(page.getByTestId('page-title')).toHaveText('Charts')
  await expect(page.locator('.app-page-header__subtitle')).toHaveText('Live diagnostics for Boxwood · last 10 minutes')
  await expect(page.getByRole('radio', { name: '10 min' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('charts-add')).toBeVisible()
  await expect(tiles(page)).toHaveCount(5)
  expect(await tiles(page).evaluateAll(els => els.map(e => e.getAttribute('data-chart')))).toEqual(['Temperatures', 'MCU load', 'Fans', 'Speed and flow', 'Pressure and load cell'])
  await expect(tile(page, 'Pressure and load cell').getByTestId('chart-legend')).toContainText('Probe force')
  await expect(tile(page, 'Temperatures').getByTestId('chart-legend')).toContainText('Nozzle')
  await expect(tile(page, 'Temperatures').getByTestId('tile-state')).toHaveText(/°C/)
  await expect(tile(page, 'Fans').locator('[data-metric="Part fan"]')).toContainText('%')
  const widths = await tiles(page).evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().width)))
  if (isMobile) {
    expect(new Set(widths).size).toBe(1)
    await expect(page.getByTestId('charts-add-tile')).toHaveCount(0)
  } else {
    expect(widths[0]).toBeGreaterThan(widths[1] * 1.8)
    await expect(page.getByTestId('charts-add-tile')).toBeVisible()
  }
  // Charts are an Overview page: the sidebar (or tab bar) stays on Overview.
  await expect(page.locator('.app-page-header__tab--on')).toHaveText('Charts')
})

test('the value pill and legend follow what the printer reports', async ({ page, open }) => {
  const printer = await printerFor(page)
  await withCharts(page, true, [SPEED])
  await open('/diagnostics')
  await expect(tile(page, 'Speed')).toBeVisible()
  printer.report({ ...PRESETS.idleHomed(), motion_report: { live_velocity: 123.4, live_position: [0, 0, 0, 0] } })
  await expect(tile(page, 'Speed').locator('[data-metric="Velocity"]')).toContainText('123.4 mm/s')
  await expect(tile(page, 'Speed').getByTestId('tile-state')).toHaveText('123.4 mm/s')
  printer.report({ ...PRESETS.idleHomed(), motion_report: { live_velocity: 56.7, live_position: [0, 0, 0, 0] } })
  await expect(tile(page, 'Speed').getByTestId('tile-state')).toHaveText('56.7 mm/s')
})

test('the shared range: 1 h is off when the printer keeps less, and the pick names the header', async ({ page, open }) => {
  await printerFor(page)
  await withCharts(page, true, [SPEED])
  await open('/diagnostics')
  await expect(page.getByRole('radio', { name: '1 h' })).toBeDisabled()
  await page.getByRole('radio', { name: '1 min' }).click()
  await expect(page.locator('.app-page-header__subtitle')).toHaveText('Live diagnostics for Boxwood · last minute')
  await page.reload()
  await expect(page.getByRole('radio', { name: '1 min' })).toHaveAttribute('aria-checked', 'true')
})

test('a tile\'s menu moves, sizes, hides and removes it, and each change is saved', async ({ page, open, isMobile }) => {
  const printer = await printerFor(page)
  await withCharts(page, true, [SPEED, FAN])
  await open('/diagnostics')
  const saved = () => writes(printer, 'layout.layouts').map(p => (p.value.diagnostics.container1 as Json[]).map(c => `${c.id}${c.enabled ? '' : '-hidden'}${c.span ? `@${c.span}` : ''}`))
  const choose = async (title: string, item: string) => {
    await tile(page, title).getByRole('button', { name: `More for ${title}` }).click()
    await page.getByRole('menuitem', { name: item }).click()
  }
  await choose('Fans', 'Move earlier')
  await expect.poll(saved).toEqual([['fan', 'speed']])
  await expect(tiles(page).first()).toHaveAttribute('data-chart', 'Fans')
  if (!isMobile) {
    await choose('Speed', 'Make wider')
    await expect.poll(() => saved().at(-1)).toEqual(['fan', 'speed@6'])
    await expect(tile(page, 'Speed')).toHaveAttribute('data-span', '6')
  }
  await choose('Speed', 'Hide')
  await expect(tile(page, 'Speed')).toHaveCount(0)
  await expect(page.getByTestId('charts-hidden')).toContainText('Speed')
  await page.locator('[data-show="Speed"]').click()
  await expect(tile(page, 'Speed')).toBeVisible()
  await choose('Fans', 'Remove…')
  await page.getByTestId('confirm-ok').click()
  await expect(tile(page, 'Fans')).toHaveCount(0)
  await expect.poll(() => saved().at(-1)?.map(s => s.replace(/@\d+/, ''))).toEqual(['speed'])
})

test('Add chart opens the chart editor', async ({ page, open }) => {
  await printerFor(page)
  await withCharts(page, true, [SPEED])
  await open('/diagnostics')
  await page.getByTestId('charts-add').click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('no charts: the page says so, with Add chart', async ({ page, open }) => {
  await printerFor(page)
  await withCharts(page, true, [])
  await open('/diagnostics')
  await expect(page.getByTestId('charts-empty')).toContainText('No charts yet')
  await expect(tiles(page)).toHaveCount(0)
  await page.getByTestId('charts-empty-add').click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('a line that cannot be read: its tile says which and why, and the others carry on', async ({ page, open }) => {
  await printerFor(page)
  await withCharts(page, true, [chart('broken', 'Load cell', 'g', [metric('printer.load_cell.force.value', 'Force')]), SPEED])
  await open('/diagnostics')
  await expect(tile(page, 'Load cell').getByTestId('chart-error')).toContainText('Can\'t read Force:')
  await expect(tile(page, 'Load cell').getByTestId('tile-state')).toHaveText('Error')
  await expect(tile(page, 'Speed').getByTestId('chart-error')).toHaveCount(0)
})

test('Klipper not ready: the charts say nothing new is drawn', async ({ page, open }) => {
  const printer = await printerFor(page)
  printer.state.results['server.info'] = { klippy_state: 'shutdown' }
  await withCharts(page, true, [SPEED])
  await open('/diagnostics')
  await expect(page.getByTestId('charts-offline')).toContainText('Klipper isn\'t ready on Boxwood')
  await expect(tile(page, 'Speed').getByTestId('tile-state')).toHaveText('Paused')
})

test('offline: the charts stop at the last reading and say so', async ({ page, open }) => {
  const printer = await printerFor(page)
  await withCharts(page, true, [SPEED])
  await open('/diagnostics')
  await expect(page.getByTestId('charts-offline')).toHaveCount(0)
  printer.goOffline()
  await expect(page.getByTestId('charts-offline')).toContainText('Boxwood is offline')
})
