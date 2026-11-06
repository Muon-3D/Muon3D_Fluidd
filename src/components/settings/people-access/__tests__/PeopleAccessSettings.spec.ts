import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

const access = vi.hoisted(() => ({
  state: null as any,
  capabilities: {} as Record<string, string>,
  fail: null as Error | null,
  /** While set, get() waits for it: a slow answer. */
  gate: null as Promise<void> | null,
  setEntry: vi.fn(async () => true),
  setData: vi.fn(async () => true),
  setPrivateUploads: vi.fn(async () => true)
}))

const cloud = vi.hoisted(() => ({ account: null as any, printers: [] as any[], activePrinterId: null as string | null, status: {} }))
const account = vi.hoisted(() => ({ approvals: [] as any[] }))
const api = vi.hoisted(() => ({
  shares: vi.fn(async () => ({ shares: [] as any[] })),
  invites: vi.fn(async () => ({ invites: [] as any[] })),
  links: vi.fn(async () => ({ links: [] as any[] })),
  share: vi.fn(async () => ({})),
  removeShare: vi.fn(async () => ({ ok: true })),
  sendInvite: vi.fn(async () => ({})),
  withdrawInvite: vi.fn(async () => ({ ok: true })),
  revokeLink: vi.fn(async () => ({ ok: true })),
  answerApproval: vi.fn(async () => ({}))
}))
const unlinkPrinter = vi.hoisted(() => vi.fn(async () => ({})))

vi.mock('@/services/muon-access/api', () => ({
  currentPrinterAccess: () => ({
    get: async () => {
      const gate = access.gate
      const fail = access.fail
      const state = access.state
      if (gate) await gate
      if (fail) throw fail
      return state
    },
    capabilities: async () => { if (access.fail) throw access.fail; return access.capabilities },
    setEntry: access.setEntry,
    setData: access.setData,
    setPrivateUploads: access.setPrivateUploads
  })
}))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: cloud, refreshPrinters: async () => {} }))
vi.mock('@/services/muon-cloud/api', () => ({ cloudApi: { unlinkPrinter } }))
vi.mock('@/services/muon-cloud/origin', () => ({ isManagedApiUrl: () => false }))
vi.mock('@/services/muon-ble/link', () => ({ remoteRouteLabel: () => 'Through Muon3D' }))
vi.mock('@/services/account/api', () => ({ accountApi: api }))
vi.mock('@/services/account/client', () => ({ isMissing: () => false }))
vi.mock('@/services/account/state', () => ({ accountState: account, loadApprovals: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: { enabled: false } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'boxwood-367a' }))

// eslint-disable-next-line import/first
import PeopleAccessSettings from '../PeopleAccessSettings.vue'

const API = 'http://boxwood.local'
const settle = () => new Promise(resolve => setTimeout(resolve))

const printerState = (role: 'operator' | 'viewer', over: Record<string, unknown> = {}, level = 'member') => ({
  owner: { kind: 'account', email: 'jack@example.test', name: 'Jack Smith' },
  entry: 'protected',
  you: { level, role, trusted: false, principal: 'you' },
  ways: { email: { on: true }, link: { on: true }, password: { on: false }, approve: { on: true } },
  privateUploads: false,
  dataMode: 'shared',
  levelsPreset: 'standard',
  ...over
})

let confirmAnswer = true
const $confirm = vi.fn(async () => confirmAnswer)

function open (components: string[] = ['authorization', 'muon_access']) {
  const store = {
    state: Vue.observable({ config: { apiUrl: API, instances: [{ apiUrl: API, endpointId: 'prn-1', name: 'Boxwood', active: true }] } }),
    getters: {
      'config/getDisplayName': 'Boxwood',
      'server/componentSupport': (name: string) => components.includes(name),
      'auth/getUsers': [],
      'auth/getCurrentUser': null
    },
    dispatch: vi.fn()
  }
  return mount(PeopleAccessSettings, {
    mocks: { $store: store, $confirm },
    stubs: {
      'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
      'frame-icon': true,
      M3Dialog: { props: ['value', 'title'], template: '<div v-if="value" data-dialog><h2>{{ title }}</h2><slot /><slot name="actions" /></div>' },
      ToggleSwitch: { props: ['value'], template: '<button data-toggle @click="$emit(\'input\', !value)" />' },
      ApiKeyDialog: true
    }
  })
}

