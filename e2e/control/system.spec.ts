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
import { BOXWOOD_STAGED } from '../../src/services/updates/__tests__/fixtures/boxwood-staged'

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
    await page.getByRole('dialog').getByTestId('confirm-cancel').last().click()
    await expect(dialog).toHaveCount(0)
    expect(sent(printer)).toEqual([])

    await shutdown.click()
    await expect(page.getByRole('dialog', { name: /Shut down .* computer\?/ })).toBeVisible()
    expect(sent(printer)).toEqual([])
    await page.getByRole('dialog').getByTestId('confirm-cancel').last().click()
    expect(sent(printer)).toEqual([])

    // Confirmed: sent once.
    await reboot.click()
    await page.getByRole('dialog').getByTestId('confirm-ok').last().click()
    await expect.poll(() => sent(printer)).toEqual(['machine.reboot'])
  })

  test('Shut down sends machine.shutdown only after the confirm', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    await page.getByTestId('system-shutdown').click()
    expect(sent(printer)).toEqual([])
    await page.getByRole('dialog').getByTestId('confirm-ok').last().click()
    await expect.poll(() => sent(printer)).toEqual(['machine.shutdown'])
  })

  test('restarting or stopping a service asks first, and sends nothing until confirmed', async ({ page, open }) => {
    const printer = await system(page)
    await open('/system')
    const row = page.locator('[data-service=klipper]')

    await row.getByRole('button', { name: 'Restart' }).click()
    await expect(page.getByRole('dialog', { name: 'Restart klipper?' })).toBeVisible()
    await page.getByRole('dialog').getByTestId('confirm-cancel').last().click()
    expect(sent(printer)).toEqual([])

    await row.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByRole('dialog', { name: 'Stop klipper?' })).toBeVisible()
    await page.getByRole('dialog').getByTestId('confirm-cancel').last().click()
    expect(sent(printer)).toEqual([])

    await row.getByRole('button', { name: 'Restart' }).click()
    await page.getByRole('dialog').getByTestId('confirm-ok').last().click()
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

  test('shows the network it is on as a tile, the others as a list, and the hotspot', async ({ page, open }) => {
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

    await expect(page.getByTestId('wifi-ethernet')).toHaveCount(0)
  })

  test('has no Ethernet entry, and the Wi-Fi and Hotspot rows are one height (KAN-2044)', async ({ page, open }, testInfo) => {
    const printer = await usePrinter(page)
    printer.state.results['machine.system_info'] = SYSTEM_INFO
    await open('/wifi')
    await expect(page.getByTestId('wifi-page')).toBeVisible()
    await expect(page.getByTestId('hotspot-card')).toBeVisible()
    await expect(page.getByTestId('wifi-connected')).toBeVisible()
    await expect(page.getByTestId('wifi-page').getByText('Ethernet')).toHaveCount(0)
    await expect(page.getByRole('menuitem', { name: /ethernet/i })).toHaveCount(0)

    const wifi = await page.getByTestId('wifi-connected').boundingBox()
    const hotspot = await page.getByTestId('hotspot-card').boundingBox()
    expect(wifi && hotspot).toBeTruthy()
    expect(Math.abs(wifi!.height - hotspot!.height)).toBeLessThanOrEqual(1)

    await page.getByTestId('wifi-page').screenshot({ path: `e2e/control/screenshots/wifi-tidy-${testInfo.project.name}.png` })
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

  test('an install that never ended does not show a banner or the Updating screen on a load', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: { state: 'idle', current_version: '0.9.3', session: null } }))
    // Verifying, last heard of three hours ago: past any restart budget (the unit tests cover clearing it and a reload).
    await page.addInitScript(([k, seen]) => {
      localStorage.setItem(k, JSON.stringify({ jobId: null, phase: 'verifying', from: null, to: '0.9.4', progress: null, seenAt: seen, lostAt: null, budgetMs: 1_200_000 }))
    }, ['muon3d.update.boxwood-367a', Date.now() - 3 * 3_600_000] as const)
    await open('/')
    await expect(page.getByTestId('overview-page').or(page.getByTestId('page-title')).first()).toBeVisible()
    await expect(page.getByTestId('update-banner')).toHaveCount(0)
    await expect(page.getByText('Verifying update')).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: /Restarting|Restart delayed/ })).toHaveCount(0)
  })
})

