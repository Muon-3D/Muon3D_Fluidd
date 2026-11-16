/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * The other half of `account-surfaces-insecure-origin.spec.ts`: on a secure
 * origin the same surfaces still show their forms and no "Open in Muon
 * Control" link. Without this, that spec could pass on a blank render.
 */
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Vue from 'vue'
import { surfaceStubs } from './account-surface-stubs'

vi.mock('@/services/muon-cloud/iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
// The dialog would start the console's sign-in redirect on this origin.
vi.mock('@/services/muon-cloud/centralLogin', async (original) => ({
  ...(await original<typeof import('@/services/muon-cloud/centralLogin')>()),
  centralLoginEnabled: () => false
}))

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '{}' } as Response)))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function fields (wrapper: Wrapper<Vue>): number {
  return wrapper.findAll('input, textarea').length
}

const router = () => ({ replace: vi.fn(() => Promise.resolve()), push: vi.fn(() => Promise.resolve()) })

describe('account surfaces on a secure origin', () => {
  it('the sign-in page shows its form and no link', async () => {
    const SignIn = (await import('../SignIn.vue')).default
    const wrapper = mount(SignIn, { stubs: surfaceStubs, mocks: { $route: { path: '/sign-in', fullPath: '/sign-in', query: {} }, $router: router() } })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBeGreaterThan(0)
    expect(wrapper.find('[data-tid="open-in-control"]').exists()).toBe(false)
  })

  it('the sign-in dialog shows its form and no link', async () => {
    const CloudAccountDialog = (await import('@/components/muon-cloud/CloudAccountDialog.vue')).default
    const wrapper = mount(CloudAccountDialog, {
      stubs: surfaceStubs,
      propsData: { value: true },
      mocks: { $route: { path: '/library', fullPath: '/library', query: {} }, $router: router() }
    })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBeGreaterThan(0)
    expect(wrapper.find('[data-tid="open-in-control"]').exists()).toBe(false)
  })

  it('an emailed reset link shows the new-password form and no link', async () => {
    const AccountEmailLink = (await import('../AccountEmailLink.vue')).default
    const wrapper = mount(AccountEmailLink, {
      stubs: surfaceStubs,
      mocks: { $route: { path: '/account/reset-password', fullPath: '/account/reset-password?token=T', query: { token: 'T' } }, $router: router() }
    })
    await wrapper.vm.$nextTick()
    expect(fields(wrapper)).toBeGreaterThan(0)
    expect(wrapper.find('[data-tid="open-in-control"]').exists()).toBe(false)
  })
})
