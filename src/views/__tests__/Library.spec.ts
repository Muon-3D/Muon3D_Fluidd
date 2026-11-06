import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ ready: true, account: null, activePrinterId: null, printers: [] }), cloudPrinterConnection: vi.fn() }
})
vi.mock('@/services/muon-cloud/api', async (original) => ({
  ...await original() as object,
  storedToken: vi.fn(() => null)
}))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))
vi.mock('@/services/library/print-on', () => ({
  activePrinterFacts: vi.fn(),
  downloadGcode: vi.fn(),
  downloadProject: vi.fn(),
  gcodeFileName: vi.fn(),
  saveToComputer: vi.fn()
}))
vi.mock('@/components/library/PrintOnDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/widgets/filesystem/FileNameDialog.vue', () => ({ default: { render: () => null } }))

vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {}),
  turnLibraryOn: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, refreshLibrary, turnLibraryOn } from '@/services/library/store'
// eslint-disable-next-line import/first
import { PROMISE_VERSION } from '@/services/library/promise'
// eslint-disable-next-line import/first
import { storedToken } from '@/services/muon-cloud/api'
// eslint-disable-next-line import/first
import { cloudState } from '@/services/muon-cloud/state'
// eslint-disable-next-line import/first
import Library, { autoConsent } from '../Library.vue'
// eslint-disable-next-line import/first
import LibraryState from '@/components/library/v2/LibraryState.vue'

function renderLibrary (query: Record<string, string> = {}) {
  return shallowMount(Library, {
    mocks: {
      $route: { query },
      $router: { replace: vi.fn(() => Promise.resolve()) },
      $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} },
      $vuetify: { breakpoint: { mobile: false } }
    },
    // The state tiles render for real: what they say is what these tests read.
    stubs: { 'router-link': true, 'frame-icon': true, 'print-on-dialog': true, 'file-name-dialog': true, 'library-state': LibraryState }
  })
}

beforeEach(() => {
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, enabled: true })
  autoConsent.asked = {}
  vi.clearAllMocks()
})

describe('Library feed states', () => {
  it('shows an error without the off panel when the Library is disabled', () => {
    Object.assign(libraryState, {
      enabled: false,
      synced: false,
      errorCode: 'consent_required',
      error: 'Sign in again.'
    })
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Sign in again.')
      expect(wrapper.find('[data-tid="library-off"]').exists()).toBe(false)
      expect(wrapper.find('[data-tid="library-turn-on"]').exists()).toBe(false)
    } finally {
      wrapper.destroy()
    }
  })

  it.each([
    ['not-signed-in', 'Sign in again.'],
    ['offline', "Your Library can't be reached. Check this computer's internet connection."],
    ['service_unavailable', 'Preferences unavailable']
  ])('shows %s errors after the status check and allows a retry', async (errorCode, error) => {
    Object.assign(libraryState, { errorCode, error, synced: errorCode === 'service_unavailable' })
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain(error)
      expect(wrapper.text()).not.toContain('Nothing here yet')
      // Before anything was read the tile says Try again; over shelves already shown, the callout says Retry.
      const retry = wrapper.findAll('button').wrappers.find(button => button.text() === (libraryState.synced ? 'Retry' : 'Try again'))
      expect(retry).toBeDefined()
      vi.mocked(refreshLibrary).mockClear()
      await retry!.trigger('click')
      expect(refreshLibrary).toHaveBeenCalledOnce()
    } finally {
      wrapper.destroy()
    }
  })

  it('shows skeletons until the Library answers; once it is on, the shelves show their own', async () => {
    Object.assign(libraryState, { checked: false })
    const wrapper = renderLibrary()
    try {
      expect(wrapper.find('[data-tid="library-reading"]').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Nothing here yet')
      Object.assign(libraryState, { checked: true, enabled: true, synced: false })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-tid="library-reading"]').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'MuonLibrary' }).props('ownReady')).toBe(true)
    } finally {
      wrapper.destroy()
    }
  })

  it('keeps existing cards visible alongside a refresh error', () => {
    libraryState.synced = true
    libraryState.items = {
      existing: {
        id: 'existing',
        kind: 'plate',
        format: '3mf',
        name: 'Existing print',
        size_bytes: 10,
        has_thumbnail: false,
        state: 'ready',
        rev: 1,
        created_at: '2026-10-12T10:00:00Z',
        updated_at: '2026-10-12T10:00:00Z',
        deleted_at: null,
        versioned: true
      }
    }
    libraryState.error = 'Offline'
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Offline')
      expect(wrapper.text()).toContain('Retry')
      // Yours' shelves stay (each reads on its own); the error sits above them.
      expect(wrapper.findComponent({ name: 'MuonLibrary' }).props('ownReady')).toBe(true)
      expect(wrapper.text()).not.toContain('Nothing here yet')
    } finally {
      wrapper.destroy()
    }
  })

  it('after a genuinely empty feed shows the shelves (Sliced says what to do), not a page-wide panel', () => {
    libraryState.synced = true
    const wrapper = renderLibrary()
    try {
      expect(wrapper.findComponent({ name: 'MuonLibrary' }).props('ownReady')).toBe(true)
      expect(wrapper.text()).not.toContain('Nothing here yet')
      expect(wrapper.find('[data-tid="library-reading"]').exists()).toBe(false)
    } finally {
      wrapper.destroy()
    }
  })
})

