/**
 * Settings: a section list, one section's settings beside it (a push on a phone),
 * and Developer mode reachable at the bottom of the list. Layout only: the
 * settings themselves, and what gates them, are as they were.
 */
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const SECTIONS = ['General', 'Wi-Fi and network', 'Cameras', 'Materials', 'Macros', 'Console', 'Files and editor', 'Moving and extruding', 'G-code preview and 3D', 'System']

test('the page has a title, a line saying what it is for and a search', async ({ page, open, isMobile }) => {
  await open('/settings')
  await expect(page.getByTestId('page-title')).toHaveText('Settings')
  if (!isMobile) await expect(page.locator('.app-page-header__subtitle')).toHaveText('How Control looks and behaves on this printer')
  await expect(page.getByRole('searchbox', { name: 'Search settings' })).toBeVisible()
  if (isMobile) await expect(page.getByTestId('settings-pane')).toHaveCount(0)
})

test('the list holds every section, with an icon on each', async ({ page, open }) => {
  await open('/settings')
  const list = page.getByRole('navigation', { name: 'Settings sections' })
  for (const name of SECTIONS) {
    const row = list.getByRole('link', { name: new RegExp(name) })
    await expect(row, name).toBeVisible()
    await expect(row.locator('svg').first(), `${name} icon`).toBeVisible()
  }
})

test('Developer mode sits below the list, not in it, and opens its own page', async ({ page, open, isMobile }) => {
  await open('/settings')
  const list = page.getByRole('navigation', { name: 'Settings sections' })
  await expect(list.getByRole('link', { name: /Developer mode/ })).toHaveCount(0)

  const dev = page.getByRole('navigation', { name: 'Developer mode' }).getByRole('link', { name: /Developer mode/ })
  await expect(dev).toBeVisible()
  await expect(dev).toContainText('For people building on the printer')
  const [listBox, devBox] = [await list.boundingBox(), await dev.boundingBox()]
  expect(devBox!.y).toBeGreaterThan(listBox!.y + listBox!.height - 1)

  await dev.click()
  await expect(page.getByTestId('page-title')).toHaveText('Developer mode')
  await expect(page.getByTestId('settings-pane').getByRole('heading', { name: 'Developer mode' }).first()).toBeVisible()
  if (isMobile) await expect(page.getByTestId('settings-back')).toBeVisible()
})

test('a section opens under its own title and line; on a phone there is a way back', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page)
  await open('/settings')
  await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: /^Cameras/ }).click()
  await expect(page.getByTestId('page-title')).toHaveText('Cameras')
  if (!isMobile) await expect(page.locator('.app-page-header__subtitle')).toHaveText("The printer's cameras and how they stream")
  await expect(page.getByTestId('settings-pane')).toBeVisible()

  if (isMobile) {
    await page.getByTestId('settings-back').click()
    await expect(page.getByTestId('page-title')).toHaveText('Settings')
    await expect(page.getByTestId('settings-pane')).toHaveCount(0)
  } else {
    // The list stays beside it, the open section marked.
    await expect(page.getByTestId('settings-cameras')).toHaveAttribute('aria-current', 'page')
  }
  expect(printer.gcode).toEqual([])
})

test('search narrows the list to what matches and hides the rest, and says when nothing does', async ({ page, open }) => {
  await usePrinter(page, {}, { components: ['authorization', 'update_manager'] })
  await open('/settings')
  const search = page.getByRole('searchbox', { name: 'Search settings' })
  const list = page.getByRole('navigation', { name: 'Settings sections' })
  const row = (name: RegExp) => list.getByRole('link', { name })

  await search.fill('password')
  await expect(row(/People and access/)).toBeVisible()
  await expect(list.getByRole('link')).toHaveCount(1)
  for (const gone of [/^General/, /^Cameras/, /^System/, /^Updates/]) await expect(row(gone)).toHaveCount(0)
  // The hit says why it matched.
  await expect(row(/People and access/)).toContainText('Who can use this printer')

  await search.fill('wifi')
  await expect(list.getByRole('link')).toHaveCount(1)
  await expect(row(/Wi-Fi and network/)).toBeVisible()
  await expect(row(/People and access/)).toHaveCount(0)

  await search.fill('restart')
  await expect(list.getByRole('link')).toHaveCount(1)
  await expect(row(/^System/)).toBeVisible()

  await search.fill('qqqq')
  await expect(page.getByTestId('settings-none')).toHaveText('Nothing matches "qqqq".')
  await expect(list.getByRole('link')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Developer mode' })).toHaveCount(0)

  await search.fill('')
  await expect(row(/^General/)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Developer mode' })).toBeVisible()
})

test('a printer without the access parts has no People and access to find', async ({ page, open }) => {
  await usePrinter(page, {}, { components: ['update_manager'] })
  await open('/settings')
  const list = page.getByRole('navigation', { name: 'Settings sections' })
  await expect(list.getByRole('link', { name: /^General/ })).toBeVisible()
  await expect(list.getByRole('link', { name: /People and access/ })).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Search settings' }).fill('password')
  await expect(page.getByTestId('settings-none')).toBeVisible()
})

test('every section row says what it is for, and the page says its settings are kept on the printer', async ({ page, open }) => {
  await open('/settings')
  const list = page.getByRole('navigation', { name: 'Settings sections' })
  await expect(list.getByRole('link', { name: /^Cameras/ })).toContainText("The printer's cameras and how they stream")
  await expect(list.getByRole('link', { name: /^Materials/ })).toContainText('Filament presets and temperatures')
  await expect(page.getByTestId('settings-kept')).toContainText('same for everyone who opens it')
})

test('an address with an anchor opens that section, named in the title', async ({ page, open, isMobile }) => {
  await usePrinter(page, {}, { components: ['update_manager'] })
  await open('/settings#camera')
  await expect(page.getByTestId('page-title')).toHaveText('Cameras')
  await expect(page.getByTestId('settings-pane')).toBeVisible()
  if (!isMobile) await expect(page.getByTestId('settings-cameras')).toHaveAttribute('aria-current', 'page')

  await open('/settings#versions')
  await expect(page.getByTestId('page-title')).toHaveText('Updates')
  await expect(page.getByTestId('settings-pane')).toBeVisible()
})

test('an anchor for a section the printer lacks is not titled as that section', async ({ page, open }) => {
  await usePrinter(page, {}, { components: [] })
  await open('/settings#versions')
  await expect(page.getByTestId('page-title')).toHaveText('Settings')
  await expect(page.getByTestId('settings-updates')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: /^General/ })).toBeVisible()
})

const PARTS = {
  'no optional parts': [],
  'every optional part': ['authorization', 'update_manager', 'muon_access', 'muon_protection', 'timelapse', 'spoolman']
}
for (const [name, components] of Object.entries(PARTS)) {
  test(`Developer mode shows, as it did before, on a printer with ${name}`, async ({ page, open }) => {
    await usePrinter(page, {}, { components })
    await open('/settings')
    await expect(page.getByRole('navigation', { name: 'Developer mode' }).getByRole('link', { name: /Developer mode/ })).toBeVisible()
  })
}

test('Wi-Fi and System keep their own addresses and open with the list beside them', async ({ page, open, isMobile }) => {
  await open('/wifi')
  await expect(page).toHaveURL(/\/wifi$/)
  await expect(page.getByTestId('settings-pane')).toBeVisible()
  if (!isMobile) await expect(page.getByTestId('settings-network')).toHaveAttribute('aria-current', 'page')
})
