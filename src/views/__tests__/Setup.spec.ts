import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Setup from '../Setup.vue'
import { resetSetupState, setLocal, setupState } from '@/services/muon-setup/state'
import type { SetupState } from '@/services/muon-setup/types'
import newState from '@/services/muon-setup/__tests__/fixtures/state.01-new.json'
import networkPhone from '@/services/muon-setup/__tests__/fixtures/state.02-network-phone-driver.json'
import completeWithSkips from '@/services/muon-setup/__tests__/fixtures/state.08-complete-with-skips.json'

const client = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  post: vi.fn(async () => null),
  options: vi.fn(async () => ({
    languages: [
      { code: 'en', endonym: 'English' },
      { code: 'de', endonym: 'Deutsch' },
      { code: 'fr', endonym: 'Français' }
    ]
  }))
}))
vi.mock('@/services/muon-setup/client', () => ({ setupClient: () => client }))

const loadLocale = vi.hoisted(() => vi.fn(async (locale: string) => locale))
vi.mock('@/plugins/i18n', () => ({ loadLocaleMessagesAsync: loadLocale }))

const PHONE = '5b1f0c7e-9f7a-4f5e-8f0a-2d6f3c1a9b10'
const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

const mount = async () => {
  const wrapper = shallowMount(Setup, { mocks: { $t: (key: string) => key } })
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
  return wrapper
}

const openLink = (wrapper: Awaited<ReturnType<typeof mount>>) => wrapper.find('a.muon-setup__open')

describe('the /setup page shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSetupState()
    setLocal({ droveSetup: false, changingWifi: false, joinRev: null })
    setupState.local.clientId = PHONE
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts its own client, and asks for the setup languages', async () => {
    const wrapper = await mount()
    expect(client.start).toHaveBeenCalledTimes(1)
    expect(client.options).toHaveBeenCalledWith()
    wrapper.destroy()
    expect(client.stop).toHaveBeenCalledTimes(1)
  })

  it("says a printer without muon_setup can't be set up from a phone, and links to its page", async () => {
    setupState.unavailable = true
    const wrapper = await mount()

    expect(wrapper.text()).toContain('app.muon.setup.unavailable.title')
    expect(wrapper.text()).not.toContain('app.muon.setup.connecting.title')
    expect(openLink(wrapper).attributes('href')).toBe(`${window.location.origin}/`)
    // A plain link: captive-portal windows ignore new windows.
    expect(openLink(wrapper).attributes('target')).toBeUndefined()
  })

  it('offers the full page on S1', async () => {
    setupState.state = copy(newState)
    const wrapper = await mount()

    expect(openLink(wrapper).exists()).toBe(true)
    expect(openLink(wrapper).text()).toBe('app.muon.setup.open')
  })

  it('says a set-up printer is set up, and links to it, on S10', async () => {
    setupState.state = copy(completeWithSkips)
    const wrapper = await mount()

    expect(wrapper.text()).toContain('app.muon.setup.set_up.title')
    expect(openLink(wrapper).exists()).toBe(true)
  })

  it('offers no link in the middle of setup', async () => {
    setupState.state = copy(networkPhone)
    const wrapper = await mount()

    expect(openLink(wrapper).exists()).toBe(false)
  })

  describe('language (05 §9)', () => {
    it("loads the browser's first offered language while the step is pending", async () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nl-NL', 'de-AT'])
      setupState.state = copy(newState)
      const wrapper = await mount()

      expect(loadLocale).toHaveBeenLastCalledWith('de')
      expect(wrapper.findAll('option').length).toBe(3)
    })

    it('posts the language when the switcher changes it while the step is pending', async () => {
      setupState.state = copy(newState)
      const wrapper = await mount()

      await (wrapper.vm as any).chooseLanguage('fr')

      expect(client.post).toHaveBeenCalledWith('language', { code: 'fr' })
      expect(loadLocale).toHaveBeenLastCalledWith('fr')
    })

    it("follows the owner's choice once the step is done, and posts nothing", async () => {
      setupState.state = copy(networkPhone)
      const wrapper = await mount()

      await (wrapper.vm as any).chooseLanguage('fr')

      expect(client.post).not.toHaveBeenCalled()
      expect(loadLocale).toHaveBeenLastCalledWith('en')
    })
  })
})
