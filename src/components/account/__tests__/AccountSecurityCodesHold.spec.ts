// KAN-1389 review: the recovery codes are the only copy. The console ends the session in the same answer, so
// nothing may take the page away (a refused call, the focus check) before Done, and no read of "who am I" is made.
import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountSecurity from '../AccountSecurity.vue'
import { accountApi } from '@/services/account/api'
import { cloudState } from '@/services/muon-cloud/state'
import { sessionRefused } from '@/services/muon-cloud/api'

const signOutNow = vi.hoisted(() => vi.fn(async () => {}))
const loadMe = vi.hoisted(() => vi.fn(async () => {}))
let accountWhenSignedOut: unknown = 'unset'
vi.mock('@/services/account/sign-out', () => ({ signOutNow }))
vi.mock('@/services/account/state', () => ({ accountState: { me: null, events: [], config: null }, loadMe, loadConfig: async () => {}, loadEvents: async () => {}, describe: (e: Error) => e.message }))

const account = { id: 'a1', email: 'a@example.test' } as any
beforeEach(() => {
  cloudState.account = account
  accountWhenSignedOut = 'unset'
  signOutNow.mockImplementation(async () => { accountWhenSignedOut = cloudState.account })
})
afterEach(() => { vi.restoreAllMocks(); signOutNow.mockReset(); loadMe.mockClear(); cloudState.account = null })

const router = { push: vi.fn() }
function mount () {
  return shallowMount(AccountSecurity, {
    propsData: { linkTo: (id: string) => '/account/' + id },
    methods: { refresh: () => {} },
    mocks: { $router: router, $confirm: async () => true },
    stubs: { M3Dialog: { props: ['value'], template: '<div v-if="value"><slot/><slot name="actions"/></div>' } }
  })
}
const later = () => new Promise(resolve => setTimeout(resolve))

describe('recovery codes while the console has ended the session', () => {
  it('confirming two-step does not ask who is signed in, and a refused session cannot drop the page before Done', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStep'); vm.form.code = '123456'
    vi.spyOn(accountApi, 'totpConfirm').mockResolvedValue({ ok: true, recovery_codes: ['aaaa-bbbb'], signed_out: true } as any)
    await vm.confirmTwoStep()
    expect(loadMe).not.toHaveBeenCalled()
    // The notices poll, the focus check or a refused call all end up here.
    sessionRefused('any-token')
    await later()
    expect(cloudState.account).toBe(account)
    expect(vm.codes).toEqual(['aaaa-bbbb'])
    expect(signOutNow).not.toHaveBeenCalled()

    vm.close()
    await later()
    expect(signOutNow).toHaveBeenCalledWith('browser', { reason: 'two-step', router })
    // Signed out with the account still known, so the signed-out page can name it.
    expect(accountWhenSignedOut).toBe(account)
    w.destroy()
  })

  it('new recovery codes hold the same way', async () => {
    const w = mount()
    const vm = w.vm as any
    vi.spyOn(vm, 'withReauth').mockResolvedValue({ ok: true, recovery_codes: ['cccc-dddd'], signed_out: true })
    await vm.newCodes()
    expect(loadMe).not.toHaveBeenCalled()
    sessionRefused('any-token')
    await later()
    expect(cloudState.account).toBe(account)
    expect(vm.codes).toEqual(['cccc-dddd'])
    w.destroy()
  })

  it('the hold does not outlive the page: leaving it lets the ended session go', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStep'); vm.form.code = '123456'
    vi.spyOn(accountApi, 'totpConfirm').mockResolvedValue({ ok: true, recovery_codes: ['aaaa-bbbb'], signed_out: true } as any)
    await vm.confirmTwoStep()
    sessionRefused('any-token')
    await later()
    expect(cloudState.account).toBe(account)
    w.destroy()
    await later()
    expect(cloudState.account).toBeNull()
  })

  it('an old console (session re-keyed) holds nothing and still reads the account', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStep'); vm.form.code = '123456'
    vi.spyOn(accountApi, 'totpConfirm').mockResolvedValue({ ok: true, recovery_codes: ['aaaa-bbbb'], session: { access_token: 'n', refresh_token: 'r' } } as any)
    await vm.confirmTwoStep()
    expect(loadMe).toHaveBeenCalled()
    sessionRefused('any-token')
    await later()
    expect(cloudState.account).toBeNull()
    w.destroy()
  })
})