/** The requests that would change the printer's network, with their query and body. */
function watchCalls (page: import('@playwright/test').Page) {
  const calls: Array<{ method: string, path: string, query: string, body: string }> = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (/\/server\/aux\/wifi\//.test(url.pathname) && request.method() !== 'GET') {
      calls.push({ method: request.method(), path: url.pathname.replace('/server/aux', ''), query: url.search, body: request.postData() ?? '' })
    }
  })
  return calls
}

test.describe('Wi-Fi: every change asks first and sends the right call', () => {
  test('Disconnect asks, sends nothing until confirmed, then POST /wifi/disconnect', async ({ page, open }) => {
    await usePrinter(page)
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-connected').getByTestId('wifi-disconnect').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(calls).toEqual([])
    await dialog.getByRole('button', { name: /cancel/i }).click()
    expect(calls).toEqual([])

    await page.getByTestId('wifi-connected').getByTestId('wifi-disconnect').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/disconnect'])
  })

  test('Forget on the connected network warns that the page may be lost, and sends nothing until confirmed, then DELETE /wifi/forget', async ({ page, open }) => {
    await usePrinter(page)
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-connected').getByTestId('wifi-forget').click()
    const dialog = page.getByRole('dialog', { name: 'Forget Workshop?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('You may lose this page')
    await expect(dialog).toContainText('drop off this network')
    expect(calls).toEqual([])
    await dialog.getByTestId('confirm-cancel').click()
    expect(calls).toEqual([])

    await page.getByTestId('wifi-connected').getByTestId('wifi-forget').click()
    await page.getByRole('dialog', { name: 'Forget Workshop?' }).last().getByTestId('confirm-ok').click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}${c.query}`)).toEqual(['DELETE /wifi/forget?ssid=Workshop'])
  })

  test('joining an open network sends POST /wifi/connect with its name, only after Proceed', async ({ page, open }) => {
    await usePrinter(page)
    // The printer has not saved Guest: asking for its details fails, so it is joined with a new connection.
    await page.route('**/server/aux/wifi/show**', route => (route.request().url().includes('ssid=Guest') ? route.fulfill({ status: 404, json: {} }) : route.fallback()))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('wifi-networks').locator('[data-ssid="Guest"]')).toBeVisible()
    await page.getByTestId('wifi-networks').locator('[data-ssid="Guest"]').getByRole('button', { name: 'Connect' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(calls).toEqual([])
    await page.getByTestId('wifi-proceed').click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/connect'])
    expect(JSON.parse(calls[0].body)).toMatchObject({ ssid: 'Guest' })
  })

  test('joining a saved network sends POST /wifi/connect with no password, never /wifi/up, only after Proceed', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/connect', route => route.fulfill({ json: {} }))
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-networks').locator('[data-ssid="Workshop-2G"]').getByRole('button', { name: 'Connect' }).click()
    expect(calls).toEqual([])
    await page.getByTestId('wifi-proceed').click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}${c.query}`)).toEqual(['POST /wifi/connect'])
    const body = JSON.parse(calls[0].body)
    expect(body).toEqual({ ssid: 'Workshop-2G' })
  })

  test('the hotspot switch turns it on with POST /wifi/ap/up (it asks first only when this page is reached over the hotspot)', async ({ page, open }) => {
    await usePrinter(page)
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toHaveText('Off')
    expect(calls).toEqual([])
    await page.getByTestId('hotspot-switch').click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/ap/up'])
  })

  test('a row shows its channel, speed and frequency in sight, and Forget sits apart from Connect', async ({ page, open }) => {
    await usePrinter(page)
    await open('/wifi')
    const row = page.getByTestId('wifi-networks').locator('[data-ssid="Workshop-2G"]')
    await expect(row.getByTestId('wifi-detail')).toContainText(/channel 6 · 130 Mbps · 2437 MHz/)
    const [forget, connect] = [await row.getByTestId('wifi-forget').boundingBox(), await row.getByRole('button', { name: 'Connect' }).boundingBox()]
    expect(connect!.x - (forget!.x + forget!.width)).toBeGreaterThanOrEqual(12)
  })
})

