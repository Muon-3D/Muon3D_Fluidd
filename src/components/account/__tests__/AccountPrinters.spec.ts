import { mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPrinters from '../AccountPrinters.vue'
import { accountApi } from '@/services/account/api'
import { cloudState } from '@/services/muon-cloud/state'

vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return { cloudState: Vue.observable({ printers: [], status: {} }), refreshPrinters: async () => {} }
})
vi.mock('@/services/account/state', () => ({ accountState: { approvals: [] }, loadApprovals: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/printer-pages', () => ({
  knownPrinters: () => [{ kind: 'cloud', slug: 'boxwood-367a', printerId: 'p1' }, { kind: 'cloud', slug: 'walnut-8987', printerId: 'p2' }],
  printerPath: (slug: string, page = '') => page ? `/${slug}/${page}` : `/${slug}`
}))

const base = { model: 'M1', version: 'mock', online: false, online_since: null, last_seen: 1, linked_at: 1 }
const settle = () => new Promise(resolve => setTimeout(resolve))
let confirmAnswer = true
const $confirm = vi.fn(async () => confirmAnswer)
const router = new VueRouter()
const push = vi.spyOn(router, 'push').mockImplementation(async () => undefined as any)

function open () {
  return mount(AccountPrinters, {
    propsData: { linkTo: (id: string) => '/account/' + id },
    router,
    mocks: { $confirm },
    stubs: {
      M3Dialog: { props: ['value', 'title'], template: '<div v-if="value"><h2>{{ title }}</h2><slot /><slot name="actions" /></div>' },
      'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
      'frame-icon': true,
      PrinterThumb: true,
      LinkPrinterDialog: true,
      AcctMore: true
    }
  })
}

describe('Account › Printers and access', () => {
  afterEach(() => { $confirm.mockClear(); push.mockClear(); confirmAnswer = true })

  it('lists every printer with your role: yours first, then the shared ones', async () => {
    cloudState.printers = [
      { id: 'p2', name: 'Walnut', ...base, shared: true, role: 'operator', share_id: 'sh2', sharer: { account_id: 'a2', display_name: 'Harry C.' } },
      { id: 'p1', name: 'Boxwood', ...base, shared: false, role: 'operator' },
      { id: 'p3', name: 'Hazel', ...base, shared: true, role: 'viewer', share_id: 'sh3' }
    ] as any
    const w = open()
    await settle()
    const roles = w.findAll('[data-tid="printers-role"]').wrappers.map(r => r.text())
    expect(roles).toEqual(['Owner', 'Operator', 'Viewer'])
    expect(w.text()).toContain('Your printers · 3')
    w.destroy()
  })

  it("an owner's row goes to the printer's People and access; it has no Leave and no Unlink here", async () => {
    cloudState.printers = [{ id: 'p1', name: 'Boxwood', ...base, shared: false, role: 'operator' }] as any
    const w = open()
    await settle()
    const row = w.find('[data-tid="printers-owned"]')
    expect(row.find('[data-tid="printers-people"]').attributes('href')).toBe('/boxwood-367a/settings#access')
    expect(row.find('[data-tid="printers-leave"]').exists()).toBe(false)
    expect(row.text()).not.toContain('Unlink')
    w.destroy()
  })

  it("a member's row opens the printer and leaves only after the confirm", async () => {
    cloudState.printers = [{ id: 'p2', name: 'Walnut', ...base, shared: true, role: 'operator', share_id: 'sh2', sharer: { account_id: 'a2', display_name: 'Harry C.' } }] as any
    const removeShare = vi.spyOn(accountApi, 'removeShare').mockResolvedValue({ ok: true })
    const w = open()
    await settle()
    const row = w.find('[data-tid="printers-shared"]')
    expect(row.find('[data-tid="printers-open"]').attributes('href')).toBe('/walnut-8987')
    confirmAnswer = false
    await row.find('[data-tid="printers-leave"]').trigger('click')
    await settle()
    expect($confirm).toHaveBeenCalledTimes(1)
    expect(($confirm.mock.calls[0] as unknown[])[0]).toContain('Your files on it stay with Harry C.')
    expect(removeShare).not.toHaveBeenCalled()
    confirmAnswer = true
    await row.find('[data-tid="printers-leave"]').trigger('click')
    await settle()
    expect(removeShare).toHaveBeenCalledWith('p2', 'sh2')
    removeShare.mockRestore()
    w.destroy()
  })

  it('shows the empty state with Add a printer when there are no printers', async () => {
    cloudState.printers = [] as any
    const w = open()
    await settle()
    expect(w.find('[data-tid="printers-empty"]').text()).toContain('No printers yet')
    w.destroy()
  })

  it('links to Your devices and Apps and agents', async () => {
    cloudState.printers = [] as any
    const w = open()
    await settle()
    expect(w.find('[data-tid="printers-to-devices"]').attributes('href')).toBe('/account/sessions')
    expect(w.find('[data-tid="printers-to-apps"]').attributes('href')).toBe('/account/apps')
    w.destroy()
  })

  it('takes a join code to the join page, which asks before joining', async () => {
    cloudState.printers = [] as any
    const w = open()
    await settle()
    await w.find('[data-tid="printers-join"]').trigger('click')
    await w.find('[data-tid="join-code"]').setValue('7kq2m-x9p4d')
    await w.find('[data-tid="join-go"]').trigger('click')
    expect(push).toHaveBeenCalledTimes(1)
    expect((push.mock.calls[0] as unknown[])[0]).toMatchObject({ path: '/join' })
    w.destroy()
  })
})

describe('passkey rename', () => {
  afterEach(() => { vi.unstubAllGlobals() })
  it('renames a passkey with the confirmation the console requires', async () => {
    const requests: Array<{ url: string, body: any }> = []
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body) })
      return new Response(JSON.stringify({ id: 'key1', name: 'New name' }))
    }))
    await accountApi.renamePasskey('key1', 'New name', { password: 'test password', code: '123456' })
    expect(requests[0].body).toEqual({ name: 'New name', password: 'test password', code: '123456' })
  })
})
