import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROFILE_PROMISE } from '@/services/library/profile-promise'

vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {}),
  turnLibraryOn: vi.fn(async () => {})
}))

const prefs = vi.hoisted(() => ({ read: vi.fn(async () => { throw new Error('404') }), save: vi.fn() }))
vi.mock('@/services/account/api', async (original) => ({
  ...await original() as object,
  accountApi: { preferences: prefs.read, setLibraryDefaults: prefs.save }
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, turnLibraryOn } from '@/services/library/store'
// eslint-disable-next-line import/first
import LibrarySettings from '../LibrarySettings.vue'
// eslint-disable-next-line import/first
import LibraryPageMixin from '@/mixins/library-page'

beforeEach(() => {
  vi.clearAllMocks()
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, promiseVersion: '2026-10-13' })
})

describe('Library consent surfaces', () => {
  it('renders every prepared October line in Settings and sends that version', async () => {
    const wrapper = mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true } })
    expect(wrapper.findAll('.lib-set__promise li').wrappers.map(line => line.text())).toEqual(PROFILE_PROMISE)
    await wrapper.find('[data-tid="library-turn-on"]').trigger('click')
    expect(turnLibraryOn).toHaveBeenCalledWith('2026-10-13')
    wrapper.destroy()
  })

  it('disables Settings consent for an unknown version', () => {
    libraryState.promiseVersion = '2099-01-01'
    const wrapper = mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true } })
    expect(wrapper.find('.lib-set__promise').exists()).toBe(false)
    expect(wrapper.find('[data-tid="library-turn-on"]').attributes('disabled')).toBe('disabled')
    wrapper.destroy()
  })

  it('confirms the exact current text on the Library page before sending consent', async () => {
    const confirm = vi.fn(async (message: string) => Boolean(message))
    const page = { promise: { version: '2026-10-13', summary: `Keep your models in your account. ${PROFILE_PROMISE.join(' ')}` }, $confirm: confirm, act: (action: () => Promise<void>) => action() }
    await (LibraryPageMixin as any).options.methods.turnOn.call(page)
    expect(confirm.mock.calls[0][0]).toBe(page.promise.summary)
    expect(turnLibraryOn).toHaveBeenCalledWith('2026-10-13')
  })

  it('opens no confirmation on the Library page for an unknown version', async () => {
    const confirm = vi.fn()
    await (LibraryPageMixin as any).options.methods.turnOn.call({ promise: null, $confirm: confirm })
    expect(confirm).not.toHaveBeenCalled()
    expect(turnLibraryOn).not.toHaveBeenCalled()
  })

  it('offers no Turn off once the Library is on', () => {
    Object.assign(libraryState, { enabled: true, preferences: { autosave: false, ask: true, save_from_print_check: false, updated_at: null } })
    const wrapper = mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true, 'router-link': true } })
    expect(wrapper.find('[data-tid="library-turn-on"]').exists()).toBe(false)
    expect(wrapper.text().toLowerCase()).not.toContain('turn off')
    wrapper.destroy()
  })
})