const asOwner = () => {
  access.state = printerState('operator', {}, 'admin')
  access.capabilities = { protection: 'allowed' }
  cloud.account = { id: 'a1', email: 'jack@example.test', name: 'Jack Smith' }
  cloud.printers = [{ id: 'prn-1', name: 'Boxwood', shared: false, role: 'operator', online: true }]
}

const asMember = (role: 'operator' | 'viewer', over: Record<string, unknown> = {}) => {
  access.state = printerState(role)
  access.capabilities = { protection: 'refused' }
  cloud.account = { id: 'a2', email: 'harry@example.test', name: 'Harry' }
  cloud.printers = [{ id: 'prn-1', name: 'Boxwood', shared: true, role, online: true, share_id: 'share-harry', sharer: { account_id: 'a1', display_name: 'Jack Smith' }, ...over }]
}

const tids = (w: ReturnType<typeof open>) => w.findAll('[data-tid]').wrappers.map(x => x.attributes('data-tid'))

describe('People and access on the printer', () => {
  beforeEach(() => {
    confirmAnswer = true
    access.fail = null
    access.gate = null
    account.approvals = []
    cloud.activePrinterId = null
    Object.values(api).forEach(fn => fn.mockClear())
    api.shares.mockResolvedValue({ shares: [] })
    api.invites.mockResolvedValue({ invites: [] })
    api.links.mockResolvedValue({ links: [] })
    $confirm.mockClear()
    unlinkPrinter.mockClear()
  })
  afterEach(() => { vi.clearAllMocks() })

  it('shows the owner every group: people, entry rules, the role table, the older-tools key, developer mode and Unlink', async () => {
    asOwner()
    api.shares.mockResolvedValue({ shares: [{ id: 's1', printer_id: 'prn-1', email: 'harry@example.test', role: 'operator', ends_at: null, created_at: 1 }] })
    const w = open()
    await settle(); await settle()
    const seen = tids(w)
    for (const tid of ['pa-invite', 'pa-people', 'pa-devices', 'pa-entry', 'pa-roles', 'pa-older-tools', 'pa-developer', 'pa-unlink']) expect(seen).toContain(tid)
    expect(seen).not.toContain('pa-leave')
    expect(seen).not.toContain('pa-lock')
    expect(w.find('[data-tid="pa-you-role"]').text()).toContain('You: owner')
    expect(w.findAll('[data-tid="pa-person"]')).toHaveLength(1)
    expect(w.findAll('[data-role-row]')).toHaveLength(5)
    w.destroy()
  })

  it('hides every owner group from an operator, who sees the people read-only, what they can do, a link to their devices and Leave', async () => {
    asMember('operator')
    const w = open()
    await settle(); await settle()
    const seen = tids(w)
    for (const tid of ['pa-people-readonly', 'pa-can-do', 'pa-your-devices', 'pa-leave', 'pa-lock']) expect(seen).toContain(tid)
    for (const tid of ['pa-invite', 'pa-people', 'pa-waiting', 'pa-links', 'pa-devices', 'pa-entry', 'pa-roles', 'pa-older-tools', 'pa-developer', 'pa-unlink']) expect(seen).not.toContain(tid)
    // The console's owner-only lists are never even asked for.
    expect(api.shares).not.toHaveBeenCalled()
    expect(w.find('[data-tid="pa-your-devices-account"]').attributes('href')).toBe('/account/devices')
    w.destroy()
  })

  it('shows a viewer no list of people, their end date and who to ask', async () => {
    asMember('viewer', { ends_at: Math.floor(new Date(2026, 10, 30).getTime() / 1000) })
    const w = open()
    await settle(); await settle()
    const seen = tids(w)
    expect(seen).not.toContain('pa-people-readonly')
    expect(seen).not.toContain('pa-people')
    expect(w.find('[data-tid="pa-you-line"]').text()).toBe("You're a Viewer until 30 Nov")
    expect(w.find('[data-tid="pa-need-to-print"]').text()).toContain('Ask Jack')
    expect(w.find('[data-tid="pa-can-do"]').text()).toContain('Watch the camera and status')
    w.destroy()
  })

  it('shows "Only you so far" and hides empty Waiting and Invite links groups', async () => {
    asOwner()
    const w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-people-empty"]').text()).toContain('Only you so far')
    expect(w.find('[data-tid="pa-waiting"]').exists()).toBe(false)
    expect(w.find('[data-tid="pa-links"]').exists()).toBe(false)
    w.destroy()
  })

  it('removes a person only after the confirm, and sends nothing when it is cancelled', async () => {
    asOwner()
    api.shares.mockResolvedValue({ shares: [{ id: 's1', printer_id: 'prn-1', email: 'harry@example.test', role: 'operator', ends_at: null, created_at: 1 }] })
    const w = open()
    await settle(); await settle()
    confirmAnswer = false
    await w.find('[data-tid="pa-person-remove"]').trigger('click')
    await settle()
    expect($confirm).toHaveBeenCalledTimes(1)
    expect(api.removeShare).not.toHaveBeenCalled()
    confirmAnswer = true
    await w.find('[data-tid="pa-person-remove"]').trigger('click')
    await settle()
    expect(api.removeShare).toHaveBeenCalledWith('prn-1', 's1')
    w.destroy()
  })

  it('leaves only after the confirm, which says the owner cannot leave', async () => {
    asMember('operator')
    const w = open()
    await settle(); await settle()
    confirmAnswer = false
    await w.find('[data-tid="pa-leave-button"]').trigger('click')
    await settle()
    expect(api.removeShare).not.toHaveBeenCalled()
    expect(($confirm.mock.calls[0] as unknown[])[0]).toContain("The owner can't leave")
    confirmAnswer = true
    await w.find('[data-tid="pa-leave-button"]').trigger('click')
    await settle()
    expect(api.removeShare).toHaveBeenCalledWith('prn-1', 'share-harry')
    w.destroy()
  })

  it('says leaving is not available yet when the console gave no share to leave', async () => {
    asMember('operator', { share_id: undefined })
    const w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-leave-button"]').exists()).toBe(false)
    expect(w.find('[data-tid="pa-leave"]').text()).toContain("isn't available yet")
    w.destroy()
  })

  it('changes a role keeping its end date, and resends an invite as it was', async () => {
    asOwner()
    api.shares.mockResolvedValue({ shares: [{ id: 's1', printer_id: 'prn-1', email: 'harry@example.test', role: 'operator', ends_at: 1900000000, created_at: 1 }] })
    api.invites.mockResolvedValue({ invites: [{ id: 'i1', printer_id: 'prn-1', email: 'alex@example.test', role: 'viewer', ends_at: 1900000000, created_at: 1 }] })
    const w = open()
    await settle(); await settle()
    await w.find('[data-tid="pa-person-role"]').trigger('click')
    await w.find('[data-tid="pa-role-viewer"]').trigger('click')
    await w.find('[data-tid="pa-role-save"]').trigger('click')
    await settle()
    expect(api.share).toHaveBeenCalledWith('prn-1', 'harry@example.test', 'viewer', 1900000000)
    await w.find('[data-tid="pa-invite-resend"]').trigger('click')
    await settle()
    expect(api.sendInvite).toHaveBeenCalledWith('prn-1', 'alex@example.test', 'viewer', 1900000000)
    w.destroy()
  })

  it('lets in a join request for this printer only, as the role the link asked for', async () => {
    asOwner()
    account.approvals = [
      { id: 'ap1', kind: 'link_join', printer_id: 'prn-1', link_id: 'l1', role: 'viewer', state: 'pending', requester: { email: 'rui@example.test' }, created_at: 1, expires_at: 1900000000 },
      { id: 'ap2', kind: 'link_join', printer_id: 'other', link_id: 'l2', role: 'operator', state: 'pending', requester: { email: 'x@example.test' }, created_at: 1, expires_at: 1900000000 }
    ]
    const w = open()
    await settle(); await settle()
    const requests = w.findAll('[data-tid="pa-request"]')
    expect(requests).toHaveLength(1)
    expect(requests.at(0).text()).toContain('rui@example.test wants to join as Viewer')
    await w.find('[data-tid="pa-request-allow"]').trigger('click')
    await settle()
    expect(api.answerApproval).toHaveBeenCalledWith('ap1', true)
    w.destroy()
  })

  it('invites by email with Viewer as the default, and says making links is not available yet', async () => {
    asOwner()
    const w = open()
    await settle(); await settle()
    await w.find('[data-tid="pa-invite"]').trigger('click')
    expect(w.find('[data-tid="pa-invite-link-tab"]').attributes('disabled')).toBe('disabled')
    expect(w.find('[data-tid="pa-invite-viewer"]').attributes('aria-pressed')).toBe('true')
    await w.find('[data-tid="pa-invite-email"]').setValue('alex@example.test')
    await w.find('[data-tid="pa-invite-send"]').trigger('click')
    await settle()
    expect(api.share).toHaveBeenCalledWith('prn-1', 'alex@example.test', 'viewer', null)
    w.destroy()
  })

  it('shows developer mode as one row linking to its own section, with no switch of its own here', async () => {
    asOwner()
    const w = open()
    await settle(); await settle()
    const row = w.find('[data-tid="pa-developer"]')
    expect(row.attributes('href')).toBe('/boxwood-367a/settings#developer')
    expect(row.findAll('button')).toHaveLength(0)
    expect(w.text()).not.toMatch(/turn (it )?off|leave developer mode/i)
    w.destroy()
  })

  it('unlinks only after the confirm', async () => {
    asOwner()
    const w = open()
    await settle(); await settle()
    confirmAnswer = false
    await w.find('[data-tid="pa-unlink-button"]').trigger('click')
    await settle()
    expect(unlinkPrinter).not.toHaveBeenCalled()
    w.destroy()
  })

  it('falls back to the console when the printer refuses to say, and shows nothing when neither knows', async () => {
    access.fail = new Error('Asked from away')
    cloud.account = { id: 'a1', email: 'jack@example.test', name: 'Jack' }
    cloud.printers = [{ id: 'prn-1', name: 'Boxwood', shared: false, role: 'operator', online: true }]
    let w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-you-role"]').text()).toContain('owner')
    // Rules the printer didn't send aren't drawn.
    expect(w.find('[data-tid="pa-entry"]').exists()).toBe(false)
    w.destroy()
    cloud.account = null
    w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-unknown"]').text()).toContain('Asked from away')
    w.destroy()
  })

  it('changes the entry rule through the printer, the owner only', async () => {
    asOwner()
    const w = open()
    await settle(); await settle()
    await w.find('[data-tid="pa-entry-open"]').trigger('click')
    await settle()
    expect(access.setEntry).toHaveBeenCalledWith('open')
    w.destroy()
  })

  it('an admin-level caller who is not the owner (the panel, a paired client) gets no owner groups, even allowed to manage', async () => {
    access.state = printerState('operator', {}, 'admin')
    access.capabilities = { protection: 'allowed' }
    cloud.account = { id: 'a2', email: 'harry@example.test', name: 'Harry' }
    cloud.printers = []
    const w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-you-role"]').text()).toContain('operator')
    for (const tid of ['pa-entry', 'pa-roles', 'pa-older-tools', 'pa-developer', 'pa-people', 'pa-unlink']) expect(w.find(`[data-tid="${tid}"]`).exists()).toBe(false)
    w.destroy()
  })

  it("hides the printer's rules from the owner when the printer refuses to let this browser manage them", async () => {
    asOwner()
    access.capabilities = { protection: 'refused' }
    const w = open()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-you-role"]').text()).toContain('owner')
    for (const tid of ['pa-entry', 'pa-roles', 'pa-older-tools', 'pa-developer']) expect(w.find(`[data-tid="${tid}"]`).exists()).toBe(false)
    // The console's own owner groups still show: the console decides those.
    expect(w.find('[data-tid="pa-people"]').exists()).toBe(true)
    w.destroy()
  })

  it('ignores a late answer meant for the printer it has switched away from', async () => {
    asOwner()
    let release = () => {}
    access.gate = new Promise<void>(resolve => { release = resolve })
    const w = open()
    await settle()
    // Switch printers while the first answer is still on its way; the new one refuses.
    access.gate = null
    access.fail = new Error('The other printer refused (HTTP 403).')
    cloud.printers = []
    ;(w.vm.$store.state.config as { apiUrl: string }).apiUrl = 'http://walnut.local'
    await settle(); await settle()
    release()
    await settle(); await settle()
    expect(w.find('[data-tid="pa-entry"]').exists()).toBe(false)
    expect(w.find('[data-tid="pa-unknown"]').text()).toContain('The other printer refused')
    w.destroy()
  })

  it('has no Moonraker key group on a printer without authorization', async () => {
    asOwner()
    const w = open(['muon_access'])
    await settle(); await settle()
    expect(w.find('[data-tid="pa-older-tools"]').exists()).toBe(false)
    w.destroy()
  })
})

Vue.config.productionTip = false
