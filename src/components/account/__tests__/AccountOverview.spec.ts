import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountOverview from '../AccountOverview.vue'
import type { CreditAccount } from '@/services/account/credits'
import { cloudState } from '@/services/muon-cloud/state'
import { accountState } from '@/services/account/state'

const loadCredits = vi.hoisted(() => vi.fn((): Promise<unknown> => new Promise(() => {})))
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))
vi.mock('@/services/account/state', async (actual) => ({ ...(await actual<object>()), loadOverview: vi.fn() }))
vi.mock('@/services/library/store', async (actual) => ({
  ...(await actual<object>()),
  refreshLibrary: vi.fn(async () => {}),
  watchLibraryAccount: vi.fn()
}))

const settle = () => new Promise(resolve => setTimeout(resolve))

const reached: CreditAccount = {
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 0,
  monthly: { left: 0, allowance: 400 },
  packs: 0,
  weekly: { used: 100, limit: 100, resets: new Date(2026, 10, 2, 9).getTime() },
  usage: { shape: { credits: 100, count: 5 }, part: { credits: 0, count: 0 }, scan: { credits: 0, count: 0 } },
  history: [],
  jobsAtOnce: 2
}

const overview = () => mount(AccountOverview, {
  propsData: { linkTo: (id: string) => `/account/${id}` },
  stubs: { 'frame-icon': true, 'printer-thumb': true, 'router-link': { template: '<a><slot /></a>' } }
})

const tile = (w: ReturnType<typeof overview>) => w.find('[data-tid="account-tile-plan"]').text().replace(/\s+/g, ' ')

describe('the Overview plan tile', () => {
  afterEach(() => {
    loadCredits.mockImplementation(() => new Promise(() => {}))
    vi.clearAllMocks()
  })

  it('reads the plan, and promises free printer features until it answers', () => {
    const w = overview()
    expect(loadCredits).toHaveBeenCalledTimes(1)
    expect(tile(w)).toContain('Plan and credits')
    expect(tile(w)).toContain('Printer features are always free')
    expect(tile(w)).not.toContain('Limit reached')
    w.destroy()
  })

  it('shows the week\'s use and flags a reached limit', async () => {
    loadCredits.mockImplementation(async () => reached)
    const w = overview()
    await settle()
    expect(tile(w)).toContain('Plus plan')
    expect(tile(w)).toContain('100% of this week\'s limit used · Resets Mon 2 Nov')
    expect(tile(w)).toContain('Limit reached')
    w.destroy()
  })
})

describe('the Overview cards', () => {
  afterEach(() => {
    cloudState.printers = []
    accountState.me = null
    accountState.sessions = null
    accountState.approvals = null
  })

  it('give one value each, not sentences', async () => {
    cloudState.printers = [
      { id: 'p1', name: 'Boxwood', online: true, shared: false },
      { id: 'p2', name: 'Gimlet', online: false, shared: true }
    ] as never
    accountState.me = { account: { id: 'a', email: 'a@b.c', name: 'A', created_at: 0, has_password: true, two_step: false }, sign_in: { password: true, passkeys: 0, identities: [], two_step: false } } as never
    const w = overview()
    await settle()
    const card = (id: string) => w.findAll(`[data-tid="account-tile-${id}"] span`).wrappers
      .filter(s => s.classes().some(c => /^ov-stat__(label|value|sub)$/.test(c)))
      .map(s => s.text().replace(/\s+/g, ' '))
    expect(card('security')).toEqual(['Security', 'Password only', 'Add a passkey or two-step'])
    expect(card('printers')).toEqual(['Printers', '2', '1 shared with you'])
    expect(card('sessions')).toEqual(['Devices', 'Reading…'])
    w.destroy()
  })
})
