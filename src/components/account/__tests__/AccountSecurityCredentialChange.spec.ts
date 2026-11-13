// KAN-1389: after the person's own password or two-step change, a console that ends the session (new) sends them to
// sign-in; a console that still re-keys it (old) keeps today's behaviour.
import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSecurity from '../AccountSecurity.vue'
import { accountApi } from '@/services/account/api'
import { endsSession } from '@/services/account/client'

const signOutNow = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/account/sign-out', () => ({ signOutNow }))
vi.mock('@/services/account/state', () => ({ accountState: { me: null, events: [], config: null }, loadMe: async () => {}, loadConfig: async () => {}, loadEvents: async () => {}, describe: (e: Error) => e.message }))
afterEach(() => { vi.restoreAllMocks(); signOutNow.mockClear() })

const router = { push: vi.fn() }
function mount () {
  return shallowMount(AccountSecurity, {
    propsData: { linkTo: (id: string) => '/account/' + id },
    methods: { refresh: () => {} },
    mocks: { $router: router },
    stubs: { M3Dialog: { props: ['value'], template: '<div v-if="value"><slot/><slot name="actions"/></div>' } }
  })
}
const rekeyed = { ok: true, session: { access_token: 'new-access', refresh_token: 'new-refresh' } }

describe('endsSession', () => {
  it('is true for signed_out, and for an answer with no session', () => {
    expect(endsSession({ ok: true, signed_out: true })).toBe(true)
    expect(endsSession({ ok: true })).toBe(true)
    expect(endsSession({ ok: true, session: null })).toBe(true)
  })
  it('is false for an answer that still carries the re-keyed session (old console)', () => {
    expect(endsSession(rekeyed)).toBe(false)
  })
})

describe('after a password change', () => {
  it('new console (signed_out): signs out here with the password reason', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('password'); vm.form.next = 'a new fixture password'
    vi.spyOn(vm, 'withReauth').mockResolvedValue({ ok: true, signed_out: true })
    await vm.changePassword()
    expect(signOutNow).toHaveBeenCalledTimes(1)
    expect(signOutNow).toHaveBeenCalledWith('browser', { reason: 'password', router })
    expect(vm.message).toBe('')
    w.destroy()
  })

  it('new console (no session in the answer): signs out here too', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('password'); vm.form.next = 'a new fixture password'
    vi.spyOn(vm, 'withReauth').mockResolvedValue({ ok: true })
    await vm.changePassword()
    expect(signOutNow).toHaveBeenCalledWith('browser', { reason: 'password', router })
    w.destroy()
  })

  it('old console (session re-keyed): keeps the session and says what it always said', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('password'); vm.form.next = 'a new fixture password'
    vi.spyOn(vm, 'withReauth').mockResolvedValue(rekeyed)
    await vm.changePassword()
    expect(signOutNow).not.toHaveBeenCalled()
    expect(vm.message).toBe('Your password is changed. Every other device is signed out.')
    w.destroy()
  })

  it('a refused change (no answer) signs nobody out', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('password'); vm.form.next = 'a new fixture password'
    vi.spyOn(vm, 'withReauth').mockResolvedValue(null)
    await vm.changePassword()
    expect(signOutNow).not.toHaveBeenCalled()
    w.destroy()
  })
})

describe('after a two-step change', () => {
  it('turning it off: new console signs out here, old console does not', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStepOff'); vm.form.code = '123456'
    const off = vi.spyOn(accountApi, 'totpOff').mockResolvedValue({ ok: true, signed_out: true } as any)
    await vm.twoStepOff()
    expect(signOutNow).toHaveBeenCalledWith('browser', { reason: 'two-step', router })

    signOutNow.mockClear()
    vm.open('twoStepOff'); vm.form.code = '123456'
    off.mockResolvedValue(rekeyed as any)
    await vm.twoStepOff()
    expect(signOutNow).not.toHaveBeenCalled()
    expect(vm.message).toBe('Two-step sign-in is off.')
    w.destroy()
  })

  it('turning it on: the recovery codes are shown first, and the sign-out follows Done', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStep'); vm.form.code = '123456'
    vi.spyOn(accountApi, 'totpConfirm').mockResolvedValue({ ok: true, recovery_codes: ['aaaa-bbbb'], signed_out: true } as any)
    await vm.confirmTwoStep()
    expect(vm.codes).toEqual(['aaaa-bbbb'])
    expect(signOutNow).not.toHaveBeenCalled()
    vm.close()
    await Promise.resolve()
    expect(signOutNow).toHaveBeenCalledWith('browser', { reason: 'two-step', router })
    w.destroy()
  })

  it('turning it on against the old console: no sign-out after Done', async () => {
    const w = mount()
    const vm = w.vm as any
    vm.open('twoStep'); vm.form.code = '123456'
    vi.spyOn(accountApi, 'totpConfirm').mockResolvedValue({ ...rekeyed, recovery_codes: ['aaaa-bbbb'] } as any)
    await vm.confirmTwoStep()
    vm.close()
    await Promise.resolve()
    expect(signOutNow).not.toHaveBeenCalled()
    w.destroy()
  })
})
