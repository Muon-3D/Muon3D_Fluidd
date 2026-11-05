import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import QuickActionsMenu from '../QuickActionsMenu.vue'

vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, activePrinterId: null, printers: [] } }))

const flash = vi.hoisted(() => vi.fn())
vi.mock('@/eventBus', () => ({ EventBus: { $emit: flash, bus: { $on: vi.fn(), $off: vi.fn(), $emit: vi.fn() } } }))

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

function show (computed: Record<string, unknown> = {}, confirm = vi.fn(async (): Promise<boolean> => true)) {
  return shallowMount(QuickActionsMenu, {
    computed: {
      controlLock: () => '',
      controlReady: () => true,
      panelTarget: () => 'printer-a',
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
    mocks: { $store: { getters: {}, state: {} }, $confirm: confirm },
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

describe('on a printer that is printing', () => {
  const busy = { busy: () => true }
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  it('asks before preheat changes the running print temperatures, and does nothing if declined', async () => {
    const confirm = vi.fn(async (): Promise<boolean> => false)
    const w = show(busy, confirm)
    await item(w, 'preheat').trigger('click')
    await flush()
    expect(confirm).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ title: 'Change the temperatures of the running print?' }))
    expect(calls.heatFor).not.toHaveBeenCalled()
  })

  it('preheats once the question is answered yes', async () => {
    const confirm = vi.fn(async (): Promise<boolean> => true)
    const w = show(busy, confirm)
    await item(w, 'preheat').trigger('click')
    await flush()
    expect(calls.heatFor).toHaveBeenCalledTimes(1)
  })

  it('asks before change filament pauses the print, and does nothing if declined', async () => {
    const confirm = vi.fn(async (): Promise<boolean> => false)
    const w = show(busy, confirm)
    await item(w, 'filament').trigger('click')
    await flush()
    expect(confirm).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ title: 'Pause the print to change filament?' }))
    expect(calls.sendGcode).not.toHaveBeenCalled()
  })

  it('changes filament once the question is answered yes', async () => {
    const w = show(busy, vi.fn(async (): Promise<boolean> => true))
    await item(w, 'filament').trigger('click')
    await flush()
    expect(calls.sendGcode).toHaveBeenCalledWith('M600')
  })
})

describe('when the printer is idle', () => {
  it('preheats and changes filament without asking', async () => {
    const confirm = vi.fn(async (): Promise<boolean> => true)
    const w = show({}, confirm)
    await item(w, 'preheat').trigger('click')
    await item(w, 'filament').trigger('click')
    expect(confirm).not.toHaveBeenCalled()
    expect(calls.heatFor).toHaveBeenCalledTimes(1)
    expect(calls.sendGcode).toHaveBeenCalledWith('M600')
  })
})

describe('restart', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  it('says why when the command is refused', async () => {
    calls.sendTypedGcode.mockResolvedValueOnce(false)
    const w = show({}, vi.fn(async (): Promise<boolean> => true))
    ;(w.vm as unknown as { commandRefusal: string }).commandRefusal = 'Not sent. Klipper is not connected.'
    await item(w, 'restart').trigger('click')
    await flush()
    expect(flash).toHaveBeenCalledWith('Not sent. Klipper is not connected.', expect.objectContaining({ type: 'error' }))
  })

  it('says nothing when it was sent', async () => {
    calls.sendTypedGcode.mockResolvedValueOnce(true)
    const w = show()
    await item(w, 'restart').trigger('click')
    await flush()
    expect(flash).not.toHaveBeenCalled()
  })
})
