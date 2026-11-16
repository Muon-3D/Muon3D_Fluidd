import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountPlan from '../AccountPlan.vue'
import { CREDITS_CATALOGUE, catalogue, setCatalogue } from '@/services/account/credits-catalogue'
import { SERVICE_CATALOGUE } from '@/services/account/__tests__/catalogue-fixture'
import { LibraryError } from '@/services/library/api'
import type { CreditAccount } from '@/services/account/credits'
import { libraryState, resetLibrary } from '@/services/library/store'

const loadCredits = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))

vi.mock('@/services/account/api', () => ({ accountApi: { plan: async () => ({ plan: { name: 'Plus' } }) } }))
vi.mock('@/services/library/store', async (actual) => ({ ...(await actual<object>()), watchLibraryAccount: vi.fn(), refreshLibrary: vi.fn(async () => {}) }))

const settle = () => new Promise(resolve => setTimeout(resolve))
const monday = new Date(2026, 10, 2, 9).getTime()

const plus: CreditAccount = {
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 286,
  monthly: { left: 236, allowance: 400 },
  packs: 0,
  weekly: { used: 34, limit: 100, resets: monday },
  usage: { shape: { credits: 40, count: 2 }, part: { credits: 32, count: 8 }, scan: { credits: 0, count: 0 } },
  history: [
    { id: '9', at: Date.now() - 3600_000, kind: 'shape', title: 'Low-poly fox planter', change: -20 },
    { id: '8', at: Date.now() - 7200_000, kind: 'refund', title: 'Chess knight, refunded', change: 20 },
    { id: '4', at: Date.now() - 18 * 86400_000, kind: 'pack', title: '100 credits', change: 100 }
  ],
  jobsAtOnce: 2
}

async function open (answer: CreditAccount | Error) {
  loadCredits.mockImplementation(async () => { if (answer instanceof Error) throw answer; return answer })
  const w = mount(AccountPlan, { stubs: { 'frame-icon': true } })
  await settle()
  return w
}

const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')

