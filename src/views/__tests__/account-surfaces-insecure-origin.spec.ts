/**
 * @vitest-environment-options { "url": "http://muon3d.local/" }
 *
 * KAN-2192, the part a person sees: on the printer's plain-HTTP address no
 * account surface shows a field to type a secret into. Each shows one link
 * to Muon Control, and makes no request. The service layer refuses the calls
 * anyway; these tests are about the page never asking, which is what lets
 * "the real page never asks for your password" be true.
 *
 * `account-surfaces-secure-origin.spec.ts` mounts the same surfaces on a
 * secure origin and finds the forms, so a pass here is not a blank render.
 */
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Vue from 'vue'
import { surfaceStubs } from './account-surface-stubs'

vi.mock('@/services/muon-cloud/iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

let requests: string[]

beforeEach(() => {
  localStorage.clear()
  requests = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    requests.push(String(url))
    return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' } as Response
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Anything a person could type a password, a code or an address into. */
function fields (wrapper: Wrapper<Vue>): number {
  return wrapper.findAll('input, textarea').length
}

function link (wrapper: Wrapper<Vue>): string | undefined {
  const button = wrapper.find('[data-tid="open-in-control-button"]')
  return button.exists() ? button.attributes('href') || undefined : undefined
}

const router = () => ({ replace: vi.fn(() => Promise.resolve()), push: vi.fn(() => Promise.resolve()) })

describe('account surfaces on a plain-HTTP printer page', () => {
  it('the sign-in page shows the link and no form', async () => {
    const SignIn = (await import('../SignIn.vue')).default
    const wrapper = mount(SignIn, { stubs: surfaceStubs, mocks: { $route: { path: '/sign-in', fullPath: '/sign-in', query: {} }, $router: router() } })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBe(0)
    expect(link(wrapper)).toBe('https://control.muon3d.com/#/sign-in')
    expect(requests).toEqual([])
  })

  it('the sign-in dialog shows the link and no form, wherever it is opened from', async () => {
    const CloudAccountDialog = (await import('@/components/muon-cloud/CloudAccountDialog.vue')).default
    const wrapper = mount(CloudAccountDialog, {
      stubs: surfaceStubs,
      propsData: { value: true },
      mocks: { $route: { path: '/library', fullPath: '/library?tab=mine', query: {} }, $router: router() }
    })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBe(0)
    // The same page on the console.
    expect(link(wrapper)).toBe('https://control.muon3d.com/#/library?tab=mine')
    expect(wrapper.text()).not.toContain('Create an account')
    expect(requests).toEqual([])
  })

  it('an emailed reset link is not used here, is taken out of the address, and is kept nowhere', async () => {
    const AccountEmailLink = (await import('../AccountEmailLink.vue')).default
    const $router = router()
    const wrapper = mount(AccountEmailLink, {
      stubs: surfaceStubs,
      mocks: { $route: { path: '/account/reset-password', fullPath: '/account/reset-password?token=SECRET-TOKEN', query: { token: 'SECRET-TOKEN' } }, $router }
    })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBe(0)
    expect($router.replace).toHaveBeenCalledWith({ path: '/account/reset-password' })
    expect(link(wrapper)).toBe('https://control.muon3d.com/#/account')
    // Not in the page, and not in the component's state.
    expect(wrapper.html()).not.toContain('SECRET-TOKEN')
    expect(JSON.stringify(wrapper.vm.$data)).not.toContain('SECRET-TOKEN')
    expect(requests).toEqual([])
  })

  it('an emailed confirm link makes no request here', async () => {
    const AccountEmailLink = (await import('../AccountEmailLink.vue')).default
    const wrapper = mount(AccountEmailLink, {
      stubs: surfaceStubs,
      mocks: { $route: { path: '/account/verify-email', fullPath: '/account/verify-email?token=SECRET-TOKEN', query: { token: 'SECRET-TOKEN' } }, $router: router() }
    })
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(link(wrapper)).toBe('https://control.muon3d.com/#/account')
    expect(wrapper.html()).not.toContain('SECRET-TOKEN')
    expect(requests).toEqual([])
  })
})
