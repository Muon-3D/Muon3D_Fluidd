/**
 * Agents live on Control (KAN-1359): the console's activity stream tints the
 * control an agent is using with its colour and name, and Account > Connected
 * apps lists the connected services with a Revoke. The fake console serves
 * the deployed shapes (`GET /v1/agents`, `GET /v1/agents/events`,
 * `POST /v1/agents/{id}/revoke`); each stream answer ends after what's due,
 * so Control reconnects with `Last-Event-ID` as it does when dropped.
 */
import { test, expect } from '../fixtures'
import { agentsFake, consoleRoute, pushAgentEvent, type AgentsFake, type ConsoleState } from '../fakes/console'
import { usePrinter, PRESETS } from './printer'

test.use({ signedIn: true })

// The mock printer's identity (e2e/mock/moonraker.py): what Control matches events by.
const DEVICE = 'mockendpointboxwood367a'
const PRINTER = { id: 'prn_1', name: 'Boxwood', device_id: DEVICE }
const CLAUDE = { id: 'agt_1', name: 'Claude', colour: '#476CE0', colour_index: 5, provider: 'anthropic' }
const GPT = { id: 'agt_2', name: 'ChatGPT', colour: '#2F9E5F', colour_index: 3, provider: 'openai' }

function act (agents: AgentsFake, phase: string, over: Record<string, unknown> = {}) {
  return pushAgentEvent(agents, 'agent.action', {
    v: 1,
    at: new Date().toISOString(),
    agent: CLAUDE,
    printer: PRINTER,
    action: 'printer.heat',
    phase,
    ask_id: null,
    target: { heater: 'extruder', target_c: 210 },
    error: null,
    ...over
  })
}

const highlight = (page: import('@playwright/test').Page, control: string) =>
  page.locator(`[data-tid="agent-highlight"][data-control="${control}"]`)

test.describe('Control', () => {
  test('an agent heating the nozzle tints it with its name until it finishes', async ({ page, open, account }) => {
    const agents = account.agents = agentsFake()
    await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    await expect.poll(() => agents.lastEventIds.length).toBeGreaterThan(0)

    act(agents, 'requested')
    const asked = act(agents, 'asked')
    const nozzle = highlight(page, 'hotend')
    await expect(nozzle).toHaveAttribute('data-look', 'asked')
    await expect(nozzle).toContainText('Claude · waiting for you')
    // Control asked again with the last id it read.
    await expect.poll(() => agents.lastEventIds).toContain(String(asked))

    act(agents, 'started')
    await expect(nozzle).toHaveAttribute('data-look', 'active')
    await expect(nozzle.getByTestId('agent-highlight-name')).toHaveText('Claude')
    await expect(highlight(page, 'bed')).toHaveCount(0)

    act(agents, 'finished')
    await expect(nozzle).toHaveCount(0)
  })

  test('two agents on the bed stack their names; a home lights Home; a read lights nothing', async ({ page, open, account }) => {
    const agents = account.agents = agentsFake()
    await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    await expect.poll(() => agents.lastEventIds.length).toBeGreaterThan(0)

    act(agents, 'started', { target: [{ heater: 'heater_bed', target_c: 60 }] })
    act(agents, 'started', { agent: GPT, target: { heater: 'heater_bed', target_c: 65 } })
    act(agents, 'finished', { action: 'printer.read', target: null })
    const bed = highlight(page, 'bed')
    await expect(bed.getByTestId('agent-highlight-name')).toHaveText(['Claude', 'ChatGPT'])
    await expect(highlight(page, 'hotend')).toHaveCount(0)

    act(agents, 'started', { action: 'printer.home', target: { axes: 'xyz' } })
    // Every Home on the page: Home X Y and Home Z on a desktop, Home on a phone.
    const home = highlight(page, 'home')
    await expect(home.first()).toContainText('Claude')
    // The layer takes no clicks: Home still works under it.
    await expect(home.first()).toHaveCSS('pointer-events', 'none')
    await expect(highlight(page, 'jog')).toHaveCount(0)
  })

  test('an event for another printer shows nothing; the safety watch shows as Muon3D safety', async ({ page, open, account }) => {
    const agents = account.agents = agentsFake()
    await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    await expect.poll(() => agents.lastEventIds.length).toBeGreaterThan(0)

    act(agents, 'started', { printer: { ...PRINTER, device_id: 'f'.repeat(64) } })
    act(agents, 'started', { agent: null, target: [{ heater: 'extruder', target_c: 0 }, { heater: 'heater_bed', target_c: 0 }] })
    await expect(highlight(page, 'hotend')).toContainText('Muon3D safety')
    await expect(highlight(page, 'bed')).toContainText('Muon3D safety')
    await expect(highlight(page, 'hotend').getByTestId('agent-highlight-name')).toHaveCount(1)
  })

  test('a resume point the console no longer holds resets: what was shown goes', async ({ page, open, account }) => {
    const agents = account.agents = agentsFake()
    await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    await expect.poll(() => agents.lastEventIds.length).toBeGreaterThan(0)

    const started = act(agents, 'started')
    await expect(highlight(page, 'hotend')).toBeVisible()
    await expect.poll(() => agents.lastEventIds).toContain(String(started))
    // The console's ring moves past Control's last id (the finish is lost):
    // it answers `reset`, and Control clears and reads the snapshot again.
    act(agents, 'finished')
    agents.oldest = agents.events[agents.events.length - 1].id + 1
    await expect(highlight(page, 'hotend')).toHaveCount(0)
    await expect.poll(() => account.seen.filter(s => s === 'GET /v1/agents').length).toBeGreaterThan(0)
  })
})

