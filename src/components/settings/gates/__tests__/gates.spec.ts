import Vue from 'vue'
import Vuex from 'vuex'
import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const caps = vi.hoisted(() => vi.fn())
const dev = vi.hoisted(() => ({ refresh: vi.fn(), state: { enabled: null as boolean | null } }))
vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: caps }) }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: dev.state, refreshDevMode: dev.refresh }))
vi.mock('@/services/printer-pages', async () => {
  const V = (await import('vue')).default
  const slug = V.observable({ v: 'A' as string | null })
  return { activeSlug: () => slug.v, __slug: slug }
})

const { default: LockedRow } = await import('../LockedRow.vue')
const { default: CanManageAccess } = await import('../CanManageAccess.vue')
const { default: MuonGatesMixin } = await import('@/mixins/muon-gates')
const { resetGates } = await import('@/services/gates')
const { getters } = await import('@/store/server/getters')
const slug = ((await import('@/services/printer-pages')) as any).__slug as { v: string | null }

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(Vuex)

const settle = async () => {
  for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve))
}

// Mounted gates watch the shared state, so each test removes its own.
const mounted: Array<{ destroy: () => void }> = []
const track = <T extends { destroy: () => void }>(w: T): T => { mounted.push(w); return w }

afterEach(() => {
  mounted.splice(0).forEach(w => w.destroy())
})

beforeEach(() => {
  slug.v = 'A'
  resetGates()
  caps.mockReset()
  caps.mockResolvedValue({})
  dev.refresh.mockReset()
  dev.refresh.mockResolvedValue(undefined)
  dev.state.enabled = null
})

/** The real server getters over a real store; `info.components` is the only thing faked. */
function makeStore (components: string[]) {
  return new Vuex.Store({
    modules: {
      server: {
        namespaced: true,
        state: { info: { components } },
        getters: { isMuonPrinter: getters.isMuonPrinter, componentSupport: getters.componentSupport } as any
      },
      printer: { namespaced: true, getters: { getPrinterState: () => 'standby' } }
    }
  })
}

describe('LockedRow', () => {
  function row (props: Record<string, unknown> = {}) {
    const router = new VueRouter({ mode: 'abstract' })
    return track(mount(LockedRow as any, {
      localVue,
      router,
      propsData: { label: 'Edit macros', ...props },
      stubs: { FrameIcon: { props: ['name'], template: '<i :data-icon="name" />' } }
    }))
  }

  it('shows the lock, the label and the default reason', () => {
    const w = row()
    expect(w.find('[data-icon="lock"]').exists()).toBe(true)
    expect(w.find('[data-tid="locked-row-label"]').text()).toBe('Edit macros')
    expect(w.find('[data-tid="locked-row-reason"]').text()).toBe('Needs developer mode')
  })

  it('a developer-mode lock goes to Settings > Developer mode on a tap', async () => {
    const w = row()
    await w.find('[data-tid="locked-row"]').trigger('click')
    expect(w.vm.$route.path).toBe('/A/settings')
    expect(w.vm.$route.hash).toBe('#developer')
  })

  it('"Needs a Muon printer" has no link, and a tap goes nowhere', async () => {
    const w = row({ lock: 'muon' })
    expect(w.find('[data-tid="locked-row-reason"]').text()).toBe('Needs a Muon printer')
    expect(w.find('a').exists()).toBe(false)
    await w.find('[data-tid="locked-row"]').trigger('click')
    expect(w.vm.$route.path).toBe('/')
  })
})