// Library v2 (5 Nov 2026): the switch is MuonLibrary's, always shown; the
// page tells it which place is open (`tab`) and keeps that in the address.
const tabOf = (wrapper: ReturnType<typeof renderLibrary>) => wrapper.findComponent({ name: 'MuonLibrary' }).props('tab')

describe('Library: Discover and Yours (KAN-735, Library v2)', () => {
  it('opens on Yours once signed in, and on Discover signed out', () => {
    const mine = renderLibrary()
    try {
      expect(tabOf(mine)).toBe('yours')
      expect(mine.find('[data-tid="library-signed-out"]').exists()).toBe(false)
    } finally {
      mine.destroy()
    }
    Object.assign(libraryState, { account: null })
    const signedOut = renderLibrary()
    try {
      expect(tabOf(signedOut)).toBe('discover')
    } finally {
      signedOut.destroy()
    }
  })

  it('stays on Yours while a saved session is still being restored', () => {
    Object.assign(libraryState, { account: null })
    cloudState.ready = false
    vi.mocked(storedToken).mockReturnValue('saved')
    const restoring = renderLibrary()
    try {
      expect(tabOf(restoring)).toBe('yours')
      expect(restoring.find('[data-tid="library-signed-out"]').exists()).toBe(false)
    } finally {
      restoring.destroy()
      cloudState.ready = true
      vi.mocked(storedToken).mockReturnValue(null)
    }
  })

  it('follows the address: ?view=discover or ?view=mine', () => {
    const discover = renderLibrary({ view: 'discover' })
    try {
      expect(tabOf(discover)).toBe('discover')
    } finally {
      discover.destroy()
    }
    const mine = renderLibrary({ view: 'mine' })
    try {
      expect(tabOf(mine)).toBe('yours')
    } finally {
      mine.destroy()
    }
  })

  it('signed out, ?view=mine shows Yours with Sign in, and no prints', () => {
    Object.assign(libraryState, { account: null })
    const wrapper = renderLibrary({ view: 'mine' })
    try {
      expect(tabOf(wrapper)).toBe('yours')
      expect(wrapper.find('[data-tid="library-signed-out"]').exists()).toBe(true)
      expect(wrapper.find('[data-tid="library-grid"]').exists()).toBe(false)
    } finally {
      wrapper.destroy()
    }
  })

  it('keeps the place in the address when the switch changes it', async () => {
    const wrapper = renderLibrary({ view: 'mine' })
    try {
      const replace = wrapper.vm.$router.replace
      wrapper.findComponent({ name: 'MuonLibrary' }).vm.$emit('update:tab', 'discover')
      expect(replace).toHaveBeenCalledWith({ query: { view: 'discover' } })
    } finally {
      wrapper.destroy()
    }
  })

  it('asks a signed-out person to sign in before printing from Discover', () => {
    Object.assign(libraryState, { account: null })
    const wrapper = renderLibrary({ view: 'discover' })
    try {
      const item = { id: 'p1', name: 'Vase', version: 2, setups: [], shared: { expected: {}, slug: 'vase' } }
      wrapper.findComponent({ name: 'MuonLibrary' }).vm.$emit('print', { modelId: 'p1', printerId: null, card: {}, print: { item } })
      const vm = wrapper.vm as unknown as { printing: unknown, accountDialog: boolean }
      expect(vm.printing).toBeNull()
      expect(vm.accountDialog).toBe(true)
    } finally {
      wrapper.destroy()
    }
  })

  it('sends a Discover print with a G-code to Print on…, and nothing without one', () => {
    const wrapper = renderLibrary({ view: 'discover' })
    try {
      const library = wrapper.findComponent({ name: 'MuonLibrary' })
      library.vm.$emit('print', { modelId: 'p1', printerId: null, card: {}, print: null })
      expect((wrapper.vm as unknown as { printing: unknown }).printing).toBeNull()
      const item = { id: 'p1', name: 'Vase', version: 2, setups: [], shared: { expected: {} } }
      library.vm.$emit('print', { modelId: 'p1', printerId: 'boxwood', card: {}, print: { item } })
      expect((wrapper.vm as unknown as { printing: unknown }).printing).toEqual(item)
    } finally {
      wrapper.destroy()
    }
  })
})

const flush = () => new Promise(resolve => setTimeout(resolve))

function offFor (account: string, extra: Partial<typeof libraryState> = {}) {
  resetLibrary(account)
  Object.assign(libraryState, { checked: true, enabled: false, promiseVersion: PROMISE_VERSION, ...extra })
}