const PANEL_NOTE = "Do this at the printer's screen"
const PANEL_ONLY = { error: { code: 403, message: 'panel_only' } }

test.describe('Wi-Fi on a printer with MuonOS #492 (KAN-1799): panel-only routes', () => {
  // The Aux API is plain HTTP, so these are answered with page.route, not usePrinter's websocket answers.
  const hotspotOn = (page: import('@playwright/test').Page) => page.route('**/server/aux/wifi/ap/device/status', route => route.fulfill({ json: { device: 'ap0', device_type: 'wifi', state: 'connected', connection: 'ap0-con' } }))

  test('Disconnect that the printer refuses says so, and the button gives way to the note', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/disconnect', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-connected').getByTestId('wifi-disconnect').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/disconnect'])
    await expect(page.getByText(PANEL_NOTE, { exact: false }).first()).toBeVisible()
    await expect(page.getByTestId('wifi-disconnect-panel')).toHaveText(PANEL_NOTE)
    await expect(page.getByTestId('wifi-disconnect')).toHaveCount(0)
  })

  test('Disconnect on a printer without #492 still sends POST /wifi/disconnect and keeps its button', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/disconnect', route => route.fulfill({ json: {} }))
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-connected').getByTestId('wifi-disconnect').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/disconnect'])
    await expect(page.getByTestId('wifi-disconnect')).toBeVisible()
    await expect(page.getByTestId('wifi-disconnect-panel')).toHaveCount(0)
  })

  test('turning the hotspot off that the printer refuses says so, and the switch gives way to the note', async ({ page, open }) => {
    await usePrinter(page)
    await hotspotOn(page)
    await page.route('**/server/aux/wifi/ap/down', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toHaveText('On')
    await page.getByTestId('hotspot-switch').click()
    const proceed = page.getByRole('dialog').getByRole('button', { name: /proceed/i })
    if (await proceed.isVisible().catch(() => false)) await proceed.click()
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/ap/down'])
    await expect(page.getByTestId('hotspot-off-panel')).toHaveText(PANEL_NOTE)
    await expect(page.getByTestId('hotspot-switch')).toHaveCount(0)
    await expect(page.getByText(PANEL_NOTE, { exact: false }).first()).toBeVisible()
  })

  async function editHotspot (page: import('@playwright/test').Page) {
    await page.getByTestId('hotspot-edit').click()
    await page.getByTestId('hotspot-card').locator('input[type=password]').fill('a-new-passphrase')
    await page.getByTestId('hotspot-apply').click()
    const proceed = page.getByRole('dialog').getByRole('button', { name: /proceed/i })
    if (await proceed.isVisible().catch(() => false)) await proceed.click()
  }

  test('changing the hotspot falls back from a refused /wifi/ap/modify to POST /wifi/ap/change, and says to confirm at the printer', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/modify', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    await page.route('**/server/aux/wifi/ap/change', route => route.fulfill({ status: 202, json: { challenge_id: 'c1', expires_at: 1 } }))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toBeVisible()
    await editHotspot(page)
    await expect.poll(() => calls.map(c => `${c.method} ${c.path}`)).toEqual(['POST /wifi/ap/modify', 'POST /wifi/ap/change'])
    expect(JSON.parse(calls[1].body)).toEqual({ password: 'a-new-passphrase' })
    await expect(page.getByText('Press the knob on the printer to confirm', { exact: false })).toBeVisible()
  })

  test('a refused /wifi/connect (strict mode) shows the printer-screen note', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/connect', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    const calls = watchCalls(page)
    await open('/wifi')
    await page.getByTestId('wifi-networks').locator('[data-ssid="Workshop-2G"]').getByRole('button', { name: 'Connect' }).click()
    await page.getByTestId('wifi-proceed').click()
    await expect.poll(() => calls.map(c => c.path)).toEqual(['/wifi/connect'])
    await expect(page.getByText(PANEL_NOTE, { exact: false }).first()).toBeVisible()
  })

  test('a refused /wifi/ap/up (strict mode) shows the printer-screen note', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/up', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toHaveText('Off')
    await page.getByTestId('hotspot-switch').click()
    await expect.poll(() => calls.map(c => c.path)).toEqual(['/wifi/ap/up'])
    await expect(page.getByText(PANEL_NOTE, { exact: false }).first()).toBeVisible()
  })

  test('a refused /wifi/ap/change shows the note, never a silent failure', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/modify', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    await page.route('**/server/aux/wifi/ap/change', route => route.fulfill({ status: 403, json: PANEL_ONLY }))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toBeVisible()
    await editHotspot(page)
    await expect.poll(() => calls.map(c => c.path)).toEqual(['/wifi/ap/modify', '/wifi/ap/change'])
    await expect(page.getByText(PANEL_NOTE, { exact: false }).first()).toBeVisible()
  })

  test('changing the hotspot on a printer without #492 still sends only POST /wifi/ap/modify', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/wifi/ap/modify', route => route.fulfill({ json: {} }))
    await page.route('**/server/aux/wifi/ap/up', route => route.fulfill({ json: {} }))
    const calls = watchCalls(page)
    await open('/wifi')
    await expect(page.getByTestId('hotspot-state')).toBeVisible()
    await editHotspot(page)
    await expect.poll(() => calls.map(c => c.path)).toContain('/wifi/ap/modify')
    expect(calls.map(c => c.path)).not.toContain('/wifi/ap/change')
  })
})