describe('Plan, once payments open', () => {
  beforeEach(() => {
    setCatalogue(SERVICE_CATALOGUE)
    CREDITS_CATALOGUE.paymentsOpen = true
  })
  afterEach(() => {
    CREDITS_CATALOGUE.paymentsOpen = false
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('leads with how much of the week is used and when it resets, then the plans', async () => {
    const w = await open(plus)
    const usage = text(w.find('[data-tid="plan-usage"]'))
    expect(usage).toContain('This week')
    expect(usage).toContain('34% of this week\'s limit used')
    expect(usage).toContain('Resets Mon 2 Nov')
    // The service counts what was made a month at a time, whatever the limit's window.
    expect(usage).toContain('2 shapes and 8 parts this month')
    expect(w.find('[data-tid="plan-current"]').text()).toBe('Plus · monthly')
    expect(w.find('[data-tid="plan-limit-note"]').exists()).toBe(false)
    // No list of what credits buy up front: the plans come first, prices per job sit behind (i).
    const headings = w.findAll('h2').wrappers.map(h => h.text())
    expect(headings).toEqual(['This week', 'Plans', 'Credits', 'History'])
    expect(w.text()).not.toContain('What credits buy')
    w.destroy()
  })

  it('names the service\'s monthly allowance as a month until it sends a week', async () => {
    const w = await open({ ...plus, weekly: undefined })
    const usage = text(w.find('[data-tid="plan-usage"]'))
    expect(usage).toContain('This month')
    expect(usage).toContain('41% of this month\'s limit used')
    expect(usage).not.toContain('week')
    // The account's own plan shows what the service grants it, a month at a time.
    const own = w.findAll('[data-tid="plan-option-plus"] [data-tid="plan-row"]').at(0)
    expect(own.find('dt').text()).toBe('Each month')
    expect(own.find('dd').text()).toBe('400 credits')
    w.destroy()
  })

  it('says when a plan that won\'t renew ends, not that it resets', async () => {
    const w = await open({ ...plus, weekly: undefined, willRenew: false })
    expect(text(w.find('[data-tid="plan-usage"]'))).toContain('Plan ends Mon 9 Nov')
    expect(w.text()).not.toContain('Resets')
    w.destroy()
  })

  it('shows the plans side by side, with the same rows and only what costs us to run', async () => {
    const w = await open(plus)
    const rows = (id: string) => w.findAll(`[data-tid="plan-option-${id}"] [data-tid="plan-row"]`).wrappers
      .map(r => `${r.find('dt').text()}: ${r.find('dd').text().replace(/\s+/g, ' ').trim()}`)
    expect(rows('free')).toEqual(['CAD in your browser: Unlimited', 'AI made, each week: 1 AI shape or 5 AI parts', 'Jobs at once: 1', 'Priority queue: —Not included', 'High detail shapes: —Not included'])
    expect(rows('plus')).toEqual(['CAD in your browser: Unlimited', 'AI made, each week: 5 AI shapes or 25 AI parts', 'Jobs at once: 2', 'Priority queue: Included', 'High detail shapes: —Not included'])
    expect(rows('pro')).toEqual(['CAD in your browser: Unlimited', 'AI made, each week: 15 AI shapes or 75 AI parts', 'Jobs at once: 4', 'Priority queue: Included', 'High detail shapes: Included'])
    for (const plan of catalogue.plans) {
      const card = text(w.find(`[data-tid="plan-option-${plan.id}"]`))
      if (plan.price) expect(card).toContain(`£${plan.price.monthly.toFixed(2)}`)
      for (const free of CREDITS_CATALOGUE.free) expect(card).not.toContain(free)
    }
    const free = text(w.find('[data-tid="plan-free"]'))
    for (const item of CREDITS_CATALOGUE.free) expect(free).toContain(item)
    expect(w.find('[data-tid="plan-option-plus"]').text()).toContain('Current')
    w.destroy()
  })

  it('says when the limit is nearly used, and when it resets', async () => {
    const w = await open({ ...plus, weekly: { used: 85, limit: 100, resets: monday } })
    const note = text(w.find('[data-tid="plan-limit-note"]'))
    expect(note).toContain('85% of this week\'s limit used.')
    expect(note).toContain('Resets Mon 2 Nov.')
    expect(note).not.toMatch(/printer/i)
    expect(w.find('[data-tid="plan-note-credits"]').exists()).toBe(false)
    w.destroy()
  })

  it('at the limit, says when it resets and offers credits without pushing them', async () => {
    const w = await open({ ...plus, weekly: { used: 100, limit: 100, resets: monday } })
    const note = text(w.find('[data-tid="plan-limit-note"]'))
    expect(note).toContain('You\'ve reached this week\'s limit.')
    expect(note).toContain('Resets Mon 2 Nov.')
    expect(w.find('[data-tid="plan-note-credits"]').text()).toBe('Buy credits')
    w.destroy()
  })

  it('at the limit with bought credits, says they carry on until the reset', async () => {
    const w = await open({ ...plus, packs: 120, weekly: { used: 100, limit: 100, resets: monday } })
    expect(text(w.find('[data-tid="plan-limit-note"]'))).toContain('Your 120 credits are in use until then.')
    expect(w.find('[data-tid="plan-note-credits"]').exists()).toBe(false)
    expect(text(w.find('[data-tid="plan-topup"]'))).toBe('120 credits for after your limit')
    w.destroy()
  })

  it('says nothing about limits when the plan includes no usage (production Free today)', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, weekly: undefined, monthly: { left: 0, allowance: 0 }, packs: 0, history: [] })
    expect(w.find('[data-tid="plan-limit-note"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-usage-line"]').text()).toBe('No usage included on your plan yet.')
    expect(w.find('.plan-meter').exists()).toBe(false)
    expect(w.find('[data-tid="plan-option-free"]').text()).toContain('Current')
    expect(w.findAll('[data-tid="plan-option-free"] dd').at(0).text()).toBe('None yet')
    w.destroy()
  })

  it('keeps credits as a top-up: never expiring, priced per credit, with job prices behind (i)', async () => {
    const w = await open(plus)
    for (const pack of catalogue.packs) expect(text(w.find(`[data-tid="plan-pack-${pack.credits}"]`))).toContain(`£${pack.price.toFixed(2)}`)
    expect(text(w.find('[data-tid="plan-pack-100"]'))).toContain('About 5 AI shapes or 25 AI parts')
    await w.find('[data-tid="plan-credits"] [data-tid="acct-more"]').trigger('click')
    const more = text(w.find('[data-tid="plan-credits"] [role="note"]'))
    expect(more).toContain('only used once you reach your plan\'s limit')
    expect(more).toContain('A part uses 4 credits, a shape 20 and a scan 30')
    w.destroy()
  })

  it('takes every number from the model service\'s catalogue', async () => {
    setCatalogue({ ...SERVICE_CATALOGUE, plans: SERVICE_CATALOGUE.plans.map(p => p.id === 'plus' ? { ...p, weeklyLimit: 200, price: { monthly: 8.99, yearly: 89.99 } } : p) })
    const w = await open(plus)
    const card = text(w.find('[data-tid="plan-option-plus"]'))
    expect(card).toContain('£8.99')
    expect(card).toContain('10 AI shapes or 50 AI parts')
    w.destroy()
  })

  it('says so when the catalogue can\'t be read, and invents no plans', async () => {
    catalogue.plans = []
    catalogue.packs = []
    catalogue.costs = []
    const fetcher = vi.fn(async () => new Response('', { status: 503 }))
    vi.stubGlobal('fetch', fetcher)
    const w = await open(plus)
    expect((fetcher.mock.calls[0] as unknown as [string])[0]).toMatch(/\/v1\/create\/catalogue$/)
    expect(w.find('[data-tid="plan-catalogue-missing"]').text()).toContain('Plans can\'t be read from the model service')
    expect(w.findAll('[data-tid^="plan-option-"]').length).toBe(0)
    expect(w.findAll('[data-tid^="plan-pack-"]').length).toBe(0)
    // The account's own usage still shows.
    expect(text(w.find('[data-tid="plan-usage"]'))).toContain('34% of this week\'s limit used')
    w.destroy()
  })

  it('shows refunds and purchases in the history, signed', async () => {
    const w = await open(plus)
    const history = text(w.find('[data-tid="plan-history"]'))
    expect(history).toContain('Low-poly fox planter')
    expect(history).toContain('−20')
    expect(history).toContain('Chess knight, refunded')
    expect(history).toContain('+100')
    w.destroy()
  })

  it('shows the plans from the catalogue, with nothing marked current, when there is no usage to read', async () => {
    const w = await open(new LibraryError('create_unavailable', 'no', 503))
    expect(w.find('[data-tid="plan-usage"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-unavailable"]').text()).toContain('Your usage shows here once Create opens.')
    for (const plan of catalogue.plans) expect(w.find(`[data-tid="plan-option-${plan.id}"]`).exists()).toBe(true)
    expect(w.find('[data-tid="plan-current"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Current')
    w.destroy()
  })

  it('says why the usage is missing', async () => {
    const line = async (error: Error) => {
      const w = await open(error)
      const said = w.find('[data-tid="plan-unavailable"]').text()
      w.destroy()
      return said
    }
    expect(await line(new LibraryError('not-signed-in', 'no', 401))).toBe('Sign in again to see your usage.')
    expect(await line(new LibraryError('consent_required', 'no', 403))).toContain('Turn on Muon3D models')
    expect(await line(new LibraryError('internal', 'no', 500))).toBe('Your usage didn\'t load. Try again later.')
  })

  it('shows nothing from the account until the service answers', async () => {
    loadCredits.mockImplementation(() => new Promise(() => {}))
    const w = mount(AccountPlan, { stubs: { 'frame-icon': true } })
    await settle()
    expect(w.find('[data-tid="plan-reading"]').text()).toBe('Reading your plan…')
    expect(w.find('[data-tid="plan-option-free"]').exists()).toBe(false)
    w.destroy()
  })

  it('switches to yearly prices with the saving in months', async () => {
    const w = await open(plus)
    await w.find('[data-tid="plan-period-yearly"]').trigger('click')
    expect(w.find('[data-tid="plan-option-plus"] .plan-option__price').text().replace(/\s+/g, ' ')).toBe('£79.99 a year')
    expect(text(w.find('[data-tid="plan-option-plus"]'))).toContain('2 months free')
    expect(w.find('[data-tid="plan-period-yearly"]').attributes('aria-pressed')).toBe('true')
    w.destroy()
  })
})

