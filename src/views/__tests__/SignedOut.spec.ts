import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SignedOut from '../SignedOut.vue'

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { ready: true, account: null } }))
vi.mock('@/store', () => ({ default: {} }))
const nearby = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-cloud/api', () => ({ cloudApi: { nearby } }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => false, consoleServesPage: () => false }))
vi.mock('@/services/account/state', () => ({ describe: (e: Error) => e.message }))
vi.mock('@/services/account/sign-in', () => ({}))
const settle = () => new Promise(resolve => setTimeout(resolve))

function open () {
  nearby.mockResolvedValue({ printers: [{ printer_id: 'p1', name: 'Sample M1', local_addrs: ['127.0.0.1:9876'] }] })
  return mount(SignedOut, {
    mocks: { $router: { replace: vi.fn() } },
    stubs: { 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true, PrinterThumb: true }
  })
}

describe('nearby printer state after signing out', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })
  it.each([['standby', 'Ready'], ['printing', 'Printing'], ['paused', 'Paused']] as const)('shows %s using Control status words', async (state, label) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state } } } }))))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe(label)
    expect(w.find('a[href="http://127.0.0.1:9876/"]').exists()).toBe(true)
    w.destroy()
  })
  it.each([[401, 'Needs access'], [503, 'Error']] as const)('keeps Open available when the status read answers %s', async (status, label) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status })))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe(label)
    expect(w.find('a[href="http://127.0.0.1:9876/"]').exists()).toBe(true)
    w.destroy()
  })
  it('says status is unavailable when local access is blocked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe('Status unavailable')
    w.destroy()
  })
})

describe('the line after the person\'s own credential change (KAN-1389)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); sessionStorage.clear() })
  it.each([
    ['password', 'Your password was changed. Sign in again.'],
    ['email', 'Your email address was changed. Sign in again.'],
    ['two-step', 'Your two-step sign-in was changed. Sign in again.']
  ] as const)('says so for a %s change', async (reason, text) => {
    sessionStorage.setItem('muon.account.signedOut', JSON.stringify({ at: Date.now(), scope: 'browser', reason }))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const w = open()
    await settle()
    expect(w.find('[data-tid="signed-out-line"]').text()).toBe(text)
    w.destroy()
  })
})

describe('the line after the console ended the session (KAN-2509)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); sessionStorage.clear() })
  const lines: Array<[string, string, string]> = [
    ['password_changed', 'browser', 'You were signed out because your password changed.'],
    ['password_reset', 'browser', 'You were signed out because your password changed.'],
    ['email_changed', 'browser', 'You were signed out because your email address changed.'],
    ['two_step_changed', 'browser', 'You were signed out because two-step sign-in changed.'],
    ['passkey_changed', 'browser', 'You were signed out because your sign-in methods changed.'],
    ['identity_changed', 'browser', 'You were signed out because your sign-in methods changed.'],
    ['signed_out_everywhere', 'everywhere', 'You were signed out on every device.'],
    ['session_revoked', 'browser', 'This device was signed out from another device.'],
    ['refresh_reuse', 'browser', 'You were signed out to protect your account. Sign in again.'],
    ['staff_action', 'browser', 'You were signed out by Muon3D support.']
  ]
  it.each(lines)('says it for %s', async (reason, scope, text) => {
    sessionStorage.setItem('muon.account.signedOut', JSON.stringify({ at: Date.now(), scope, reason }))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const w = open()
    await settle()
    expect(w.find('[data-tid="signed-out-line"]').text()).toBe(text)
    expect(w.find('[data-tid="signed-out-line"]').text()).not.toContain('_')
    w.destroy()
  })

  it.each([
    ['account_deleted', 'deleted', 'Your account is being deleted'],
    ['signed_out', 'browser', 'signed out of Control and Slice in this browser'],
    ['session_expired', 'browser', 'signed out of Control and Slice in this browser'],
    ['a_reason_from_a_newer_console', 'browser', 'signed out of Control and Slice in this browser']
  ])('says the existing or generic text for %s, never the raw key', async (reason, scope, part) => {
    sessionStorage.setItem('muon.account.signedOut', JSON.stringify({ at: Date.now(), scope, reason }))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const w = open()
    await settle()
    expect(w.find('[data-tid="signed-out-line"]').text()).toContain(part)
    expect(w.find('[data-tid="signed-out-line"]').text()).not.toContain(reason)
    w.destroy()
  })

  it('a note up to 15 minutes old still says why, an older one does not', async () => {
    const { readSignedOut } = await import('@/services/account/signed-out-note')
    const at = Date.now()
    sessionStorage.setItem('muon.account.signedOut', JSON.stringify({ at, scope: 'browser', reason: 'password_changed' }))
    expect(readSignedOut(at + 14 * 60 * 1000)?.reason).toBe('password_changed')
    expect(readSignedOut(at + 16 * 60 * 1000)).toBeNull()
  })
})
