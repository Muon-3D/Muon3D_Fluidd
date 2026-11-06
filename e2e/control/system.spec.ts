/**
 * Settings sub-pages: Wi-Fi and network, System and Updating.
 *
 * What they have to show, that every destructive action (restart, shut down,
 * stop a service, join or forget a network, the hotspot) sends nothing
 * until it has been confirmed, and that Updating can be left without
 * stopping the update. The printer's answers are laid per test by
 * usePrinter and page.route, so nothing here changes the shared mock.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const SYSTEM_INFO = {
  system_info: {
    cpu_info: { cpu_count: 4, bits: '64bit', processor: 'aarch64', model: 'Raspberry Pi CM4', total_memory: 4 * 1024 * 1024, memory_units: 'kB' },
    distribution: { name: 'MuonOS', id: 'muonos', release_info: { version_id: '1.4.2' } },
    available_services: ['klipper', 'moonraker', 'timelapse'],
    instance_ids: { klipper: 'klipper', moonraker: 'moonraker', timelapse: 'timelapse' },
    service_state: {
      klipper: { active_state: 'active', sub_state: 'running' },
      moonraker: { active_state: 'active', sub_state: 'running' },
      timelapse: { active_state: 'inactive', sub_state: 'dead' }
    },
    virtualization: { virt_type: 'none', virt_identifier: 'none' },
    network: { wlan0: { ip_addresses: [{ family: 'ipv4', address: '192.168.1.42' }] } }
  }
}

/** An idle printer whose services are known, so the page can be driven without touching the real one. */
async function system (page: import('@playwright/test').Page) {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['machine.system_info'] = SYSTEM_INFO
  for (const method of ['machine.reboot', 'machine.shutdown', 'machine.services.restart', 'machine.services.stop', 'machine.services.start', 'printer.restart', 'printer.firmware_restart', 'server.restart']) {
    printer.state.answers[method] = 'ok'
  }
  return printer
}

const sent = (printer: Awaited<ReturnType<typeof system>>) =>
  printer.calls.filter(c => /^(machine\.(reboot|shutdown|services\.)|printer\.(firmware_)?restart|server\.restart)/.test(c.method)).map(c => c.method)

