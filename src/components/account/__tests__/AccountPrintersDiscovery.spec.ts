import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPrinters from '../AccountPrinters.vue'
import { cloudState } from '@/services/muon-cloud/state'

vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return { cloudState: Vue.observable({ printers: [], status: {} }), refreshPrinters: async () => {} }
})
vi.mock('@/services/account/state', () => ({ accountState: { approvals: [] }, loadApprovals: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/printer-pages', () => ({ knownPrinters: () => [] }))

const base = { model: 'M1', version: 'mock', online: false, online_since: null, last_seen: 1, linked_at: 1 }
const settle = () => new Promise(resolve => setTimeout(resolve))
let puts: Array<{ url: string, body: any }> = []

function open (answer: { status: number, body: any } = { status: 200, body: { ok: true, level: 'chosen' } }) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: any) => {
    if (options.method === 'PUT' && String(url).endsWith('/discovery')) {
      puts.push({ url: String(url), body: JSON.parse(options.body) })
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    }
    return new Response(JSON.stringify({ shares: [], invites: [], links: [] }), { status: 200 })
  }))
  return mount(AccountPrinters, {
    propsData: { linkTo: (id: string) => '/account/' + id },
    stubs: {
      M3Dialog: true,
      'router-link': { template: '<a><slot /></a>' },
      'frame-icon': true,
      PrinterThumb: true,
      LinkPrinterDialog: true
    }
  })
}

describe('shared-by icon', () => {
  afterEach(() => { vi.unstubAllGlobals(); puts = [] })
  it('marks a shared printer with a "Shared by <name>" icon', async () => {
    cloudState.printers = [{ id: 'p2', name: 'Lab M1', ...base, shared: true, role: 'viewer', shared_by: 'Ada', sharer: { account_id: 'a1', display_name: 'Ada' } }] as any
    const w = open()
    await settle()
    const icon = w.find('[data-tid="shared-by-icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-label')).toBe('Shared by Ada')
    expect(icon.attributes('title')).toBe('Shared by Ada')
    w.destroy()
  })
  it('uses the structured sharer name when present and shows nothing on an owned printer', async () => {
    cloudState.printers = [
      { id: 'p1', name: 'Mine', ...base, shared: false, role: 'operator', discovery: 'open' },
      { id: 'p2', name: 'Lab M1', ...base, shared: true, role: 'viewer', shared_by: 'old string', sharer: { account_id: 'a1', display_name: 'Grace' } }
    ] as any
    const w = open()
    await settle()
    expect(w.findAll('[data-tid="shared-by-icon"]')).toHaveLength(1)
    expect(w.find('[data-tid="shared-by-icon"]').attributes('aria-label')).toBe('Shared by Grace')
    expect(w.find('[data-tid="printers-owned"]').find('[data-tid="shared-by-icon"]').exists()).toBe(false)
    w.destroy()
  })
})

describe('discovery setting', () => {
  afterEach(() => { vi.unstubAllGlobals(); puts = [] })
  it('is offered to the owner only, with a plain-words explanation of the current level', async () => {
    cloudState.printers = [
      { id: 'p1', name: 'Mine', ...base, shared: false, role: 'operator', discovery: 'signed_in' },
      { id: 'p2', name: 'Lab M1', ...base, shared: true, role: 'operator', shared_by: 'Ada' }
    ] as any
    const w = open()
    await settle()
    expect(w.findAll('[data-tid="discovery-select"]')).toHaveLength(1)
    const owned = w.find('[data-tid="printers-owned"]')
    expect((owned.find('[data-tid="discovery-select"]').element as HTMLSelectElement).value).toBe('signed_in')
    expect(owned.find('[data-tid="discovery-help"]').text()).toContain('signed in')
    expect(w.find('[data-tid="printers-shared"]').find('[data-tid="discovery-select"]').exists()).toBe(false)
    w.destroy()
  })
  it('has all four levels in plain words', async () => {
    cloudState.printers = [{ id: 'p1', name: 'Mine', ...base, shared: false, role: 'operator', discovery: 'open' }] as any
    const w = open()
    await settle()
    const values = w.findAll('[data-tid="discovery-select"] option').wrappers.map(o => (o.element as HTMLOptionElement).value)
    expect(values).toEqual(['open', 'signed_in', 'chosen', 'link'])
    w.destroy()
  })
  it('saves through the console and shows the level the server confirms', async () => {
    cloudState.printers = [{ id: 'p1', name: 'Mine', ...base, shared: false, role: 'operator', discovery: 'open' }] as any
    const w = open()
    await settle()
    const select = w.find('[data-tid="discovery-select"]')
    ;(select.element as HTMLSelectElement).value = 'chosen'
    await select.trigger('change')
    await settle()
    expect(puts).toEqual([{ url: expect.stringMatching(/\/v1\/printers\/p1\/discovery$/), body: { level: 'chosen' } }])
    expect((cloudState.printers[0] as any).discovery).toBe('chosen')
    expect(w.text()).toContain('Saved')
    w.destroy()
  })
  it('shows the server refusal and keeps the old level', async () => {
    cloudState.printers = [{ id: 'p1', name: 'Mine', ...base, shared: false, role: 'operator', discovery: 'open' }] as any
    const w = open({ status: 404, body: { error: 'no such printer' } })
    await settle()
    const select = w.find('[data-tid="discovery-select"]')
    ;(select.element as HTMLSelectElement).value = 'link'
    await select.trigger('change')
    await settle()
    expect((cloudState.printers[0] as any).discovery).toBe('open')
    expect((select.element as HTMLSelectElement).value).toBe('open')
    expect(w.text()).toContain('no such printer')
    expect(w.text()).not.toContain('Saved')
    w.destroy()
  })
})
