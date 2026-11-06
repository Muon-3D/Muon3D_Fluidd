/**
 * @vitest-environment node
 */
// Fluidd's host for Design (startDesignHost): the welcome grants Fluidd's
// look and the account's Library, never a printer, and the Library's status
// reaches the frame when it changes.
import { describe, expect, it, vi } from 'vitest'
import { designCapabilities, startDesignHost } from '../host'
import type { HostLibrary } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import type { HostLook, LibraryStatus } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'

const ORIGIN = 'http://127.0.0.1:5173'
const LOOK: HostLook = { theme: 'dark', tokens: {} }
const STATUS: LibraryStatus = { signedIn: true, enabled: true, promise: null, preferences: { autosave: false, ask: true }, usedBytes: 0, quotaBytes: 1000 }

const library = (): HostLibrary => ({
  status: vi.fn(async () => STATUS),
  preferences: vi.fn(async () => STATUS),
  save: vi.fn(async () => ({ item: 'i1', version: 1, savedAt: '2026-11-05T00:00:00.000Z' })),
  get: vi.fn(),
  browse: vi.fn(async () => {})
} as unknown as HostLibrary)

/** The frame: says hello, then the welcome and the port's messages in order. */
function setup (options: { look?: HostLook, library?: HostLibrary } = { look: LOOK, library: library() }) {
  const listeners = new Set<(e: MessageEvent) => void>()
  const target = { addEventListener: (_t: string, l: any) => { listeners.add(l) }, removeEventListener: (_t: string, l: any) => { listeners.delete(l) } }
  const welcomes: any[] = []
  let port: MessagePort | null = null
  const contentWindow = { postMessage: (m: unknown, _o: string, transfer: unknown[]) => { welcomes.push(m); port = transfer[0] as MessagePort } }
  const frame = { contentWindow, src: '' } as unknown as HTMLIFrameElement
  const host = startDesignHost({
    frame,
    designUrl: new URL(`${ORIGIN}/design/embed.html`),
    theme: 'dark',
    hostVersion: 'test',
    target,
    ...options
  })
  const srcAfterListening = frame.src
  for (const l of listeners) {
    l({ source: contentWindow, origin: ORIGIN, data: { protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'muon3d-design', appVersion: 't', nonce: '0'.repeat(32), features: ['ui.look', 'library'] } } as any)
  }
  const received: any[] = []
  const p = port as unknown as MessagePort
  p.onmessage = (e: MessageEvent) => { received.push(e.data) }
  let id = 0
  const send = (op: string, params: Record<string, unknown>, printer: string | null = null) => {
    p.postMessage({ v: 1, id: ++id, op, printer, params })
    return id
  }
  const answerTo = async (n: number) => {
    for (let i = 0; i < 100; i++) {
      const message = received.find(m => m.re === n)
      if (message) return message
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`no answer to ${n}`)
  }
  const event = async (name: string) => {
    for (let i = 0; i < 100; i++) {
      const message = received.find(m => m.event === name)
      if (message) return message
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`no ${name}`)
  }
  return { host, frame, srcAfterListening, welcomes, send, answerTo, event, close: () => { p.close(); host.close() } }
}

describe('Fluidd\'s host for Design', () => {
  it('grants exactly what it is given: the look and the Library, never a printer', () => {
    expect(designCapabilities({ look: LOOK, library: library() })).toEqual(['ui.look', 'library'])
    expect(designCapabilities({ look: LOOK })).toEqual(['ui.look'])
    expect(designCapabilities({})).toEqual([])
  })

  it('sets the frame\'s src once it listens, and welcomes Design with the look and the Library', () => {
    const t = setup()
    expect(t.srcAfterListening).toBe(`${ORIGIN}/design/embed.html`)
    expect(t.welcomes).toHaveLength(1)
    expect(t.welcomes[0].capabilities).toEqual(['ui.look', 'library'])
    expect(t.welcomes[0].look).toEqual(LOOK)
    expect(t.welcomes[0].capabilities).not.toContain('printer')
    expect(t.welcomes[0].capabilities).not.toContain('print')
    expect(t.host.bridge.clientFeatures).toEqual(['ui.look', 'library'])
    t.close()
  })

  it('answers library.status from the account\'s Library', async () => {
    const lib = library()
    const t = setup({ look: LOOK, library: lib })
    const answer = await t.answerTo(t.send('library.status', {}))
    expect(answer.error).toBeUndefined()
    expect(answer.result).toEqual(expect.objectContaining({ signedIn: true, enabled: true }))
    expect(lib.status).toHaveBeenCalled()
    t.close()
  })

  it('refuses every printer op as not granted', async () => {
    const t = setup()
    const answer = await t.answerTo(t.send('printer.get', {}))
    expect(answer.error.kind).toBe('not-allowed')
    t.close()
  })

  it('tells Design when the Library changes (library.status)', async () => {
    const t = setup()
    t.host.bridge.libraryStatus(STATUS)
    const status = await t.event('library.status')
    expect(status.data).toEqual(expect.objectContaining({ signedIn: true, enabled: true }))
    t.close()
  })

  it('grants no Library without one', () => {
    const t = setup({ look: LOOK })
    expect(t.welcomes[0].capabilities).toEqual(['ui.look'])
    t.close()
  })
})
