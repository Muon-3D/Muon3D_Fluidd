import { test, expect, ready, PRINTER } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block' })

for (const route of ['LAN', 'cloud'] as const) {
  test.describe(`${route} socket`, () => {
    test.use({ signedIn: route === 'cloud' })

    for (const fault of ['clean close', 'silent stall'] as const) {
      const section = fault === 'clean close' ? 'Overview' : 'Console'
      test(`${fault} on ${section} reconnects without Offline, reload or duplicate updates`, async ({ page, account, open }) => {
        if (route === 'cloud') await useAllRoutes(page, account)
        const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
        if (route === 'LAN') {
          await open(section === 'Overview' ? '/' : '/console')
        } else {
          await page.goto('/')
          await ready(page)
          await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).click()
          await page.locator('.menuable__content__active [data-action="connect-cloud"]').click()
          await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
          if (section === 'Console') {
            await page.evaluate(async path => {
              const router = (await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))).default
              await router.push(path)
            }, `${PRINTER}/console`)
          }
        }
        await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible()
        await expect.poll(() => printer.called('printer.objects.subscribe').length).toBeGreaterThan(0)
        const subscriptions = printer.called('printer.objects.subscribe').length
        const connections = printer.socketOpens
        const url = page.url()
        const marker = await page.evaluate(() => {
          const w = window as unknown as { socketDropMarker: string, socketDropOffline: string[] }
          w.socketDropMarker = crypto.randomUUID()
          w.socketDropOffline = []
          new MutationObserver(() => {
            const lines = document.body.innerText.split('\n').filter(line => /\boffline\b/i.test(line))
            w.socketDropOffline.push(...lines)
          }).observe(document.body, { subtree: true, childList: true, characterData: true })
          return w.socketDropMarker
        })
        const navigations: string[] = []
        page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(frame.url()) })

        if (fault === 'clean close') await printer.dropSocket()
        else printer.stallSocket()
        expect(await page.evaluate(async port => (await fetch(`http://localhost:${port}/server/info`)).ok, MOCK_PORT)).toBe(true)
        await expect(page.getByTestId(fault === 'clean close' ? 'connection-reconnecting' : 'connection-quiet')).toBeVisible()
        await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible()
        await expect.poll(() => printer.socketOpens, { timeout: 40_000 }).toBe(connections + 1)
        await expect.poll(() => printer.called('printer.objects.subscribe').length).toBeGreaterThan(subscriptions)
        await expect(page.getByTestId('connection-reconnecting')).toBeHidden()

        printer.report({ print_stats: { state: 'paused', filename: 'socket-resumed.gcode' } })
        await expect(page.getByTestId('printer-switch')).toContainText('Paused')
        if (section === 'Console') {
          printer.say('Socket resumed: first response')
          const log = page.getByTestId('console-log')
          await expect(log.getByText('Socket resumed: first response', { exact: true })).toHaveCount(1)
          printer.say('Socket resumed: second response')
          await expect(log.getByText('Socket resumed: second response', { exact: true })).toHaveCount(1)
          await expect(log.getByText('Socket resumed: first response', { exact: true })).toHaveCount(1)
        }
        expect(page.url()).toBe(url)
        expect(navigations).toEqual([])
        expect(await page.evaluate(() => (window as unknown as { socketDropMarker: string }).socketDropMarker)).toBe(marker)
        expect(await page.evaluate(() => (window as unknown as { socketDropOffline: string[] }).socketDropOffline)).toEqual([])
      })
    }
  })
}