test.describe('System: power devices, Klipper and activity', () => {
  async function withDevice (page: import('@playwright/test').Page) {
    const printer = await usePrinter(page, PRESETS.idleHomed(), { components: ['power'] })
    printer.state.results['machine.system_info'] = SYSTEM_INFO
    printer.state.answers['machine.device_power.devices'] = { devices: [{ device: 'printer_psu', status: 'on', locked_while_printing: false, type: 'gpio' }] }
    for (const method of ['machine.device_power.on', 'machine.device_power.off', 'printer.restart', 'printer.firmware_restart']) printer.state.answers[method] = 'ok'
    return printer
  }

  test('a power device switches at once when the setting is off, as it did', async ({ page, open }) => {
    const printer = await withDevice(page)
    await open('/system')
    await page.getByTestId('system-power-devices').getByRole('switch', { name: 'printer_psu' }).click()
    await expect.poll(() => printer.called('machine.device_power.off')).toEqual([{ printer_psu: null }])
  })

  test('Restart Klipper sends its one call', async ({ page, open }) => {
    const printer = await withDevice(page)
    await open('/system')
    expect(printer.called('printer.restart')).toEqual([])
    await page.getByTestId('system-restart-klipper').click()
    await expect.poll(() => printer.called('printer.restart').length).toBe(1)
    expect(printer.called('printer.firmware_restart')).toEqual([])
  })

  test('Restart the firmware sends its one call', async ({ page, open }) => {
    const printer = await withDevice(page)
    await open('/system')
    await page.getByTestId('system-firmware-restart').click()
    await expect.poll(() => printer.called('printer.firmware_restart').length).toBe(1)
    expect(printer.called('printer.restart')).toEqual([])
  })

  test('the activity tile still has the computer and its memory, with Klipper and Moonraker', async ({ page, open }) => {
    await withDevice(page)
    await open('/system')
    const activity = page.getByTestId('system-activity')
    for (const label of ['The computer', 'Memory', 'Klipper', 'Moonraker']) await expect(activity).toContainText(label)
  })
})