describe('Library: always on (KAN-735)', () => {
  it('asks nothing signed out', async () => {
    resetLibrary(null)
    Object.assign(libraryState, { checked: true, enabled: false, promiseVersion: PROMISE_VERSION })
    const wrapper = renderLibrary()
    try {
      await flush()
      expect(turnLibraryOn).not.toHaveBeenCalled()
    } finally {
      wrapper.destroy()
    }
  })

  it.each([
    ['before the service has answered', { checked: false }],
    ['while the Library has an error', { error: 'Offline', errorCode: 'offline' }]
  ])('asks nothing %s', async (_, extra) => {
    offFor('fixture', extra)
    const wrapper = renderLibrary()
    try {
      await flush()
      expect(turnLibraryOn).not.toHaveBeenCalled()
    } finally {
      wrapper.destroy()
    }
  })

  it('leaves it off when it was turned off, even with no deletion date', async () => {
    offFor('fixture', { withdrawn: true, purgeAfter: null })
    const wrapper = renderLibrary()
    try {
      await flush()
      expect(turnLibraryOn).not.toHaveBeenCalled()
      expect(wrapper.find('[data-tid="library-off"]').exists()).toBe(true)
    } finally {
      wrapper.destroy()
    }
  })

  it('falls back to the off panel when consent fails, and does not try again', async () => {
    offFor('fixture')
    vi.mocked(turnLibraryOn).mockRejectedValueOnce(new Error('nope'))
    const first = renderLibrary()
    try {
      await flush()
      expect(first.find('[data-tid="library-off"]').exists()).toBe(true)
      expect(first.find('[data-tid="library-reading"]').exists()).toBe(false)
    } finally {
      first.destroy()
    }
    const again = renderLibrary()
    try {
      await flush()
      expect(turnLibraryOn).toHaveBeenCalledOnce()
      expect(again.find('[data-tid="library-off"]').exists()).toBe(true)
    } finally {
      again.destroy()
    }
  })

  it('asks again for another account after one failed', async () => {
    offFor('a')
    vi.mocked(turnLibraryOn).mockRejectedValueOnce(new Error('nope'))
    const wrapper = renderLibrary()
    try {
      await flush()
      expect(turnLibraryOn).toHaveBeenCalledTimes(1)
      offFor('b')
      await flush()
      expect(turnLibraryOn).toHaveBeenCalledTimes(2)
    } finally {
      wrapper.destroy()
    }
  })

  it('records consent once with the current promise when signed in with the Library off', async () => {
    Object.assign(libraryState, { enabled: false, promiseVersion: PROMISE_VERSION, purgeAfter: null })
    vi.mocked(turnLibraryOn).mockReturnValueOnce(new Promise(() => {}))
    const wrapper = renderLibrary()
    try {
      await wrapper.vm.$nextTick()
      expect(turnLibraryOn).toHaveBeenCalledOnce()
      expect(turnLibraryOn).toHaveBeenCalledWith(PROMISE_VERSION)
      expect(wrapper.find('[data-tid="library-off"]').exists()).toBe(false)
      expect(wrapper.find('[data-tid="library-turn-on"]').exists()).toBe(false)
      expect(wrapper.find('[data-tid="library-reading"]').exists()).toBe(true)
    } finally {
      wrapper.destroy()
    }
  })

  it('leaves it off, as before, while a deletion is pending', async () => {
    Object.assign(libraryState, { enabled: false, promiseVersion: PROMISE_VERSION, purgeAfter: '2026-11-27T00:00:00Z' })
    const wrapper = renderLibrary()
    try {
      await wrapper.vm.$nextTick()
      expect(turnLibraryOn).not.toHaveBeenCalled()
      const off = wrapper.find('[data-tid="library-off"]')
      expect(off.exists()).toBe(true)
      // The one real "off" (v3 page 12): it says when, and Keep my Library turns it back on.
      expect(off.text()).toContain('Your Library is being deleted')
      expect(off.text()).toMatch(/Everything in it goes on .+\. Turn it back on before then to keep it\./)
      // It asks first (turnOn's confirm); yes here.
      ;(wrapper.vm as unknown as { $confirm: () => Promise<boolean> }).$confirm = vi.fn(async () => true)
      await off.find('button').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(turnLibraryOn).toHaveBeenCalledWith(PROMISE_VERSION)
    } finally {
      wrapper.destroy()
    }
  })

  it('leaves it off when the promise is one this Control does not know', async () => {
    Object.assign(libraryState, { enabled: false, promiseVersion: '2099-01-01', purgeAfter: null })
    const wrapper = renderLibrary()
    try {
      await wrapper.vm.$nextTick()
      expect(turnLibraryOn).not.toHaveBeenCalled()
      const off = wrapper.find('[data-tid="library-off"]')
      expect(off.exists()).toBe(true)
      // Nothing it could do: it says to update, with no button.
      expect(off.text()).toContain('Update Control to use your Library')
      expect(off.find('button').exists()).toBe(false)
    } finally {
      wrapper.destroy()
    }
  })
})