test.describe('Account > Connected apps', () => {
  // The Account pages show where the console serves Control: point the
  // console at the page's own origin and answer its /v1 routes there.
  test.beforeEach(async ({ page, account, baseURL }) => {
    const origin = new URL(baseURL!).origin
    await page.route(url => url.origin === origin && url.pathname.startsWith('/v1/'), consoleRoute(account as ConsoleState))
    await page.addInitScript(([url]) => { localStorage.setItem('muon.cloud.url', url) }, [origin])
  })

  test('lists connected services and revokes one after a confirm', async ({ page, open, account }) => {
    const soon = new Date(Date.now() + 86400_000 * 3).toISOString()
    const agents = account.agents = agentsFake({
      connections: [{
        agent: CLAUDE,
        printers: [PRINTER],
        expires_at: soon,
        last_active_at: new Date(Date.now() - 5 * 60_000).toISOString(),
        status: 'active',
        grant: null,
        client: { id: 'dcr_1', name: 'Claude', client_uri: 'https://claude.ai' }
      }]
    })
    await open('/account/apps')
    const list = page.getByTestId('services-list')
    const row = list.getByTestId('services-row')
    await expect(row).toHaveCount(1)
    await expect(row.getByTestId('services-name')).toHaveText('Claude')
    await expect(row.getByTestId('services-provider')).toContainText('anthropic')
    await expect(row.getByTestId('services-printers')).toHaveText('Boxwood')
    await expect(row.getByTestId('services-status')).toHaveText('Active')
    await expect(row.getByTestId('services-times')).toContainText('Expires in 3 days')
    await expect(row.getByTestId('services-times')).toContainText('Last active 5 minutes ago')
    // What the client says its site is: text, not a link.
    await expect(row.getByTestId('services-client-uri')).toHaveText('https://claude.ai')
    await expect(row.locator('a')).toHaveCount(0)

    await row.getByTestId('services-revoke').click()
    const dialog = page.getByTestId('confirm')
    await expect(dialog.getByRole('heading')).toHaveText('Revoke Claude?')
    await dialog.getByTestId('confirm-ok').click()
    await expect.poll(() => agents.revoked).toEqual(['agt_1'])
    await expect(row.getByTestId('services-status')).toHaveText('Revoked')
    await expect(row.getByTestId('services-revoke')).toHaveCount(0)
    await expect(page.getByTestId('services-message')).toContainText('Claude is revoked.')
  })

  test('cancelling the confirm revokes nothing', async ({ page, open, account }) => {
    const agents = account.agents = agentsFake({
      connections: [{ agent: GPT, printers: [], expires_at: null, last_active_at: null, status: 'active', grant: null, client: null }]
    })
    await open('/account/apps')
    await page.getByTestId('services-revoke').click()
    await expect(page.getByTestId('confirm')).toContainText('Revoke ChatGPT?')
    await page.getByTestId('confirm-cancel').click()
    await expect(page.getByTestId('services-status')).toHaveText('Active')
    expect(agents.revoked).toEqual([])
  })

  test('a console without the agents API says so', async ({ page, open }) => {
    await open('/account/apps')
    await expect(page.getByTestId('services-missing')).toBeVisible()
  })
})
