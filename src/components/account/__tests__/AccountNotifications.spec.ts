import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountError } from '@/services/account/client'

const api = vi.hoisted(() => ({ preferences: vi.fn(), setPreferences: vi.fn() }))
vi.mock('@/services/account/api', () => ({ accountApi: api }))
vi.mock('@/services/account/state', async (actual) => ({ ...(await actual<object>()), loadSessions: vi.fn(async () => {}) }))

// eslint-disable-next-line import/first
import AccountNotifications from '../AccountNotifications.vue'
// eslint-disable-next-line import/first
import { accountState } from '@/services/account/state'

const settle = () => new Promise(resolve => setTimeout(resolve))
const EMAIL = { email_access_requests: true, email_shared_with_you: false, email_community: false, email_news: false }

async function open (answer: Record<string, boolean> | Error = EMAIL) {
  api.preferences.mockImplementation(async () => { if (answer instanceof Error) throw answer; return { ...answer } })
  api.setPreferences.mockImplementation(async (patch: Record<string, boolean>) => ({ ...(answer as object), ...patch }))
  const w = mount(AccountNotifications, { stubs: { 'router-link': true } })
  await settle()
  return w
}

const cell = (w: ReturnType<typeof mount>, key: string) => w.find(`[data-tid="notify-${key}"]`)

describe('Notifications', () => {
  afterEach(() => {
    vi.clearAllMocks()
    accountState.sessions = null
  })

  it('lists the four print alerts with Phone, Email and Bell columns, in the storyboard\'s words', async () => {
    const w = await open()
    expect(w.find('h1').text()).toBe('Notifications')
    expect(w.text()).toContain('What we tell you, and where: your phone, email, or Control\'s bell')
    expect(w.findAll('.note__hd .note__c').wrappers.map(c => c.text())).toEqual(['Phone', 'Email', 'Bell'])
    const rows = w.findAll('[data-tid^="notify-row-"] .acct-grow__text b').wrappers.map(b => b.text())
    expect(rows).toEqual(['A print finished', 'A print failed or stopped', 'Paused, needs you', 'An update is ready'])
    for (const title of ['People and access', 'From Muon3D']) expect(w.text()).toContain(title)
    expect(w.find('[data-tid="notify-security"]').text()).toBe('Always')
    expect(w.text()).toContain('Always on.')
    w.destroy()
  })

  it('disables every print cell the console has no key for, as coming soon, and shows none as on', async () => {
    const w = await open()
    const cells = w.findAll('[data-tid^="notify-row-"] [role="switch"]').wrappers
    expect(cells).toHaveLength(12)
    for (const c of cells) {
      expect(c.attributes('disabled')).toBe('disabled')
      expect(c.attributes('aria-checked')).toBe('false')
      expect(c.attributes('aria-label')).toContain('(coming soon)')
    }
    expect(w.find('[data-tid="notify-grid-soon"]').text()).toContain('Coming soon')
    await cells[0].trigger('click')
    expect(api.setPreferences).not.toHaveBeenCalled()
    w.destroy()
  })

  it('saves a sharing alert under its console key and shows what the console answered', async () => {
    const w = await open()
    expect(cell(w, 'email_shared_with_you').attributes('aria-checked')).toBe('false')
    await cell(w, 'email_shared_with_you').trigger('click')
    await settle()
    expect(api.setPreferences).toHaveBeenCalledWith({ email_shared_with_you: true })
    expect(cell(w, 'email_shared_with_you').attributes('aria-checked')).toBe('true')
    await cell(w, 'email_news').trigger('click')
    await settle()
    expect(api.setPreferences).toHaveBeenLastCalledWith({ email_news: true })
    w.destroy()
  })

  it('turns a print cell on once the console holds its key', async () => {
    const w = await open({ ...EMAIL, email_print_failed: false })
    expect(cell(w, 'email_print_failed').attributes('disabled')).toBeUndefined()
    expect(cell(w, 'push_print_failed').attributes('disabled')).toBe('disabled')
    expect(w.find('[data-tid="notify-grid-soon"]').exists()).toBe(false)
    await cell(w, 'email_print_failed').trigger('click')
    expect(api.setPreferences).toHaveBeenCalledWith({ email_print_failed: true })
    w.destroy()
  })

  it('keeps "Email choices come soon" when the console has no preferences, with every switch off limits', async () => {
    const w = await open(new AccountError('Not Found', 404))
    expect(w.find('[data-tid="notify-soon"]').text()).toContain('Email choices come soon')
    for (const c of w.findAll('[role="switch"]').wrappers) expect(c.attributes('disabled')).toBe('disabled')
    expect(cell(w, 'email_access_requests').attributes('aria-checked')).toBe('true')
    expect(w.find('[role="alert"]').exists()).toBe(false)
    w.destroy()
  })

  it('names the phones that get alerts, from the signed-in devices', async () => {
    accountState.sessions = [{ id: 's1', device: 'iPhone', device_label: 'Jack\'s iPhone', endpoint_id: null, kind: 'rotating', client_id: null, created_at: 1, last_used_at: 1, expires_at: 2, current: false }]
    const w = await open()
    expect(w.find('[data-tid="notify-phones"]').text()).toContain('Phone alerts go to the Muon3D app on Jack\'s iPhone.')
    w.destroy()
  })
})
