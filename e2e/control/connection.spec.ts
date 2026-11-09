/**
 * The connection itself: a printer that answers on its address but won't take
 * the socket (KAN-1461), and a socket that drops and comes back.
 * usePrinter's offline() refuses the page's socket until online().
 */
import { test, expect, ready } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test.describe("a printer that won't take the socket", () => {
  test('All printers and its page say they can\'t reach it and why, and Try again connects', async ({ page }) => {
    const printer = await usePrinter(page)
    await printer.offline()
    await page.goto('/')
    await ready(page)
    // Its tile says why too, rather than "Connecting…" for good, and opens it.
    const tile = page.getByRole('button', { name: /^Boxwood Unreachable Can't reach it: it didn't accept the connection/ })
    await expect(tile).toBeVisible({ timeout: 15_000 })
    await tile.click()
    await expect(page).toHaveURL(/\/boxwood-367a/)

    const unreachable = page.getByTestId('connection-unreachable')
    await expect(unreachable).toBeVisible({ timeout: 15_000 })
    await expect(unreachable.getByRole('heading', { level: 1 })).toHaveText("Can't reach Boxwood: it didn't accept the connection")
    await expect(unreachable.getByRole('progressbar')).toHaveCount(0)
    await expect(unreachable.getByTestId('connection-help')).toBeVisible()

    // Still refused: Try again shows it trying, then says so again.
    await unreachable.getByTestId('connection-try-again').click()
    await expect(page.getByTestId('connection-unreachable')).toBeVisible({ timeout: 10_000 })
    expect(printer.called('server.info')).toHaveLength(0)

    printer.online()
    await page.getByTestId('connection-try-again').click()
    await expect(page.getByTestId('connection-unreachable')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('connection-connecting')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    await expect.poll(() => printer.called('server.info').length).toBeGreaterThan(0)
  })

  test('opened at its address, the same: no endless Connecting', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await printer.offline()
    await open('/')
    await expect(page.getByTestId('connection-unreachable').getByRole('heading', { level: 1 })).toHaveText(/^\s*Can't reach Boxwood: /, { timeout: 15_000 })
    await expect(page.getByTestId('connection-next-try')).toContainText('Trying again by itself in')
  })
})
