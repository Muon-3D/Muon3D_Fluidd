import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CloudAccountMenu from '../CloudAccountMenu.vue'
import PhotoFace from '@/components/account/profile/PhotoFace.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { forgetOwnAvatar, ownAvatar, setOwnAvatar } from '@/services/account/avatar'

const photo = vi.fn()
vi.mock('@/services/account/community', () => ({ communityApi: { photo: (...a: unknown[]) => photo(...a) } }))
vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return { cloudState: Vue.observable({ account: { id: 'a1', name: 'Jack Smith', email: 'jack@example.test', created_at: 1 }, printers: [] }) }
})
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => true }))
vi.mock('@/services/account/state', () => ({ accountState: { approvals: [] }, loadApprovals: async () => {} }))
vi.mock('@/services/account/sign-out', () => ({ beginSignOut: vi.fn() }))
vi.mock('@/components/layout/AppUserMenu.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/settings/auth/UserPasswordDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../CloudAccountDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../LinkPrinterDialog.vue', () => ({ default: { template: '<div />' } }))

function mount () {
  return shallowMount(CloudAccountMenu, {
    mocks: { $store: { state: { config: { apiUrl: 'http://x' }, socket: { open: false } }, getters: { 'config/getDisplayName': 'M1', 'config/getInstances': [], 'auth/getCurrentUser': null } } },
    stubs: { 'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' }, 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true, PhotoFace }
  })
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0))
const notFound = () => Object.assign(new Error('No photo.'), { status: 404 })

beforeEach(() => {
  forgetOwnAvatar()
  photo.mockReset()
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:test/${++n}`) as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn()
  cloudState.account = { id: 'a1', name: 'Jack Smith', email: 'jack@example.test', created_at: 1 } as typeof cloudState.account
})
afterEach(() => forgetOwnAvatar())

describe('the top bar account button', () => {
  it('shows your photo from the authenticated route, fetched once for any number of menus', async () => {
    photo.mockResolvedValue(new Blob(['x']))
    const a = mount()
    const b = mount()
    await flush()
    expect(photo).toHaveBeenCalledTimes(1)
    expect(a.find('[data-tid="account-face"] img').attributes('src')).toBe('blob:test/1')
    expect(b.find('[data-tid="account-face"] img').exists()).toBe(true)
    a.destroy(); b.destroy()
  })

  it('shows the initials when the Library has no photo', async () => {
    photo.mockRejectedValue(notFound())
    const w = mount()
    await flush()
    expect(w.find('[data-tid="account-face"] img').exists()).toBe(false)
    expect(w.find('[data-tid="account-face"]').text()).toBe('J')
    w.destroy()
  })

  it('follows a photo set elsewhere (Profile) at once', async () => {
    photo.mockRejectedValue(notFound())
    const w = mount()
    await flush()
    setOwnAvatar(new Blob(['y']))
    await w.vm.$nextTick()
    expect(w.find('[data-tid="account-face"] img').exists()).toBe(true)
    w.destroy()
  })

  it('drops the photo when the account goes, and reads the next account afresh', async () => {
    photo.mockResolvedValueOnce(new Blob(['x']))
    const w = mount()
    await flush()
    expect(ownAvatar.url).not.toBeNull()
    photo.mockRejectedValueOnce(notFound())
    cloudState.account = null as unknown as typeof cloudState.account
    await w.vm.$nextTick()
    expect(ownAvatar.url).toBeNull()
    expect(w.find('[data-tid="account-face"] img').exists()).toBe(false)
    cloudState.account = { id: 'a2', name: 'Kim', email: 'kim@example.test', created_at: 1 } as typeof cloudState.account
    await flush()
    expect(photo).toHaveBeenCalledTimes(2)
    expect(ownAvatar.url).toBeNull()
    w.destroy()
  })
})
