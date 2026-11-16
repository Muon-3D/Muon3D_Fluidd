import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import AccountPrivacy from '../AccountPrivacy.vue'
import { AccountError } from '@/services/account/client'

const { requestExport, exportsList } = vi.hoisted(() => ({ requestExport: vi.fn(), exportsList: vi.fn() }))
const me = vi.hoisted(() => ({ value: null as unknown }))
vi.mock('@/services/account/state', () => ({ accountState: { get me () { return me.value } }, loadMe: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/account/api', () => ({ accountApi: { retention: async () => ({}), requestExport, exports: exportsList } }))
vi.mock('@/services/library/store', () => ({ libraryState: { usedBytes: 1.4e9 } }))
exportsList.mockResolvedValue([])

const dialog = { props: ['value', 'title'], template: '<div v-if="value" class="dialog"><h2>{{ title }}</h2><slot/><slot name="actions"/></div>' }
const mount_ = () => mount(AccountPrivacy, {
  propsData: { linkTo: (id: string) => '/account/' + id },
  stubs: { 'router-link': true, 'frame-icon': true, 'reauth-dialog': true, M3Dialog: dialog, 'm3-dialog': dialog },
  mocks: { $route: { query: {} } }
})
const tick = () => new Promise(resolve => setTimeout(resolve))
const tid = (w: ReturnType<typeof mount_>, id: string) => w.find(`[data-tid="${id}"]`)
afterEach(() => { vi.clearAllMocks(); exportsList.mockReset(); exportsList.mockResolvedValue([]); me.value = null })

const through = async (w: ReturnType<typeof mount_>) => {
  await tid(w, 'privacy-request').trigger('click')
  await tid(w, 'privacy-continue').trigger('click')
  await tid(w, 'privacy-send').trigger('click')
  await tick(); await tick()
}

describe('Your data: a copy is a request, not a download (Jack, 6 Nov)', () => {
  it('has no instant download: no Download, Email me a copy or Library .tar', () => {
    const w = mount_()
    expect(w.text()).not.toMatch(/Download Library|Email me a copy|\.tar/)
    expect(tid(w, 'privacy-download').exists()).toBe(false)
    expect(tid(w, 'privacy-library-download').exists()).toBe(false)
    expect(tid(w, 'privacy-request').text()).toBe('Request…')
    w.destroy()
  })

  it('lets row labels shrink inside the flex layout', () => {
    const accountStyles = readFileSync(`${process.cwd()}/src/scss/muon3d-account.scss`, 'utf8')
    expect(accountStyles).toMatch(/\.acct-row__label\s*\{[\s\S]*?min-width:\s*0;/)
  })

  it('asks what to include and the format, then checks it is you, then files the request', async () => {
    requestExport.mockResolvedValue({ id: 'e1', status: 'queued', requested_at: Math.floor(Date.now() / 1000) })
    me.value = { account: { email: 'jack@muon3d.com', two_step: true }, sign_in: { two_step: true } }
    const w = mount_(); await tick()
    await tid(w, 'privacy-request').trigger('click')
    expect(w.find('.dialog h2').text()).toBe('Request a copy of your data')
    expect(w.text()).toContain('Nothing downloads now.')
    expect(w.text()).toContain('about 1.4 GB')
    await tid(w, 'privacy-part-history').setChecked(false)
    expect((tid(w, 'privacy-part-everything').element as HTMLInputElement).checked).toBe(false)
    await tid(w, 'privacy-format-json').setChecked(true)
    await tid(w, 'privacy-continue').trigger('click')
    expect(w.find('.dialog h2').text()).toBe("Confirm it's you")
    expect(w.text()).toContain('the code from your authenticator app')
    expect(w.text()).toContain("We'll also tell you by email")
    expect(tid(w, 'privacy-email-link-soon').exists()).toBe(false)
    await tid(w, 'privacy-send').trigger('click'); await tick(); await tick()
    expect(requestExport).toHaveBeenCalledWith({}, { parts: ['account', 'library'], format: 'json' })
    expect(w.find('.dialog').exists()).toBe(false)
    expect(tid(w, 'privacy-export-note').text()).toContain("We'll email jack@muon3d.com")
    expect(tid(w, 'privacy-request-e1').text()).toContain('Confirmed')
    expect(tid(w, 'privacy-request-e1').find('[data-tid="privacy-stages"]').text()).toMatch(/Requested\s+Confirmed\s+Gathering\s+Ready/)
    w.destroy()
  })

  it('says the email-link check is not available yet without two-step', async () => {
    me.value = { account: { email: 'a@b.c' }, sign_in: { two_step: false } }
    const w = mount_()
    await tid(w, 'privacy-request').trigger('click')
    await tid(w, 'privacy-continue').trigger('click')
    expect(tid(w, 'privacy-email-link-soon').text()).toContain('Not available yet')
    w.destroy()
  })

  it('cannot continue with nothing chosen', async () => {
    const w = mount_()
    await tid(w, 'privacy-request').trigger('click')
    await tid(w, 'privacy-part-everything').setChecked(false)
    expect(tid(w, 'privacy-continue').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('shows the open request instead of a second sheet: one at a time', async () => {
    exportsList.mockResolvedValue({ exports: [{ id: 'e1', status: 'building', requested_at: new Date(2026, 10, 3, 12).toISOString() }, { id: 'e0', status: 'expired', requested_at: 1 }] })
    const w = mount_(); await tick()
    await tid(w, 'privacy-request').trigger('click')
    expect(w.find('.dialog').exists()).toBe(false)
    expect(tid(w, 'privacy-export-note').text()).toContain('You already asked on 3 Nov')
    expect(tid(w, 'privacy-requests').text()).toContain('Requests · 2')
    expect(tid(w, 'privacy-request-e1').text()).toContain('Preparing')
    expect(tid(w, 'privacy-request-e0').text()).toContain('Expired')
    expect(tid(w, 'privacy-request-e1').classes()).toContain('priv__req--lit')
    w.destroy()
  })

  it('a ready copy says its link and that downloading here is not available yet', async () => {
    exportsList.mockResolvedValue([{ id: 'e2', status: 'ready', requested_at: 10, size_bytes: 1.5 * 1024 ** 3, expires_at: Math.floor(Date.now() / 1000) + 7 * 86400 }])
    const w = mount_(); await tick()
    expect(tid(w, 'privacy-request-e2').text()).toContain('link ends')
    expect(tid(w, 'privacy-download-soon').text()).toBe('Download: not available yet.')
    expect(w.find('a[download]').exists()).toBe(false)
    w.destroy()
  })

  it.each([
    [404, 'not available yet'],
    [409, 'already have a request open'],
    [429, 'once a day']
  ])('on %i says %s', async (status, words) => {
    requestExport.mockRejectedValue(new AccountError('x', status))
    const w = mount_(); await tick(); await through(w)
    expect(tid(w, 'privacy-export-note').text()).toContain(words)
    expect(w.find('[role="alert"]').exists()).toBe(false)
    w.destroy()
  })

  it('shows a real error otherwise, and still works when the list cannot be read', async () => {
    exportsList.mockRejectedValue(new AccountError('x', 500))
    requestExport.mockRejectedValue(new AccountError('The Muon3D service answered 500.', 500))
    const w = mount_(); await tick(); await through(w)
    expect(w.find('[role="alert"]').text()).toContain('answered 500')
    w.destroy()
  })

  it('says what we hold, and what is not included', () => {
    const w = mount_()
    const held = tid(w, 'privacy-held').text()
    expect(held).toContain('tokens (never the secret)')
    expect(held).toContain('Not included')
    expect(held).toContain('1.4 GB')
    w.destroy()
  })
})
