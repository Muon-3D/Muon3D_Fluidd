/**
 * @vitest-environment-options { "url": "https://abcdefghijklmnopqrst.lan.muon3d.com/" }
 *
 * KAN-2198: on a printer's own secure address the page signs in through the
 * console, but the screens that mean "the console serves this page" (the
 * passkey button, the account's forms) stay off.
 */
import { mount } from '@vue/test-utils'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/store', () => ({ default: { state: { config: { apiUrl: '' } }, getters: {} } }))
vi.mock('@/services/muon-cloud/iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('@/services/account/sign-in', () => ({}))
vi.mock('@/services/account/webauthn', () => ({ passkeysSupported: () => true, cancelledPasskey: () => false }))
vi.mock('@/services/account/state', () => ({ describe: (e: Error) => e.message, accountState: { me: {} }, loadMe: vi.fn(async () => {}) }))
vi.mock('@/components/account/AccountOverview.vue', () => ({ default: { render: (h: any) => h('div') } }))
vi.mock('@/components/account/AccountProfile.vue', () => ({ default: { render: (h: any) => h('div') } }))
vi.mock('@/components/account/AccountPlan.vue', () => ({ default: { render: (h: any) => h('div') } }))
vi.mock('@/components/settings/LibrarySettings.vue', () => ({ default: { render: (h: any) => h('div') } }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: (h: any) => h('div') } }))

const state = vi.hoisted(() => ({ cloudState: { ready: true, account: null as unknown } }))
vi.mock('@/services/muon-cloud/state', () => state)

const CONSOLE = 'https://control.muon3d.com'
const settle = () => new Promise(resolve => setTimeout(resolve))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the printer secure origin', () => {
  it('signs in through the console but is not a page the console serves', async () => {
    const login = await import('@/services/muon-cloud/centralLogin')
    expect(login.centralLoginEnabled()).toBe(true)
    expect(login.consoleServesPage()).toBe(false)
  })

  it('SignedOut shows its sign-in and no passkey button', async () => {
    state.cloudState.account = null
    const SignedOut = (await import('../SignedOut.vue')).default
    const wrapper = mount(SignedOut, {
      mocks: { $router: { replace: vi.fn() } },
      stubs: { 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true, PrinterThumb: true }
    })
    await settle()
    // The page rendered (it has its sign-in button) ...
    expect(wrapper.text()).toContain('Sign in')
    // ... and has no passkey button.
    expect(wrapper.find('[data-tid="signed-out-passkey"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('Account shows "opens on the console", not the account forms', async () => {
    state.cloudState.account = { id: 'a1' }
    Vue.use(VueRouter)
    const Account = (await import('../Account.vue')).default
    const wrapper = mount(Account, {
      router: new VueRouter({ routes: [{ path: '/account', component: { render: (h: any) => h('div') } }] }),
      mocks: { $vuetify: { breakpoint: { mobile: false } }, $store: { getters: { 'config/getDisplayName': 'Boxwood' }, state: {} } },
      stubs: { 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true }
    })
    await settle()
    expect((wrapper.vm as any).consoleHere).toBe(false)
    expect(wrapper.find('[data-tid="account-elsewhere"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="account-elsewhere"]').text()).toContain('Your account opens on')
    wrapper.destroy()
  })
})