test.describe('System', () => {
  test('is tiles: the host, the load as four bars, the boards, services with a Restart on each row, and the logs', async ({ page, open }) => {
    await system(page)
    await open('/system')
    await expect(page.getByTestId('system-page')).toBeVisible()
    await expect(page.getByTestId('system-summary')).toContainText('1 service stopped')

    await expect(page.getByTestId('system-host')).toContainText('MuonOS 1.4.2')
    const load = page.getByTestId('system-usage')
    for (const bar of ['cpu', 'memory', 'disk', 'temperature']) await expect(load.locator(`[data-bar=${bar}]`)).toBeVisible()
    await expect(load.getByRole('meter')).toHaveCount(4)
    await expect(page.getByTestId('system-boards')).toBeVisible()

    // Services are rows with a state and a button on the row: nothing waits for a hover.
    const klipper = page.locator('[data-service=klipper]')
    await expect(klipper).toContainText('Runs the printer')
    await expect(klipper).toContainText('Running')
    await expect(klipper.getByRole('button', { name: 'Restart' })).toBeVisible()
    await expect(page.locator('[data-service=timelapse]').getByRole('button', { name: 'Start' })).toBeVisible()
    // Moonraker cannot be stopped from the page it answers.
    await expect(page.locator('[data-service=moonraker]').getByRole('button', { name: 'Stop' })).toHaveCount(0)

    const logs = page.getByTestId('system-logs')
    await expect(logs).toContainText('klippy.log')
    await expect(logs).toContainText('moonraker.log')
  })

  test('Reboot and Shut down are red, ask first, and send nothing until confirmed', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    const reboot = page.getByTestId('system-reboot')
    const shutdown = page.getByTestId('system-shutdown')
    await expect(reboot).toBeEnabled()
    await expect(reboot).toHaveClass(/cbtn--danger/)
    await expect(shutdown).toHaveClass(/cbtn--danger/)
    await expect(reboot).not.toHaveClass(/cbtn--primary/)

    // Asked, then cancelled: nothing sent.
    await reboot.click()
    const dialog = page.getByRole('dialog', { name: /Restart .* computer\?/ })
    await expect(dialog).toBeVisible()
    expect(sent(printer)).toEqual([])
    await page.getByRole('dialog').getByTestId('confirm-cancel').click()
    await expect(dialog).toHaveCount(0)
    expect(sent(printer)).toEqual([])

    await shutdown.click()
    await expect(page.getByRole('dialog', { name: /Shut down .* computer\?/ })).toBeVisible()
    expect(sent(printer)).toEqual([])
    await page.getByRole('dialog').getByTestId('confirm-cancel').click()
    expect(sent(printer)).toEqual([])

    // Confirmed: sent once.
    await reboot.click()
    await page.getByRole('dialog').getByTestId('confirm-ok').click()
    await expect.poll(() => sent(printer)).toEqual(['machine.reboot'])
  })

  test('Shut down sends machine.shutdown only after the confirm', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    await page.getByTestId('system-shutdown').click()
    expect(sent(printer)).toEqual([])
    await page.getByRole('dialog').getByTestId('confirm-ok').click()
    await expect.poll(() => sent(printer)).toEqual(['machine.shutdown'])
  })

  test('restarting or stopping a service asks first, and sends nothing until confirmed', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    const row = page.locator('[data-service=klipper]')

    await row.getByRole('button', { name: 'Restart' }).click()
    await expect(page.getByRole('dialog', { name: 'Restart klipper?' })).toBeVisible()
    await page.getByRole('dialog').getByTestId('confirm-cancel').click()
    expect(sent(printer)).toEqual([])

    await row.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByRole('dialog', { name: 'Stop klipper?' })).toBeVisible()
    await page.getByRole('dialog').getByTestId('confirm-cancel').click()
    expect(sent(printer)).toEqual([])

    await row.getByRole('button', { name: 'Restart' }).click()
    await page.getByRole('dialog').getByTestId('confirm-ok').click()
    await expect.poll(() => printer.called('machine.services.restart')).toEqual([{ service: 'klipper' }])
    expect(printer.called('machine.services.stop')).toEqual([])
  })

  test('a stopped service starts at once, as it did, and the logs are download rows', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    await page.locator('[data-service=timelapse]').getByRole('button', { name: 'Start' }).click()
    await expect.poll(() => printer.called('machine.services.start')).toEqual([{ service: 'timelapse' }])

    await expect(page.getByTestId('system-log-klippy.log')).toHaveText('Download')
    await expect(page.getByTestId('system-log-moonraker.log')).toHaveText('Download')
  })

  test('while printing, Reboot and Shut down are off and say why', async ({ page, open }) => {
    // The shared mock is a printer mid-print.
    await usePrinter(page, { print_stats: { state: 'printing' } })
    await open('/system')
    await expect(page.getByTestId('system-reboot')).toBeDisabled()
    await expect(page.getByTestId('system-shutdown')).toBeDisabled()
    await expect(page.getByTestId('system-page')).toContainText('Not while printing.')
  })

  test('Klipper restarts ask nothing new: they are as they were, one button each', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    await expect(page.getByTestId('system-restart-klipper')).toBeVisible()
    await expect(page.getByTestId('system-klipper')).toContainText('A restart reads printer.cfg again')
    expect(sent(printer)).toEqual([])
  })

  test('fits the screen with nothing cut off', async ({ page, open }) => {
    await system(page)
    await open('/system')
    await expect(page.getByTestId('system-power')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('Wi-Fi and network', () => {
  /** Every request that would change something on the printer's network, with its path. */
  function watchChanges (page: import('@playwright/test').Page) {
    const changes: string[] = []
    page.on('request', request => {
      if (/\/server\/aux\/(wifi|ap)/.test(request.url()) && request.method() !== 'GET') changes.push(`${request.method()} ${new URL(request.url()).pathname}`)
    })
    return changes
  }

  test('shows the network it is on as a tile, the others as a list, the hotspot and the cable', async ({ page, open }) => {
    const printer = await usePrinter(page)
    printer.state.results['machine.system_info'] = SYSTEM_INFO
    await open('/wifi')
    await expect(page.getByTestId('wifi-page')).toBeVisible()

    const now = page.getByTestId('wifi-connected')
    await expect(now.getByTestId('wifi-connected-name')).toHaveText('Workshop')
    await expect(now).toContainText('Online')
    await expect(now).toContainText('192.168.1.42')
    await expect(now.getByRole('button', { name: 'Forget this network' })).toBeVisible()

    const list = page.getByTestId('wifi-networks')
    await expect(list.locator('[data-ssid="Workshop-2G"]')).toContainText('Connect')
    await expect(list.locator('[data-ssid="Workshop"]')).toContainText('Connected')
    await expect(page.getByTestId('wifi-available').getByRole('button', { name: 'Scan' })).toBeVisible()

    const hotspot = page.getByTestId('hotspot-card')
    await expect(hotspot).toContainText('Hotspot')
    await expect(hotspot).toContainText('Turning it on drops the current connection')
    await expect(page.getByTestId('hotspot-state')).toHaveText('Off')

    await expect(page.getByTestId('wifi-ethernet')).toContainText('No cable')
  })

  test('joining a network asks first and sends nothing until Proceed', async ({ page, open }) => {
    await usePrinter(page)
    const changes = watchChanges(page)
    await page.route('**/server/aux/wifi/connect', route => route.fulfill({ json: {} }))
    await page.route('**/server/aux/wifi/switch_up**', route => route.fulfill({ json: {} }))
    await open('/wifi')
    await page.getByTestId('wifi-networks').locator('[data-ssid="Guest"]').getByRole('button', { name: 'Connect' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click()
    expect(changes).toEqual([])

    await page.getByTestId('wifi-networks').locator('[data-ssid="Guest"]').getByRole('button', { name: 'Connect' }).click()
    await page.getByTestId('wifi-proceed').click()
    await expect.poll(() => changes.length).toBeGreaterThan(0)
  })

  test('the hotspot has its name and password as fields, the password hidden until asked, and changing them is a separate step', async ({ page, open }) => {
    await usePrinter(page)
    const changes = watchChanges(page)
    await open('/wifi')
    const hotspot = page.getByTestId('hotspot-card')
    await expect(page.getByTestId('hotspot-state')).toBeVisible()
    await expect(hotspot.getByLabel('Name (SSID)')).toHaveValue('Muon-boxwood-367a')
    const password = hotspot.locator('input[type=password]')
    await expect(password).toHaveCount(1)
    // Fields are read-only until "Change the name or password"; opening that sends nothing.
    await expect(hotspot.getByLabel('Name (SSID)')).toBeDisabled()
    await page.getByTestId('hotspot-edit').click()
    await expect(hotspot.getByLabel('Name (SSID)')).toBeEnabled()
    await expect(page.getByTestId('hotspot-apply')).toBeDisabled()
    expect(changes).toEqual([])
  })

  test('forgetting the current network is one red button on its tile', async ({ page, open }) => {
    await usePrinter(page)
    await open('/wifi')
    const forget = page.getByTestId('wifi-connected').getByTestId('wifi-forget')
    await expect(forget).toHaveClass(/cbtn--danger/)
  })

  test('fits the screen with nothing cut off', async ({ page, open }) => {
    await usePrinter(page)
    await open('/wifi')
    await expect(page.getByTestId('wifi-connected')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('Updating', () => {
  const INSTALLING = { state: 'installing', current_version: '0.9.3', target_version: '0.9.4', update_available: true, progress: 58, install: { phase: 'installing', job_id: 'job-1', progress: 58 } }

  /** What the page tried to install or activate: nothing here should ever do that. */
  function watchInstalls (page: import('@playwright/test').Page) {
    const installs: string[] = []
    page.on('request', request => {
      if (/\/server\/aux\/update\//.test(request.url()) && request.method() !== 'GET') installs.push(`${request.method()} ${new URL(request.url()).pathname}`)
    })
    return installs
  }

  test('shows the install in the frame: percent, step, bar, each step, and the warning', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: INSTALLING }))
    const installs = watchInstalls(page)
    await open('/updating')
    const screen = page.getByTestId('updating-installing')
    await expect(screen).toBeVisible()
    await expect(screen).toContainText('Installing update')
    await expect(screen.getByTestId('updating-percent')).toContainText('58')
    await expect(screen).toContainText('Step 1 of 4')
    await expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '58')
    for (const step of ['Installing', 'Restarting', 'Verifying', 'Complete']) await expect(screen).toContainText(step)
    await expect(screen.getByTestId('updating-warning')).toContainText('Do not power off.')
    // The frame is still there: the top bar and its E-STOP are not hidden by the update.
    await expect(page.getByTestId('page-title')).toBeVisible()
    expect(installs).toEqual([])
  })

  test('has a way back to Overview, and leaving does not stop or forget the update', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: INSTALLING }))
    const installs = watchInstalls(page)
    await open('/updating')
    await page.getByTestId('updating-leave').click()
    await expect(page).toHaveURL(/\/boxwood-367a\/?$/)
    expect(installs).toEqual([])
    // The page remembers the install, so the bar on every page still follows it.
    const remembered = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('muon3d.update.')).map(([, v]) => JSON.parse(v).phase))
    expect(remembered).toEqual(['installing'])
  })

  test('with no update under way it says so, offers the way back, and installs nothing', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: { state: 'idle', current_version: '0.9.3', update_available: true, target_version: '0.9.4' } }))
    const installs = watchInstalls(page)
    await open('/updating')
    await expect(page.getByRole('status').filter({ hasText: 'Up to date' })).toBeVisible()
    await expect(page.getByTestId('updating-leave')).toBeVisible()
    await expect(page.getByTestId('updating-warning')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /install|activate/i })).toHaveCount(0)
    expect(installs).toEqual([])
  })
})