describe('CanManageAccess', () => {
  function gate (store: Vuex.Store<any>, props: Record<string, unknown> = {}) {
    return track(mount(CanManageAccess as any, {
      localVue,
      store,
      propsData: props,
      slots: { default: '<button data-tid="secret">Danger</button>' }
    }))
  }
  const shown = (w: any) => w.find('[data-tid="secret"]').exists()

  it('shows its content when the printer allows managing access', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    const w = gate(makeStore(['muon_access']))
    await settle()
    expect(shown(w)).toBe(true)
  })

  it.each([['ask'], ['refused']])('renders nothing (not greyed) for %s', async (answer) => {
    caps.mockResolvedValue({ protection: answer })
    const w = gate(makeStore(['muon_access']))
    await settle()
    expect(w.html()).toBe('')
  })

  it.each([
    ['a 403', Object.assign(new Error('refused'), { status: 403 })],
    ['a 5xx', Object.assign(new Error('boom'), { status: 500 })],
    ['a timeout', new Error('timeout')]
  ])('stays hidden on %s', async (_name, error) => {
    caps.mockRejectedValue(error)
    const w = gate(makeStore(['muon_access']))
    await settle()
    expect(shown(w)).toBe(false)
  })

  it('stays hidden even with non-muon="show" when the call fails', async () => {
    caps.mockRejectedValue(new Error('403'))
    const w = gate(makeStore(['muon_access']), { nonMuon: 'show' })
    await settle()
    expect(shown(w)).toBe(false)
  })

  it('a printer switch hides it until the new printer says yes', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    const w = gate(makeStore(['muon_access']))
    await settle()
    expect(shown(w)).toBe(true)

    caps.mockReset()
    caps.mockImplementation(() => new Promise(() => {})) // B has not answered
    slug.v = 'B'
    resetGates()
    await settle()
    expect(shown(w)).toBe(false)
  })

  it('a printer switch asks again and follows the new answer', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    const w = gate(makeStore(['muon_access']))
    await settle()
    caps.mockResolvedValue({ protection: 'ask' })
    slug.v = 'B'
    resetGates()
    await settle()
    expect(caps).toHaveBeenCalledTimes(2)
    expect(shown(w)).toBe(false)
  })

  it('a reconnect (reset, components empty, then loaded) hides it, then asks again', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    const store = makeStore(['muon_access'])
    const w = gate(store)
    await settle()
    expect(shown(w)).toBe(true)

    resetGates()
    store.state.server.info = { components: [] }
    await settle()
    expect(shown(w)).toBe(false)

    store.state.server.info = { components: ['file_manager', 'muon_access'] }
    await settle()
    expect(caps).toHaveBeenCalledTimes(2)
    expect(shown(w)).toBe(true)
  })

  it('does not call a loading Muon printer a non-Muon: components [] is hidden even with non-muon="show"', async () => {
    const w = gate(makeStore([]), { nonMuon: 'show' })
    await settle()
    expect(shown(w)).toBe(false)
  })

  it('shows on a loaded non-Muon printer only with non-muon="show", and asks nothing', async () => {
    expect(shown(gate(makeStore(['file_manager'])))).toBe(false)
    expect(shown(gate(makeStore(['file_manager']), { nonMuon: 'show' }))).toBe(true)
    expect(caps).not.toHaveBeenCalled()
  })

  it('a printer with only muon_protection is Muon with unknown access: hidden, nothing asked', async () => {
    const w = gate(makeStore(['file_manager', 'muon_protection']), { nonMuon: 'show' })
    await settle()
    expect(shown(w)).toBe(false)
    expect(caps).not.toHaveBeenCalled()
  })
})

describe('devModeEnabled on the mixin', () => {
  function probe (store: Vuex.Store<any>) {
    const Probe = Vue.extend({ mixins: [MuonGatesMixin as any], render: h => h('i') })
    return track(mount(Probe, { localVue, store })).vm as any
  }

  it('is on only once this printer said so', async () => {
    dev.refresh.mockImplementation(async () => { dev.state.enabled = true })
    const vm = probe(makeStore(['muon_access']))
    expect(vm.devModeEnabled).toBe(false)
    await settle()
    expect(vm.devModeEnabled).toBe(true)
  })

  it('a printer switch turns it back to locked until the new printer answers', async () => {
    dev.refresh.mockImplementation(async () => { dev.state.enabled = true })
    const vm = probe(makeStore(['muon_access']))
    await settle()
    expect(vm.devModeEnabled).toBe(true)

    dev.refresh.mockImplementation(async () => {}) // B cannot be reached; the global keeps A's true
    slug.v = 'B'
    resetGates()
    await settle()
    expect(vm.devModeEnabled).toBe(false)
  })

  it('a reconnect clears it and asks again', async () => {
    dev.refresh.mockImplementation(async () => { dev.state.enabled = true })
    const vm = probe(makeStore(['muon_access']))
    await settle()
    dev.refresh.mockImplementation(async () => { dev.state.enabled = false })
    resetGates()
    await settle()
    expect(dev.refresh).toHaveBeenCalledTimes(2)
    expect(vm.devModeEnabled).toBe(false)
  })
})
