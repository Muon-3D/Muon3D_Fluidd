import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Macro } from '@/store/macros/types'

vi.mock('@/services/dev-mode/state', () => ({
  devModeState: { enabled: true },
  refreshDevMode: () => Promise.resolve()
}))
vi.mock('@/services/macros/places', () => ({
  macroPlacesOn: () => Promise.resolve(new Map([['PURGE', { root: 'config', path: 'macros.cfg', line: 4 }]]))
}))

const { default: MacroPanel } = await import('../MacroPanel.vue')

const macros: Macro[] = [
  { name: 'purge', categoryId: '0', visible: true, config: {} },
  { name: 'park', categoryId: '0', visible: true, config: {} },
  { name: 'load_filament', categoryId: 'a', category: { id: 'a', name: 'Filament' }, visible: false, config: {} }
]

const dispatch = vi.fn()
const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter({ mode: 'abstract' })
const push = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve() as never)

function mount () {
  return shallowMount(MacroPanel, {
    localVue,
    router,
    stubs: { 'v-menu': true, 'v-switch': true, 'frame-icon': true, 'router-link': true },
    mocks: {
      $t: (k: string) => k === 'app.general.label.uncategorized' ? 'Uncategorised' : k,
      $store: {
        dispatch,
        state: { socket: { open: true }, server: { info: { registered_directories: ['config'] } }, printer: { printer: {} } },
        getters: {
          'macros/getMacros': macros,
          'macros/getCategories': [{ id: 'a', name: 'Filament', count: 1, visible: 0 }],
          'macros/getMacrosByCategory': (id: string) => macros.filter(m => m.categoryId === id)
        }
      }
    }
  })
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

describe('MacroPanel', () => {
  beforeEach(() => { dispatch.mockClear(); push.mockClear() })

  it('shows Uncategorised as a section in the one panel, and no Read or Edit button', async () => {
    const w = mount()
    await settle()
    const sections = w.findAll('[data-section]').wrappers.map(s => s.attributes('data-section'))
    expect(sections).toEqual(['Filament', 'Uncategorised'])
    expect(w.text()).not.toMatch(/\bRead\b|\bEdit\b/)
  })

  it('chooses a macro with a click and opens it with a double-click, at its line', async () => {
    const w = mount()
    await settle()
    const row = w.find('[data-tid="macro-row-purge"]')
    await row.trigger('click')
    expect(row.attributes('aria-selected')).toBe('true')
    expect(push).not.toHaveBeenCalled()
    await row.trigger('dblclick')
    expect(push).toHaveBeenCalledWith({ path: '/configure', query: { open: 'config/macros.cfg', line: '4' } })
  })

  it('opens the chosen macro with Enter, and moves the choice with the arrows', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-load_filament"]').trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-tid="macro-row-purge"]').attributes('aria-selected')).toBe('true')
    await w.find('[data-tid="macro-row-purge"]').trigger('keydown', { key: 'Enter' })
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('opens the details of a macro not found in the config files', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-park"]').trigger('dblclick')
    expect(push).not.toHaveBeenCalled()
    expect(w.find('macro-settings-dialog-stub').exists()).toBe(true)
  })

  it('moves a dragged macro into the section it is dropped on, and saves it', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-purge"]').trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await w.find('[data-tid="macro-section-a"]').trigger('drop', { dataTransfer: { getData: () => 'purge' } })
    expect(dispatch).toHaveBeenCalledWith('macros/saveAllOrder', [
      expect.objectContaining({ name: 'load_filament' }),
      expect.objectContaining({ name: 'purge', categoryId: 'a' })
    ])
  })

  it('moves a macro with Move to…, without dragging', async () => {
    const w = mount()
    await settle()
    ;(w.vm as unknown as { moveFor: Macro | null }).moveFor = macros[1]
    await w.vm.$nextTick()
    ;(w.vm as unknown as { moveTo: (n: string, s: string) => void }).moveTo('park', 'a')
    expect(dispatch).toHaveBeenCalledWith('macros/saveAllOrder', [
      expect.objectContaining({ name: 'load_filament' }),
      expect.objectContaining({ name: 'park', categoryId: 'a' })
    ])
  })
})
