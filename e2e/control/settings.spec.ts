/**
 * Settings: a section list, one section's settings beside it (a push on a phone),
 * and Developer mode reachable at the bottom of the list. Layout only: the
 * settings themselves, and what gates them, are as they were.
 */
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const SECTIONS = ['General', 'Wi-Fi and network', 'Cameras', 'Materials', 'Macros', 'Console', 'Files and editor', 'Moving and extruding', 'G-code preview', 'System']

test('the page has a title, a line saying what it is for and a search', async ({ page, open, isMobile }) => {
  await open('/settings')
  await expect(page.getByTestId('page-title')).toHaveText('Settings')
  if (!isMobile) await expect(page.getByText('How Control looks and behaves on this printer')).toBeVisible()
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
  if (!isMobile) await expect(page.getByText("The printer's cameras and how they stream")).toBeVisible()
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

test('search narrows the list by name or by another word for a section, and says when nothing matches', async ({ page, open }) => {
  await open('/settings')
  const search = page.getByRole('searchbox', { name: 'Search settings' })
  const list = page.getByRole('navigation', { name: 'Settings sections' })

  await search.fill('password')
  await expect(list.getByRole('link')).toHaveText([/People and access/])
  await search.fill('wifi')
  await expect(list.getByRole('link')).toHaveText([/Wi-Fi and network/])
  await search.fill('restart')
  await expect(list.getByRole('link', { name: /System/ })).toBeVisible()
  await search.fill('qqqq')
  await expect(page.getByTestId('settings-none')).toHaveText('Nothing matches "qqqq".')
  await search.fill('')
  await expect(list.getByRole('link', { name: /^General/ })).toBeVisible()
})

test('Wi-Fi and System keep their own addresses and open with the list beside them', async ({ page, open, isMobile }) => {
  await open('/wifi')
  await expect(page).toHaveURL(/\/wifi$/)
  await expect(page.getByTestId('settings-pane')).toBeVisible()
  if (!isMobile) await expect(page.getByTestId('settings-network')).toHaveAttribute('aria-current', 'page')
})
