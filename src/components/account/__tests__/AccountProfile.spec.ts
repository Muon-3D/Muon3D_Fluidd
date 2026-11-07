import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import AccountProfile from '../AccountProfile.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { accountState } from '@/services/account/state'
import { LibraryError } from '@/services/library/api'
import type { CommunityIdentity, CommunityProfile } from '@/services/account/community'

const api = vi.hoisted(() => ({
  identity: vi.fn(),
  saveIdentity: vi.fn(),
  profile: vi.fn(),
  claim: vi.fn(),
  available: vi.fn(),
  saveAbout: vi.fn(),
  uploadPhoto: vi.fn(),
  removePhoto: vi.fn(),
  photo: vi.fn()
}))
const rename = vi.hoisted(() => vi.fn())
const me = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/community', () => ({ communityApi: api }))
vi.mock('@/services/account/api', () => ({ accountApi: { rename, me } }))
vi.mock('@/services/muon-cloud/api', async importOriginal => ({ ...(await importOriginal<object>()), storedToken: () => 'tok' }))

const identity = (over: Partial<CommunityIdentity> = {}): CommunityIdentity => ({
  declared_age: 30, declared_at: 1, can_community: true, can_public: true, identity_public: false, revision: 1, projection_pending: false, ...over
})
const profile = (over: Partial<CommunityProfile> = {}): CommunityProfile => ({
  handle: 'jack', public_name: 'Jack', identity_public: false, can_community: true, can_public: true, page_on: true, bio: null, avatar_url: null, ...over
})
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(resolve => setTimeout(resolve)) }
const tid = (w: Wrapper<Vue>, id: string) => w.find(`[data-tid="${id}"]`)
const stubs = { RouterLink: { template: '<a><slot /></a>' }, LibraryModelCard: { props: ['card'], template: '<div data-tid="card-stub">{{ card.creator }}</div>' }, FrameIcon: true }

async function open (id = identity(), p: CommunityProfile | null = profile(), query: Record<string, string> = {}) {
  api.identity.mockResolvedValue(id)
  api.profile.mockResolvedValue(p)
  const w = mount(AccountProfile, { attachTo: document.body, stubs, mocks: { $route: { query } } })
  await settle()
  return w
}

beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:photo', revokeObjectURL: () => {} }))
  cloudState.account = { id: 'a1', email: 'jack@example.test', name: 'Jack' } as typeof cloudState.account
  accountState.accountId = 'a1'
  me.mockImplementation(async () => ({ account: { id: 'a1', email: 'jack@example.test', name: 'Jack', created_at: Date.parse('2026-10-14T12:00:00Z') / 1000, name_source: 'person' }, endpoint_id: null }))
  rename.mockImplementation(async (name: string) => ({ account: { id: 'a1', email: 'jack@example.test', name, created_at: 1 } }))
})
afterEach(() => {
  vi.clearAllMocks()
  Object.values(api).forEach(fn => fn.mockReset())
  cloudState.account = null
  accountState.me = null
})

