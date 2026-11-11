import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSide from '../AccountSide.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { accountNav, accountSections } from '@/services/account/model'

vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual() as object), loadCredits: async () => ({ plan: 'maker' }) }))
vi.mock('@/services/account/avatar', async (actual) => ({ ...(await actual() as object), loadOwnAvatar: async () => {} }))

const stubs = { FrameIcon: true, RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
const open = (phone = false) => mount(AccountSide, {
  propsData: { nav: accountNav(accountSections()), navId: 'security', linkTo: (id: string) => `/account/${id}`, phone },
  stubs
})

describe('AccountSide', () => {
  afterEach(() => { cloudState.account = null })

  it('shows who you are, your plan, the sections and Sign out', async () => {
    cloudState.account = { id: 'a1', email: 'jack@muon3d.com', name: 'Jack Smith', created_at: 0 }
    const w = open()
    await new Promise(resolve => setTimeout(resolve))
    expect(w.find('[data-tid="account-side-name"]').text()).toBe('Jack Smith')
    expect(w.find('[data-tid="account-side-plan"]').text()).toMatch(/plan$/)
    expect(w.find('[data-tid="account-nav-security"]').attributes('aria-current')).toBe('page')
    await w.find('[data-tid="account-sign-out"]').trigger('click')
    expect(w.emitted('sign-out')).toHaveLength(1)
  })

  it('signed out, only the sections', () => {
    const w = open(true)
    expect(w.find('[data-tid="account-side-who"]').exists()).toBe(false)
    expect(w.find('[data-tid="account-sign-out"]').exists()).toBe(false)
    expect(w.classes()).toContain('acct-side--phone')
  })
})
