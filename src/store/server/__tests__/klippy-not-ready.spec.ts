import { beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { mutations } from '@/store/printer/mutations'
import { defaultState } from '@/store/printer/state'

const socket = vi.hoisted(() => ({
  printerInfo: vi.fn(),
  serverConfig: vi.fn(),
  machineProcStats: vi.fn(),
  machineSystemInfo: vi.fn(),
  serverInfo: vi.fn(),
  printerObjectsList: vi.fn(),
  serverFilesListRoot: vi.fn()
}))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const call = (action: unknown, context: object, payload?: unknown) =>
  (action as (context: object, payload?: unknown) => Promise<void>)(context, payload)

const context = (klippyRetries = 0) => ({
  commit: vi.fn(),
  dispatch: vi.fn(),
  state: { klippy_retries: klippyRetries }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Klipper not ready, as the printer reconnects or reports it', () => {
  it('forgets the print it was on, once', async () => {
    const first = context()
    await call(actions.onServerInfo, first, { klippy_state: 'shutdown', registered_directories: [] })
    expect(first.commit).toHaveBeenCalledWith('printer/setPrintUnknown', undefined, { root: true })

    const again = context(1)
    await call(actions.onServerInfo, again, { klippy_state: 'shutdown', registered_directories: [] })
    expect(again.commit).not.toHaveBeenCalledWith('printer/setPrintUnknown', undefined, { root: true })
  })

  it('keeps it when Klipper is ready, where the subscription answers for it', async () => {
    const ready = context()
    await call(actions.onServerInfo, ready, { klippy_state: 'ready', registered_directories: [] })
    expect(ready.commit).not.toHaveBeenCalledWith('printer/setPrintUnknown', undefined, { root: true })
  })

  it('setPrintUnknown clears the print job and leaves the rest', () => {
    const state = defaultState()
    Object.assign(state.printer, {
      print_stats: { state: 'printing', filename: 'part.gcode', print_duration: 600 },
      idle_timeout: { state: 'Printing' },
      virtual_sdcard: { is_active: true, progress: 0.4 },
      pause_resume: { is_paused: true },
      webhooks: { state: 'ready', state_message: 'Printer is ready' },
      extruder: { temperature: 219 }
    })
    mutations.setPrintUnknown(state)
    const fresh = defaultState().printer
    expect(state.printer.print_stats).toEqual(fresh.print_stats)
    expect(state.printer.idle_timeout).toEqual(fresh.idle_timeout)
    expect(state.printer.virtual_sdcard).toEqual(fresh.virtual_sdcard)
    expect(state.printer.webhooks).toEqual(fresh.webhooks)
    expect(state.printer).not.toHaveProperty('pause_resume')
    expect(state.printer.extruder).toEqual({ temperature: 219 })
  })
})