describe('Account â€º Library and storage', () => {
  const on = () => Object.assign(libraryState, { enabled: true, usedBytes: 1.2e9, quotaBytes: 5e9, preferences: { autosave: false, ask: true, save_from_print_check: true, updated_at: null } })
  const mountOn = () => mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true, 'router-link': { props: ['to'], template: '<a :data-to="to"><slot /></a>' } } })

  it('leads with the storage used, of the quota, on a bar', () => {
    on()
    const wrapper = mountOn()
    expect(wrapper.find('[data-tid="library-storage"]').text().replace(/\s+/g, ' ')).toBe('1.2 GB of 5 GB')
    expect(wrapper.find('[role="meter"]').attributes('aria-valuenow')).toBe('24')
    expect(wrapper.find('[data-tid="library-storage-split"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('splits it into uploads, slices and designs only when the service sends the split', () => {
    on()
    libraryState.usedByKind = { uploads: 4e8, slices: 7e8, designs: 1e8 }
    const wrapper = mountOn()
    const parts = wrapper.findAll('[data-tid="library-storage-split"] > div').wrappers.map(p => `${p.find('span').text()}: ${p.find('b').text()}`)
    expect(parts).toEqual(['Uploads: 400 MB', 'Slices: 700 MB', 'Designs: 100 MB'])
    wrapper.destroy()
  })

  it('keeps the three switches, in the new words, and links to Profile', () => {
    on()
    const wrapper = mountOn()
    const labels = wrapper.findAll('[data-tid="library-settings-on"] [role="switch"]').wrappers.map(s => s.attributes('aria-label'))
    expect(labels).toEqual(['Save every slice', 'Ask after slicing something new', 'Offer to save it when you print'])
    const profile = wrapper.find('[data-tid="library-profile-link"]')
    expect(profile.attributes('data-to')).toMatch(/\/account\/profile$/)
    expect(profile.text()).toContain('on Library are set in Profile.')
    wrapper.destroy()
  })

  it('still asks a signed-out account to sign in to keep a Library', () => {
    libraryState.account = null
    const wrapper = mountOn()
    expect(wrapper.find('[data-tid="library-settings-signed-out"]').text()).toContain('Sign in to keep a Library')
    wrapper.destroy()
  })
})

describe('Account › Library › When you add something new', () => {
  const stubs = { 'frame-icon': true, 'cloud-account-dialog': true, 'router-link': true }
  const settle = () => new Promise(resolve => setTimeout(resolve))
  const mountWith = async (preferences: unknown) => {
    prefs.read.mockImplementation(async () => { if (!preferences) throw new Error('404'); return preferences })
    Object.assign(libraryState, { enabled: true, usedBytes: 1, quotaBytes: 2, preferences: { autosave: false, ask: true, save_from_print_check: true, updated_at: null } })
    const wrapper = mount(LibrarySettings, { stubs })
    await settle()
    return wrapper
  }

  it('shows Only you and the suggested CC BY 4.0 before any choice, and saves nothing', async () => {
    const wrapper = await mountWith({ library_defaults: { visibility: 'private', licence: null } })
    expect(wrapper.find('[data-tid="library-visibility-private"]').attributes('aria-checked')).toBe('true')
    expect((wrapper.find('[data-tid="library-licence"]').element as HTMLSelectElement).selectedOptions[0].textContent?.trim()).toBe('CC BY 4.0 (suggested)')
    expect(wrapper.find('[data-tid="library-licence-suggested"]').exists()).toBe(true)
    expect(prefs.save).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('saves only the visibility when it is chosen, and the licence only when picked', async () => {
    prefs.save.mockResolvedValue({ library_defaults: { visibility: 'public', licence: null } })
    const wrapper = await mountWith({ library_defaults: { visibility: 'private', licence: null } })
    await wrapper.find('[data-tid="library-visibility-public"]').trigger('click')
    expect(prefs.save).toHaveBeenCalledWith({ visibility: 'public' })
    await settle()
    expect(wrapper.find('[data-tid="library-licence-suggested"]').exists()).toBe(true)
    const select = wrapper.find('[data-tid="library-licence"]')
    ;(select.element as HTMLSelectElement).value = 'CC0-1.0'
    await select.trigger('change')
    expect(prefs.save).toHaveBeenLastCalledWith({ licence: 'CC0-1.0' })
    wrapper.destroy()
  })

  it('disables both rows, with Coming soon, when the console has no preferences', async () => {
    const wrapper = await mountWith(null)
    expect(wrapper.find('[data-tid="library-visibility-public"]').attributes('disabled')).toBe('disabled')
    expect(wrapper.find('[data-tid="library-licence"]').attributes('disabled')).toBe('disabled')
    expect(wrapper.find('[data-tid="library-defaults-soon"]').text()).toContain('Coming soon')
    wrapper.destroy()
  })

  it('shows the console error when a save is refused', async () => {
    prefs.save.mockRejectedValue(new Error('That licence is not offered.'))
    const wrapper = await mountWith({})
    await wrapper.find('[data-tid="library-visibility-public"]').trigger('click')
    await settle()
    expect(wrapper.find('[role="alert"]').text()).toContain('licence')
    wrapper.destroy()
  })
})
