import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import QuickActionsMenu from '../QuickActionsMenu.vue'

vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, activePrinterId: null, printers: [] } }))

const calls = vi.hoisted(() => ({
  home: vi.fn(),
  motorsOff: vi.fn(),
  coolDown: vi.fn(),
  heatFor: vi.fn(),
  runCheck: vi.fn(),
  sendTypedGcode: vi.fn(),
  sendGcode: vi.fn()
}))

const bedMesh = { id: 'bedMesh', gcode: 'BED_MESH_CALIBRATE', wait: 'w', confirm: '', title: 'Level the bed' }

function show (computed: Record<string, unknown> = {}) {
  return shallowMount(QuickActionsMenu, {
    computed: {
      controlLock: () => '',
      controlReady: () => true,
      busy: () => false,
      restartRefusal: () => '',
      checksBlocked: () => '',
      checks: () => [bedMesh],
      materials: () => [],
      material: () => null,
      loadedMaterial: () => ({ name: 'PLA', presetId: 'pla', nozzle: 215, bed: 60 }),
      macroList: () => [{ name: 'M600', config: { gcode: 'M117 hi' } }],
      ...computed
    },
    methods: { ...calls },
    mocks: { $store: { getters: {}, state: {} } },
    stubs: {
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'frame-icon': true
    }
  })
}

const item = (w: ReturnType<typeof show>, id: string) => w.find(`[data-tid="quick-${id}"]`)

afterEach(() => { vi.clearAllMocks() })

describe('QuickActionsMenu', () => {
  it('draws the lightning bolt from the frame icon set', () => {
    const w = show()
    expect(w.find('[data-tid="quick-actions"]').html()).toContain('name="bolt"')
  })

  it('lists the seven actions, with Restart Klipper below the rule', () => {
    const w = show()
    expect(['home', 'preheat', 'cool', 'filament', 'level', 'motors', 'restart'].every(id => item(w, id).exists())).toBe(true)
    expect(item(w, 'preheat').text()).toContain('Preheat PLA')
    expect(w.findAll('.acct-menu__rule')).toHaveLength(1)
  })

  it('runs Control commands: home, motors off, cool down, preheat, level and restart', async () => {
    const w = show()
    for (const id of ['home', 'motors', 'cool', 'preheat', 'level', 'restart']) await item(w, id).trigger('click')
    expect(calls.home).toHaveBeenCalledTimes(1)
    expect(calls.motorsOff).toHaveBeenCalledTimes(1)
    expect(calls.coolDown).toHaveBeenCalledTimes(1)
    expect(calls.heatFor).toHaveBeenCalledWith(expect.objectContaining({ name: 'PLA' }))
    expect(calls.runCheck).toHaveBeenCalledWith(bedMesh)
    expect(calls.sendTypedGcode).toHaveBeenCalledWith('RESTART')
  })

  it('sends the printer own change filament macro', async () => {
    const w = show()
    await item(w, 'filament').trigger('click')
    expect(calls.sendGcode).toHaveBeenCalledWith('M600')
  })

  it('does nothing, and says why, when Control is not ready', async () => {
    const w = show({ controlLock: () => 'Klipper is not ready', checksBlocked: () => 'Klipper is not ready', restartRefusal: () => 'Not sent. Klipper is not connected.' })
    expect(item(w, 'home').attributes('aria-disabled')).toBe('true')
    expect(w.find('[data-tid="quick-home-reason"]').text()).toBe('Klipper is not ready')
    expect(w.find('[data-tid="quick-restart-reason"]').text()).toBe('Klipper is not connected.')
    for (const id of ['home', 'motors', 'cool', 'preheat', 'level', 'restart', 'filament']) await item(w, id).trigger('click')
    for (const fn of Object.values(calls)) expect(fn).not.toHaveBeenCalled()
  })

  it('does not home or turn motors off while printing, but still offers cool down', async () => {
    const w = show({ busy: () => true })
    expect(w.find('[data-tid="quick-home-reason"]').text()).toBe('Not while the printer is printing.')
    expect(w.find('[data-tid="quick-motors-reason"]').text()).toBe('Not while the printer is printing.')
    expect(w.find('[data-tid="quick-cool-reason"]').exists()).toBe(false)
    await item(w, 'home').trigger('click')
    await item(w, 'cool').trigger('click')
    expect(calls.home).not.toHaveBeenCalled()
    expect(calls.coolDown).toHaveBeenCalledTimes(1)
  })
})
