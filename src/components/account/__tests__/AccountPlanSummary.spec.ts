import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPlanSummary from '../AccountPlanSummary.vue'
import { AccountError } from '@/services/account/client'

const plan = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/api', () => ({ accountApi: { plan } }))

const settle = () => new Promise(resolve => setTimeout(resolve))
const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')
const open = async () => {
  const w = mount(AccountPlanSummary, { stubs: { 'frame-icon': true } })
  await settle()
  return w
}
const renews = Math.floor(new Date(2026, 10, 24, 12).getTime() / 1000)

afterEach(() => { vi.clearAllMocks() })

describe('Plan from /v1/me/plan', () => {
  it('shows the plan, credits left, renewal and the history link', async () => {
    plan.mockResolvedValue({ plan: { name: 'Plus', renews_at: renews, will_renew: true }, credits: { balance: 286 }, ledger_url: 'https://app.muon3d.com/ledger', source: 'model-service' })
    const w = await open()
    expect(text(w)).toContain('Plus · renews 24 Nov')
    expect(text(w)).toContain('286 credits left')
    const link = w.find('[data-tid="plan-ledger"]')
    expect(link.attributes('href')).toBe('https://app.muon3d.com/ledger')
    expect(link.text()).toBe('See your credit history')
    w.destroy()
  })

  it('reads an ISO renewal time and says when a plan ends', async () => {
    plan.mockResolvedValue({ plan: { name: 'Plus', renews_at: new Date(2026, 10, 24, 12).toISOString(), will_renew: false }, credits: { balance: 5 } })
    const w = await open()
    expect(text(w)).toContain('Plus · ends 24 Nov')
    w.destroy()
  })

  it('has no link without an https ledger_url', async () => {
    plan.mockResolvedValue({ plan: { name: 'Free' }, credits: { balance: 10 } })
    let w = await open()
    expect(w.find('[data-tid="plan-ledger"]').exists()).toBe(false)
    w.destroy()
    plan.mockResolvedValue({ plan: { name: 'Free' }, credits: { balance: 10 }, ledger_url: 'http://example.com/x' })
    w = await open()
    expect(w.find('[data-tid="plan-ledger"]').exists()).toBe(false)
    w.destroy()
  })

  it('shows no credit count when the model service is off', async () => {
    plan.mockResolvedValue({ plan: { name: 'Free' }, credits: { balance: 3 }, source: 'unavailable' })
    const w = await open()
    expect(text(w)).toContain('Free')
    expect(text(w)).not.toContain('credits left')
    w.destroy()
  })

  it.each([404, 405, 501])('says coming soon on %i', async (status) => {
    plan.mockRejectedValue(new AccountError('x', status))
    const w = await open()
    expect(w.find('[data-tid="plan-soon-note"]').exists()).toBe(true)
    expect(text(w)).toContain('coming soon')
    expect(w.find('[role="alert"]').exists()).toBe(false)
    w.destroy()
  })

  it('shows a real error line otherwise', async () => {
    plan.mockRejectedValue(new AccountError('The Muon3D service answered 500.', 500))
    const w = await open()
    expect(w.find('[role="alert"]').text()).toContain('answered 500')
    expect(w.find('[data-tid="plan-soon-note"]').exists()).toBe(false)
    w.destroy()
  })
})
