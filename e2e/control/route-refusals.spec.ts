import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'

test('explicit Bluetooth stays selected after identity policy refusal', async ({ page, open, isMobile }, testInfo) => {
  await open('/system')
  await expect(page.getByTestId('system-page')).toBeVisible()
  await page.evaluate(async port => {
    const fixture = await import(/* @vite-ignore */ '/e2e/fakes/managedBluetooth.ts')
    ;(window as any).managedBle = await fixture.managedBluetooth(`http://localhost:${port}`)
  }, MOCK_PORT)
  await expect(page.getByTestId('system-page')).toBeVisible()
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
  const answer = await page.evaluate(async () => {
    const ble = (window as any).managedBle
    const identity = await ble.refuseIdentity()
    await ble.refuseRpc()
    await ble.query()
    return { identity, counts: ble.counts, label: ble.label(), dropped: ble.dropped(), connection: ble.connection() }
  })
  expect(answer.identity).toBeNull()
  expect(answer.counts.identities).toBeGreaterThan(0)
  expect(answer.counts.aux).toBe(0)
  expect(answer.counts.policyRefusals).toBeGreaterThanOrEqual(2)
  expect(answer.counts.refusedMethods).toEqual(expect.arrayContaining(['server.config', 'machine.update.status']))
  expect(answer.counts.rpc).toEqual(expect.arrayContaining(['server.info', 'server.connection.identify', 'printer.info', 'printer.objects.list', 'printer.objects.subscribe']))
  expect(answer.counts.dials).toBe(1)
  expect(answer.counts.closes).toBe(0)
  expect(answer.counts.sockets).toBe(1)
  expect(answer.label).toBe('Via Bluetooth')
  expect(answer.dropped).toBeNull()
  expect(answer.connection).toBe('connected')
  await expect(page.getByTestId('bluetooth-fallback')).toHaveCount(0)
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
  await expect(page.getByTestId('system-page')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('bluetooth-after-refusal.png') })
})
