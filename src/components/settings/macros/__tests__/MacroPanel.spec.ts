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

function mount (printer: Record<string, unknown> = {}) {
  return shallowMount(MacroPanel, {
    localVue,
    router,
    stubs: { 'v-menu': true, 'v-switch': true, 'frame-icon': true, 'router-link': true },
    mocks: {
      $t: (k: string) => k === 'app.general.label.uncategorized' ? 'Uncategorised' : k,
      $store: {
        dispatch,
        state: { socket: { open: true }, server: { info: { registered_directories: ['config'] } }, printer: { printer } },
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

  it('shows Uncategorised as the last section of one list, and no Read button', async () => {
    const w = mount()
    await settle()
    const sections = w.findAll('[data-section]').wrappers.map(s => s.attributes('data-section'))
    expect(sections).toEqual(['Filament', 'Uncategorised'])
    expect(w.findAll('[data-tid="macro-list"]').length).toBe(1)
    expect(w.text()).not.toMatch(/\bRead\b/)
    expect(w.text()).toContain('New section')
  })

  it('selects like File Explorer: click one, Ctrl toggles, Shift a range, empty space clears', async () => {
    const w = mount()
    await settle()
    const sel = (n: string) => w.find(`[data-tid="macro-row-${n}"]`).attributes('aria-selected')
    expect(w.find('[data-tid="macro-selected-count"]').exists()).toBe(false)
    await w.find('[data-tid="macro-row-load_filament"]').trigger('click')
    expect(sel('load_filament')).toBe('true')
    await w.find('[data-tid="macro-row-park"]').trigger('click', { shiftKey: true })
    expect([sel('load_filament'), sel('purge'), sel('park')]).toEqual(['true', 'true', 'true'])
    expect(w.find('[data-tid="macro-selected-count"]').text()).toBe('3 selected')
    await w.find('[data-tid="macro-row-purge"]').trigger('click', { ctrlKey: true })
    expect(sel('purge')).toBe('false')
    await w.find('[data-tid="macro-list"]').trigger('click')
    expect(w.find('[data-tid="macro-selected-count"]').exists()).toBe(false)
  })

  it('selects with the checkbox, and shows or hides the selection from the toolbar', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-check-purge"]').trigger('click')
    await w.find('[data-tid="macro-check-park"]').trigger('click')
    await w.find('[data-tid="macro-toolbar-hide"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('macros/saveAllOff', [macros[0], macros[1]])
  })

  it('opens a sheet with a double-click or Enter, not the editor', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-purge"]').trigger('dblclick')
    expect(w.findComponent({ name: 'MacroSheet' }).exists()).toBe(true)
    expect(push).not.toHaveBeenCalled()
    ;(w.vm as unknown as { sheetFor: string | null }).sheetFor = null
    await w.find('[data-tid="macro-row-load_filament"]').trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-tid="macro-row-purge"]').attributes('aria-selected')).toBe('true')
    await w.find('[data-tid="macro-row-purge"]').trigger('keydown', { key: 'Enter' })
    expect(w.findComponent({ name: 'MacroSheet' }).props('macro')).toMatchObject({ name: 'purge' })
  })

  it('opens Files at the macro\'s line from the sheet when developer mode allows', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-purge"]').trigger('dblclick')
    w.findComponent({ name: 'MacroSheet' }).vm.$emit('edit')
    expect(push).toHaveBeenCalledWith({ path: '/configure', query: { open: 'config/macros.cfg', line: '4' } })
  })

  it('drags the selection into the section it is dropped on, and saves it', async () => {
    const w = mount()
    await settle()
    await w.find('[data-tid="macro-row-purge"]').trigger('click')
    await w.find('[data-tid="macro-row-park"]').trigger('click', { ctrlKey: true })
    await w.find('[data-tid="macro-row-park"]').trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await w.find('[data-tid="macro-section-a"]').trigger('dragover')
    await w.find('[data-tid="macro-section-a"]').trigger('drop')
    expect(dispatch).toHaveBeenCalledWith('macros/saveAllOrder', [
      macros[2],
      { ...macros[0], categoryId: 'a' },
      { ...macros[1], categoryId: 'a' }
    ])
  })

  it('moves a macro with Move to…, without dragging', async () => {
    const w = mount()
    await settle()
    ;(w.vm as unknown as { moveFor: string[] | null }).moveFor = ['purge']
    await w.vm.$nextTick()
    expect(w.find('[data-tid="macro-move-to-a"]').exists()).toBe(true)
    ;(w.vm as unknown as { moveTo: (n: string[], s: string) => void }).moveTo(['purge'], 'a')
    expect(dispatch).toHaveBeenCalledWith('macros/saveAllOrder', [macros[2], { ...macros[0], categoryId: 'a' }])
  })

  it('lists macros starting with _ locked, with no switch', async () => {
    const w = mount({ 'gcode_macro _probe_helper': {} })
    await settle()
    const row = w.find('[data-tid="macro-hidden-_probe_helper"]')
    expect(row.text()).toContain("can't be shown")
    expect(w.find('[data-tid="macro-visible-_probe_helper"]').exists()).toBe(false)
  })
})