describe('Plan while payments are closed', () => {
  beforeEach(() => {
    setCatalogue(SERVICE_CATALOGUE)
    resetLibrary('fixture')
    Object.assign(libraryState, { checked: true, enabled: true, usedBytes: 1.2e9, quotaBytes: 5e9 })
  })
  afterEach(() => { vi.clearAllMocks() })

  it('shows the plan and what it includes, and says nothing can charge you', async () => {
    expect(CREDITS_CATALOGUE.paymentsOpen).toBe(false)
    const w = await open(plus)
    expect(w.find('[data-tid="plan-tile-name"]').text()).toBe('Plus')
    const row = (id: string) => w.findAll(`[data-tid="plan-tile-${id}"] b, [data-tid="plan-tile-${id}"] .acct-grow__value`).wrappers.map(x => x.text())
    expect(row('printers')).toEqual(['Printers', 'Unlimited'])
    expect(row('storage')).toEqual(['Library storage', '1.2 GB of 5 GB'])
    expect(w.find('[data-tid="plan-closed"]').text()).toBe('Paid plans open soon. Nothing here can charge you yet.')
    w.destroy()
  })

  it('has no button to change plan, choose a plan or buy credits, even at the limit', async () => {
    const w = await open({ ...plus, weekly: { used: 100, limit: 100, resets: monday } })
    expect(w.find('[data-tid="plan-usage"]').exists()).toBe(true)
    expect(w.findAll('[data-tid="plan-change"], [data-tid="plan-note-credits"], [data-tid^="plan-choose-"], [data-tid="plan-credits"], #plan-plans').length).toBe(0)
    expect(text(w)).not.toMatch(/Change plan|Choose |Buy credits/)
    w.destroy()
  })

  it('leaves the storage row out until the Library says how much it holds', async () => {
    libraryState.usedBytes = null
    const w = await open(plus)
    expect(w.find('[data-tid="plan-tile-storage"]').exists()).toBe(false)
    w.destroy()
  })
})