describe('Account › Profile', () => {
  it('has the header tile, the groups, and none of the old cards', async () => {
    const w = await open()
    expect(tid(w, 'profile-tile-name').text()).toBe('Jack')
    expect(tid(w, 'profile-tile-address').text()).toBe('@jack · library.muon3d.com/@jack')
    expect(tid(w, 'profile-tile-visibility').text()).toBe('Private')
    expect(tid(w, 'profile-tile-since').text()).toBe('Maker since Oct 2026')
    for (const group of ['Your public profile', 'How others see you', 'Private to you']) expect(w.text()).toContain(group)
    expect(w.text()).not.toContain('Library identity')
    expect(w.text()).not.toContain('Account name')
    expect(w.text()).not.toContain('Your photo is set in Library')
    expect(w.find('a[href*="library.muon3d.com/#/settings"]').exists()).toBe(false)
    w.destroy()
  })

  it('renames through the console, then says the Library is updating', async () => {
    const w = await open(identity(), profile())
    await tid(w, 'profile-name-change').trigger('click')
    await tid(w, 'account-name').setValue('Jack Smith')
    await tid(w, 'account-name-save').trigger('click')
    await settle()
    expect(rename).toHaveBeenCalledWith('Jack Smith')
    expect(tid(w, 'profile-updating').text()).toBe('Updating the Library…')
    expect(tid(w, 'profile-saved').exists()).toBe(true)
    w.destroy()
  })

  it('shows what the console refused', async () => {
    rename.mockRejectedValue(new Error('Names are 64 characters at most.'))
    const w = await open()
    await tid(w, 'profile-name-change').trigger('click')
    await tid(w, 'account-name').setValue('Jack Smith')
    await tid(w, 'account-name-save').trigger('click')
    await settle()
    expect(tid(w, 'profile-name-error').text()).toContain('64 characters')
    expect(tid(w, 'profile-saved').exists()).toBe(false)
    w.destroy()
  })

  it('says "Being checked" on a name or photo under review', async () => {
    const w = await open(identity(), profile({ review: { name: true, photo: true } }))
    expect(tid(w, 'profile-name-review').text()).toBe('Being checked')
    expect(tid(w, 'profile-photo-review').text()).toBe('Being checked')
    w.destroy()
  })

  it('names what is missing when Public is chosen and the page still cannot go public', async () => {
    api.saveIdentity.mockResolvedValue(identity({ identity_public: true }))
    const w = await open(identity(), profile({ page_on: false }))
    await tid(w, 'profile-public').trigger('click')
    await settle()
    expect(api.saveIdentity).toHaveBeenCalledWith({ identity_public: true })
    expect(tid(w, 'profile-public-missing').text()).toContain('switched off')
    expect(tid(w, 'profile-view-page').exists()).toBe(false)
    w.destroy()
  })

  it('does not ask the console for Public when the age rules it out, and says why', async () => {
    const w = await open(identity({ declared_age: 15, can_public: false }), profile())
    await tid(w, 'profile-public').trigger('click')
    await settle()
    expect(api.saveIdentity).not.toHaveBeenCalled()
    expect(tid(w, 'profile-public-missing').text()).toContain('18')
    w.destroy()
  })

  it('never sets page_on itself', async () => {
    api.saveIdentity.mockResolvedValue(identity({ identity_public: true }))
    const w = await open()
    await tid(w, 'profile-public').trigger('click')
    await settle()
    expect(api.saveAbout).not.toHaveBeenCalled()
    expect(Object.keys(api)).not.toContain('setPageOn')
    w.destroy()
  })

  it('offers the public page, linked by handle, once nothing is missing', async () => {
    const w = await open(identity({ identity_public: true }), profile({ identity_public: true }))
    expect(tid(w, 'profile-view-page').attributes('href')).toBe('https://library.muon3d.com/@jack')
    w.destroy()
  })

  it('refuses @muon3d with the reason, without asking the service', async () => {
    const w = await open()
    await tid(w, 'profile-username-change').trigger('click')
    await tid(w, 'community-handle').setValue('@muon3d')
    await settle()
    expect(tid(w, 'profile-handle-status').text()).toBe('That username is reserved.')
    expect(api.available).not.toHaveBeenCalled()
    expect(tid(w, 'community-claim').attributes('disabled')).toBe('disabled')
    w.destroy()
  })

  it('shows Free, the move note and the next change date, then claims it', async () => {
    api.available.mockResolvedValue({ handle: 'jacksmith', status: 'available' })
    api.claim.mockResolvedValue(profile({ handle: 'jacksmith', handle_changed_at: new Date().toISOString() }))
    const w = await open()
    await tid(w, 'profile-username-change').trigger('click')
    await tid(w, 'community-handle').setValue('jacksmith')
    await new Promise(resolve => setTimeout(resolve, 350))
    await settle()
    expect(tid(w, 'profile-handle-status').text()).toBe('Free')
    expect(tid(w, 'profile-handle-note').text()).toMatch(/Your page moves to library\.muon3d\.com\/@jacksmith\. Links to @jack keep working for 12 months\. You can change it again on \d+ \w+\./)
    await tid(w, 'community-claim').trigger('click')
    await settle()
    expect(api.claim).toHaveBeenCalledWith('jacksmith')
    expect(tid(w, 'profile-username-value').text()).toBe('@jacksmith')
    w.destroy()
  })

  it('says a taken username is taken', async () => {
    api.available.mockResolvedValue({ handle: 'taken', status: 'taken' })
    const w = await open()
    await tid(w, 'profile-username-change').trigger('click')
    await tid(w, 'community-handle').setValue('taken')
    await new Promise(resolve => setTimeout(resolve, 350))
    await settle()
    expect(tid(w, 'profile-handle-status').text()).toBe('That username is taken.')
    w.destroy()
  })

  it('holds the change inside 30 days and says when it opens again', async () => {
    const w = await open(identity(), profile({ handle_changed_at: new Date(Date.now() - 3 * 86_400_000).toISOString() }))
    await tid(w, 'profile-username-change').trigger('click')
    expect(tid(w, 'profile-handle-cooldown').text()).toMatch(/^You can change it again on \d+ \w+\.$/)
    expect(tid(w, 'community-handle').attributes('disabled')).toBe('disabled')
    expect(tid(w, 'community-claim').attributes('disabled')).toBe('disabled')
    w.destroy()
  })

  it('shows the service answering the 30-day limit', async () => {
    api.available.mockResolvedValue({ handle: 'another', status: 'available' })
    api.claim.mockRejectedValue(new LibraryError('handle_cooldown', 'A handle can change once every 30 days.', 429))
    const w = await open()
    await tid(w, 'profile-username-change').trigger('click')
    await tid(w, 'community-handle').setValue('another')
    await new Promise(resolve => setTimeout(resolve, 350))
    await settle()
    await tid(w, 'community-claim').trigger('click')
    await settle()
    expect(tid(w, 'profile-username-error').text()).toContain('once every 30 days')
    w.destroy()
  })

  it('uploads a photo and removes it', async () => {
    api.uploadPhoto.mockResolvedValue(profile({ avatar_url: 'https://models.muon3d.com/v1/public/avatars/x' }))
    api.photo.mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
    api.removePhoto.mockResolvedValue(profile({ avatar_url: null }))
    const w = await open()
    expect(tid(w, 'profile-photo-remove').exists()).toBe(false)
    const input = tid(w, 'profile-photo-input')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'me.png', { type: 'image/png' })], configurable: true })
    await input.trigger('change')
    await settle()
    expect(api.uploadPhoto).toHaveBeenCalledOnce()
    expect(tid(w, 'profile-tile-photo').find('img').exists()).toBe(true)
    await tid(w, 'profile-photo-remove').trigger('click')
    await settle()
    expect(api.removePhoto).toHaveBeenCalledOnce()
    expect(tid(w, 'profile-tile-photo').find('img').exists()).toBe(false)
    w.destroy()
  })

  it('refuses a photo that is not JPEG, PNG or WebP before sending it', async () => {
    const w = await open()
    const input = tid(w, 'profile-photo-input')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'me.gif', { type: 'image/gif' })], configurable: true })
    await input.trigger('change')
    await settle()
    expect(api.uploadPhoto).not.toHaveBeenCalled()
    expect(tid(w, 'profile-photo-error').text()).toContain('JPEG, PNG or WebP')
    w.destroy()
  })

  it('saves the about line to the Library', async () => {
    api.saveAbout.mockResolvedValue(profile({ bio: 'Prints too much PETG.' }))
    const w = await open()
    await tid(w, 'profile-about-change').trigger('click')
    await tid(w, 'profile-about-input').setValue('Prints too much PETG.')
    await tid(w, 'profile-about-save').trigger('click')
    await settle()
    expect(api.saveAbout).toHaveBeenCalledWith('Prints too much PETG.')
    expect(tid(w, 'profile-about-value').text()).toBe('Prints too much PETG.')
    w.destroy()
  })

  it('shows the age as a status line once it is set, never the number', async () => {
    const w = await open(identity({ declared_age: 34 }))
    expect(tid(w, 'profile-age').text()).toBe('Over 18')
    expect(w.text()).not.toContain('34')
    expect(tid(w, 'community-age').exists()).toBe(false)
    w.destroy()
  })

  it('confirms the age once, then loads the Library', async () => {
    const w = await open(identity({ declared_age: null, can_community: false, can_public: false }), null)
    expect(tid(w, 'profile-username-change').attributes('disabled')).toBe('disabled')
    api.saveIdentity.mockResolvedValue(identity({ declared_age: 22 }))
    api.identity.mockResolvedValue(identity({ declared_age: 22 }))
    api.profile.mockResolvedValue(profile())
    await tid(w, 'community-age').setValue('22')
    await tid(w, 'community-confirm-age').trigger('click')
    await settle()
    expect(api.saveIdentity).toHaveBeenCalledWith({ declared_age: 22 })
    expect(tid(w, 'profile-age').text()).toBe('Over 18')
    w.destroy()
  })

  it('shows the email, read-only, with a way to Sign-in and security', async () => {
    const w = await open()
    expect(tid(w, 'profile-email').text()).toBe('jack@example.test')
    expect(tid(w, 'profile-email-link').text()).toBe('Sign-in and security')
    w.destroy()
  })

  it('previews private makes as "a maker" and public ones by name, from the real card', async () => {
    const w = await open(identity({ identity_public: false }))
    expect(tid(w, 'card-stub').text()).toBe('a maker')
    w.destroy()
    const pub = await open(identity({ identity_public: true }), profile({ identity_public: true }))
    expect(tid(pub, 'card-stub').text()).toBe('Jack')
    pub.destroy()
  })

  it('says so when the console cannot be reached, and tries again', async () => {
    api.identity.mockRejectedValueOnce(new Error('The console is down for a moment.'))
    const w = mount(AccountProfile, { attachTo: document.body, stubs, mocks: { $route: { query: {} } } })
    api.profile.mockResolvedValue(profile())
    await settle()
    expect(tid(w, 'profile-error').text()).toContain('The console is down')
    api.identity.mockResolvedValue(identity())
    await tid(w, 'profile-retry').trigger('click')
    await settle()
    expect(tid(w, 'profile-tile').exists()).toBe(true)
    w.destroy()
  })

  it('keeps the page and says so when only the Library is down', async () => {
    api.identity.mockResolvedValue(identity())
    api.profile.mockRejectedValue(new Error('Your Library cannot be reached.'))
    const w = mount(AccountProfile, { attachTo: document.body, stubs, mocks: { $route: { query: {} } } })
    await settle()
    expect(tid(w, 'profile-library-error').text()).toContain('cannot be reached')
    expect(tid(w, 'profile-username-change').attributes('disabled')).toBe('disabled')
    expect(tid(w, 'profile-tile-name').text()).toBe('Jack')
    w.destroy()
  })

  it.each([
    ['https://library.muon3d.com/library?view=discover', true],
    ['/library?view=discover&creator=jack', true],
    ['//evil.com', false],
    ['https://evil.example/library', false]
  ])('after saving, back to the Library for %s: %s', async (ret, shown) => {
    api.saveAbout.mockResolvedValue(profile({ bio: 'Hi' }))
    const w = await open(identity(), profile(), { return: ret })
    expect(tid(w, 'profile-return').exists()).toBe(false)
    await tid(w, 'profile-about-change').trigger('click')
    await tid(w, 'profile-about-input').setValue('Hi')
    await tid(w, 'profile-about-save').trigger('click')
    await settle()
    expect(tid(w, 'profile-return').exists()).toBe(shown)
    if (shown) expect(tid(w, 'profile-return').text()).toBe('‹ Back to the Library')
    w.destroy()
  })
})