test.describe('Updating: following an install, and a refused route', () => {
  test('follows an install across a restart and an offline gap to "Updated"', async ({ page, open }) => {
    await usePrinter(page)
    type Phase = 'installing' | 'rebooting' | 'gap' | 'back'
    let phase: Phase = 'installing'
    const bodies: Record<Exclude<Phase, 'gap'>, unknown> = {
      installing: { state: 'installing', current_version: '0.9.3', target_version: '0.9.4', update_available: true, progress: 60, install: { phase: 'installing', job_id: 'job-1', progress: 60 } },
      rebooting: { state: 'rebooting', current_version: '0.9.3', target_version: '0.9.4', install: { phase: 'rebooting', job_id: 'job-1' } },
      back: { state: 'idle', current_version: '0.9.4', session: null }
    }
    await page.route('**/server/aux/update/status', route => (phase === 'gap' ? route.abort() : route.fulfill({ json: bodies[phase] })))
    await open('/updating')
    await expect(page.getByTestId('updating-installing')).toContainText('Installing update')
    await expect(page.getByTestId('updating-percent')).toContainText('60')
    // The printer restarts, goes quiet for a while, and comes back on the new version.
    phase = 'rebooting'
    await expect(page.getByTestId('updating-rebooting')).toBeVisible({ timeout: 30_000 })
    phase = 'gap'
    await page.waitForTimeout(11_000)
    phase = 'back'
    await expect(page.getByTestId('updating-updated')).toContainText('Updated', { timeout: 60_000 })
    await expect(page.getByTestId('updating-reload')).toBeVisible()
  })

  test('a refused route is not hammered, and shows no bar or restart screen', async ({ page, open }) => {
    await usePrinter(page)
    let asked = 0
    await page.route('**/server/aux/update/status', route => {
      asked++
      return route.fulfill({ status: 403, json: { error: { code: 403, message: 'Forbidden by policy' } } })
    })
    await open('/updating')
    await expect.poll(() => asked, { timeout: 30_000 }).toBeGreaterThan(0)
    await page.waitForTimeout(15_000)
    // Not hammered: the load, at most one more, then nothing every few seconds.
    expect(asked).toBeLessThanOrEqual(3)
    await expect(page.getByRole('status').filter({ hasText: /Restarting|Restart delayed/ })).toHaveCount(0)
    await expect(page.getByTestId('update-banner')).toHaveCount(0)
  })
})

test.describe('An update staged on the spare slot (real Boxwood status)', () => {
  test('shows no bar and no restart screen on load', async ({ page, open }) => {
    await usePrinter(page, {}, { components: ['update_manager', 'authorization'] })
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: BOXWOOD_STAGED }))
    await open('/')
    // The page's own content, which is there at both sizes (the phone header has no page-title).
    await expect(page.getByTestId('overview-page')).toBeVisible()
    await expect(page.getByTestId('update-banner')).toHaveCount(0)
    await expect(page.getByText('Verifying update')).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: /Restarting|Restart delayed|Verifying/ })).toHaveCount(0)
  })

  test('the bar DOES show for a real install under way, so its absence elsewhere means something', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ json: { state: 'installing', current_version: '0.9.3', target_version: '0.9.4', update_available: true, progress: 58, install: { phase: 'installing', job_id: 'job-1', progress: 58 } } }))
    await open('/updating')
    await expect(page.getByTestId('updating-installing')).toBeVisible()
    await page.getByTestId('updating-leave').click()
    await expect(page.getByTestId('update-banner')).toBeVisible()
    await expect(page.getByTestId('update-banner')).toContainText('Installing update')
  })

  test('a stale entry with a refused route shows no bar after leaving the Updating page', async ({ page, open }) => {
    await usePrinter(page)
    await page.route('**/server/aux/update/status', route => route.fulfill({ status: 403, json: { error: { code: 403, message: 'Forbidden by policy' } } }))
    await page.addInitScript(([k, seen]) => {
      localStorage.setItem(k, JSON.stringify({ jobId: 'j1', phase: 'installing', from: '0.9.3', to: '0.9.4', progress: 40, seenAt: seen, lostAt: seen, budgetMs: 1_200_000 }))
    }, ['muon3d.update.boxwood-367a', Date.now() - 3 * 3_600_000] as const)
    await open('/updating')
    await page.getByTestId('updating-leave').click()
    // The page's own content, which is there at both sizes (the phone header has no page-title).
    await expect(page.getByTestId('overview-page')).toBeVisible()
    await expect(page.getByTestId('update-banner')).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: /Restart delayed|Restarting/ })).toHaveCount(0)
  })
})
