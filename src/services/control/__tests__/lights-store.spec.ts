import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHANGE_REFUSED, LightsStore, moonrakerTransport, SAVE_REFUSED, SAVE_UNREACHED } from '../lights-store'
import { BUILTIN_PRESETS, LED_MODE_CAPABILITIES, type LightsBackend, type LightsLibrary } from '../lights'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: {} }))

const PRINTER = { 'gcode_macro LED_MODE': { mode: 'solid', h: 0, h2: 240, bright: 80, speed: 55 } }
const refusal = () => Object.assign(new Error('Forbidden'), { response: { status: 403 } })

function backend (over: Partial<LightsBackend> = {}): LightsBackend {
  const library: LightsLibrary = { presets: [...BUILTIN_PRESETS], favourites: ['b0'] }
  return {
    capabilities: LED_MODE_CAPABILITIES,
    read: () => null,
    describe: s => JSON.stringify(s),
    apply: async () => undefined,
    loadLibrary: async () => library,
    saveLibrary: async () => undefined,
    ...over
  }
}

const rejections: unknown[] = []
process.on('unhandledRejection', reason => { rejections.push(reason) })
afterEach(() => { rejections.length = 0 })

const tick = () => new Promise(resolve => setTimeout(resolve, 20))

describe('a refused change to the lights', () => {
  it('is caught: no unhandled rejection, and the screen says so in plain words', async () => {
    const store = new LightsStore(backend({ apply: () => Promise.reject(refusal()) }))
    store.set(PRINTER, { brightness: 40 })
    await tick()
    expect(rejections).toEqual([])
    expect(store.state.error).toBe(CHANGE_REFUSED)
    expect(store.state.pending).toBeNull()
  })

  it('also catches a throw before any promise', async () => {
    const store = new LightsStore(backend({ apply: () => { throw new Error('nope') } }))
    store.set(PRINTER, { brightness: 40 })
    await tick()
    expect(rejections).toEqual([])
    expect(store.state.error).toBe(CHANGE_REFUSED)
  })

  it('negative control: an accepted change shows no message, and the next change clears an old one', async () => {
    const apply = vi.fn().mockRejectedValueOnce(refusal()).mockResolvedValue(undefined)
    const store = new LightsStore(backend({ apply }))
    store.set(PRINTER, { brightness: 40 })
    await tick()
    expect(store.state.error).toBe(CHANGE_REFUSED)
    await new Promise(resolve => setTimeout(resolve, 420))
    store.set(PRINTER, { brightness: 50 })
    await tick()
    expect(store.state.error).toBe('')
    expect(rejections).toEqual([])
  })
})

describe('a refused save of presets or favourites', () => {
  it('says the printer refused, not that it may be unreachable, and keeps the old library', async () => {
    const store = new LightsStore(backend({ saveLibrary: () => Promise.reject(refusal()) }))
    await store.ensureLibrary()
    const saved = await store.setFavourites(['b1'])
    expect(saved).toBe(false)
    expect(store.state.error).toBe(SAVE_REFUSED)
    expect(store.state.error).not.toMatch(/reachable/i)
    expect(store.favourites).toEqual(['b0'])
  })

  it('a refused preset save says the same and adds nothing', async () => {
    const store = new LightsStore(backend({ read: () => ({ on: true, effect: 'solid', colors: ['#ff0000', '#0000ff'], brightness: 80, speed: 55 }), saveLibrary: () => Promise.reject(refusal()) }))
    await store.ensureLibrary()
    expect(await store.savePreset(PRINTER, 'Mine')).toBeNull()
    expect(store.state.error).toBe(SAVE_REFUSED)
    expect(store.presets).toHaveLength(BUILTIN_PRESETS.length)
  })

  it('negative control: a save that never reached the printer still says to check it is reachable', async () => {
    const store = new LightsStore(backend({ saveLibrary: () => Promise.reject(new Error('Network Error')) }))
    await store.ensureLibrary()
    await store.setFavourites(['b1'])
    expect(store.state.error).toBe(SAVE_UNREACHED)
  })

  it('negative control: a save that works leaves no message', async () => {
    const store = new LightsStore(backend())
    await store.ensureLibrary()
    expect(await store.setFavourites(['b1'])).toBe(true)
    expect(store.state.error).toBe('')
    expect(store.favourites).toEqual(['b1'])
  })
})

describe('the printer transport', () => {
  it('treats a script the printer refused (answer undefined) as a failure, so the screen can say so', async () => {
    socket.printerGcodeScript.mockResolvedValueOnce(undefined)
    await expect(moonrakerTransport.gcode('LED_MODE MODE=off')).rejects.toThrow()
  })

  it('negative control: a script that ran is not a failure', async () => {
    socket.printerGcodeScript.mockResolvedValueOnce({ result: 'ok' })
    await expect(moonrakerTransport.gcode('LED_MODE MODE=off')).resolves.toBeUndefined()
  })
})
