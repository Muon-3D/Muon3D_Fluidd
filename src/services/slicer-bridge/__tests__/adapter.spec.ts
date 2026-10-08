/**
 * @vitest-environment node
 */
// Fluidd's adapter for the bridge's host helper: what reaches the printer
// through $httpClient, and how its answers reach the slicer.
import { describe, expect, it, vi } from 'vitest'
import { createFluiddAdapter, WRITE_ANSWER_MS, type HttpClient } from '../adapter'
import { readRoute } from '../reads'
import { buildUploadBody } from '../vendor/printer-client/multipart/build'
import type { BridgePrinter, UploadStep } from '../vendor/printer-client/bridge/protocol'
import { fakeMoonraker, newPrinter } from './moonraker'

const WALNUT: BridgePrinter = { key: 'a'.repeat(64), name: 'Walnut', model: 'Muon3D M1', route: 'local', role: 'operator', online: true }
const OAK: BridgePrinter = { key: 'b'.repeat(64), name: 'Oak', model: 'Muon3D M1', route: 'cloud', role: 'operator', online: true }
const CHECKSUM = 'c'.repeat(64)

function setup (options: { reportsProgress?: boolean, http?: HttpClient } = {}) {
  const printers = { walnut: newPrinter('walnut') }
  let selected: BridgePrinter | null = WALNUT
  const moonraker = fakeMoonraker(printers, () => (selected ? 'walnut' : null))
  const adapter = createFluiddAdapter({
    http: options.http ?? moonraker.http,
    selected: () => selected,
    reportsProgress: () => options.reportsProgress ?? true,
    status: () => null,
    confirm: async () => ({ choice: 'upload-only' })
  })
  return { adapter, moonraker, printers, select: (p: BridgePrinter | null) => { selected = p } }
}

const signal = () => new AbortController().signal

describe('the reads', () => {
  it('encodes every parameter it puts in a URL, so an injected name stays one name', () => {
    expect(readRoute('server.files.metadata', { filename: 'a.gcode&print=true' }))
      .toBe('/server/files/metadata?filename=a.gcode%26print%3Dtrue')
    expect(readRoute('server.files.metadata', { filename: 'sub dir/ü.gcode' }))
      .toBe('/server/files/metadata?filename=sub%20dir%2F%C3%BC.gcode')
    expect(readRoute('printer.objects.query', { objects: { print_stats: ['state', 'filename'], 'mcu toolhead': null } }))
      .toBe('/printer/objects/query?print_stats=state,filename&mcu%20toolhead')
    expect(readRoute('server.history.list', { limit: 1, order: 'desc' })).toBe('/server/history/list?limit=1&order=desc')
    expect(readRoute('server.gcode_store', { count: 100 })).toBe('/server/gcode_store?count=100')
  })

  it('knows no route outside the allowlist', () => {
    expect(() => readRoute('printer.gcode.script' as any, { script: 'G28' })).toThrow('not a read the bridge allows')
  })

  it('answers Moonraker\'s result, and a missing file as a 404 PrinterError', async () => {
    const { adapter, printers } = setup()
    printers.walnut.files.push('a.gcode')
    await expect(adapter.read(WALNUT.key, 'server.files.metadata', { filename: 'a.gcode' }, signal())).resolves.toEqual({ filename: 'a.gcode', size: 15 })
    await expect(adapter.read(WALNUT.key, 'server.files.metadata', { filename: 'b.gcode' }, signal()))
      .rejects.toMatchObject({ kind: 'printer', status: 404 })
  })

  it('reads print_stats fresh', async () => {
    const { adapter, printers } = setup()
    Object.assign(printers.walnut, { state: 'printing', filename: 'a.gcode' })
    await expect(adapter.printStats(WALNUT.key, signal())).resolves.toEqual({ state: 'printing', filename: 'a.gcode' })
  })

  it('sends nothing for a printer Fluidd no longer shows', async () => {
    const { adapter, moonraker, select } = setup()
    select(OAK)
    await expect(adapter.read(WALNUT.key, 'server.info', {}, signal())).rejects.toMatchObject({ kind: 'printer-changed' })
    await expect(adapter.start(WALNUT.key, 'a.gcode', signal())).rejects.toMatchObject({ kind: 'printer-changed' })
    expect(moonraker.requests).toEqual([])
    expect(adapter.status(WALNUT.key)).toBeNull()
  })

  it('takes a network failure as offline, and an abort as cancelled', async () => {
    const http: HttpClient = {
      get: vi.fn(async () => { throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }) }),
      post: vi.fn()
    }
    const { adapter } = setup({ http })
    await expect(adapter.read(WALNUT.key, 'server.info', {}, signal())).rejects.toMatchObject({ kind: 'offline' })
    const abort = new AbortController()
    abort.abort()
    await expect(adapter.read(WALNUT.key, 'server.info', {}, abort.signal)).rejects.toMatchObject({ kind: 'cancelled' })
  })
})

describe('the upload', () => {
  const body = () => buildUploadBody({ name: 'benchy.gcode', bytes: new TextEncoder().encode('G28\n'), checksum: CHECKSUM })

  it('sends the body the helper built, with its one Content-Type and no framing header of its own', async () => {
    const { adapter, moonraker } = setup()
    const built = body()
    const steps: UploadStep[] = []
    await expect(adapter.upload(WALNUT.key, built, { signal: signal(), onStep: s => steps.push(s) }))
      .resolves.toEqual({ path: 'benchy.gcode', size: 4 })
    const [request] = moonraker.requests
    expect(request.url).toBe('/server/files/upload')
    expect(Object.keys(request.headers)).toEqual(['Content-Type'])
    expect(request.headers['Content-Type']).toBe(built.contentType)
    expect(new Uint8Array(request.data as ArrayBuffer)).toEqual(built.body)
    // The printer read it by the slicer's own rules (root, checksum, file; never print or path).
    expect(moonraker.calls).toEqual(['upload walnut benchy.gcode'])
    expect(steps).toEqual([{ step: 'checking' }])
  })

  it('reports no count where the route cannot (Iroh): the step is indeterminate', async () => {
    const { adapter } = setup({ reportsProgress: false })
    const steps: UploadStep[] = []
    await adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: s => steps.push(s) })
    expect(steps).toEqual([{ step: 'sending', sent: null, total: body().body.byteLength }])
  })

  it('reads the printer\'s refusal: a damaged file, the safety pass', async () => {
    const answer = (status: number, data: string) => ({ status, statusText: '', data, headers: {}, config: {} as any })
    const http: HttpClient = { get: vi.fn(), post: vi.fn().mockResolvedValueOnce(answer(422, '{"error":{"code":422,"message":"Unprocessable Entity"}}')).mockResolvedValueOnce(answer(500, '{"error":{"code":500,"message":"G-code safety postprocessor exited 3"}}')) }
    const { adapter } = setup({ http })
    await expect(adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} })).rejects.toMatchObject({ kind: 'checksum', status: 422 })
    await expect(adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} })).rejects.toMatchObject({ kind: 'safety-pass' })
  })

  it('refuses an answer that says it started a print', async () => {
    const http: HttpClient = {
      get: vi.fn(),
      post: vi.fn(async () => ({ status: 201, statusText: '', headers: {}, config: {} as any, data: JSON.stringify({ item: { path: 'a.gcode', root: 'gcodes', size: 4 }, print_started: true }) }))
    }
    const { adapter } = setup({ http })
    await expect(adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} })).rejects.toMatchObject({ kind: 'protocol' })
  })

  it('takes a body broken off as lost, and one never sent as offline', async () => {
    const http: HttpClient = {
      get: vi.fn(),
      post: vi.fn(async (_url, _data, config) => {
        config?.onUploadProgress?.({ loaded: 10, total: 100 } as any)
        throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
      })
    }
    const { adapter } = setup({ http })
    await expect(adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} })).rejects.toMatchObject({ kind: 'lost' })
    const silent: HttpClient = { get: vi.fn(), post: vi.fn(async () => { throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }) }) }
    await expect(setup({ http: silent }).adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} })).rejects.toMatchObject({ kind: 'offline' })
  })

  it.each([
    ['over Iroh, which reports no progress', false],
    ['on the network, before the first progress event', true]
  ])('takes a body that broke off once handed to the transport as lost, %s', async (_how, reportsProgress) => {
    // As axios does: the request's transform runs as the request leaves for the transport, then the transport fails.
    const handedOff: HttpClient = {
      get: vi.fn(),
      post: vi.fn(async (_url, data, config) => {
        for (const transform of [config?.transformRequest ?? []].flat()) transform.call(config as any, data, {} as any)
        throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
      })
    }
    await expect(setup({ http: handedOff, reportsProgress }).adapter.upload(WALNUT.key, body(), { signal: signal(), onStep: () => {} }))
      .rejects.toMatchObject({ kind: 'lost' })
  })
})

describe('start, queue and cancel', () => {
  it('posts each once, as JSON, with the start\'s answer limit', async () => {
    const posts: Array<[string, unknown, any]> = []
    const http: HttpClient = {
      get: vi.fn(),
      post: vi.fn(async (url, data, config) => {
        posts.push([url, data, config])
        return { status: 200, statusText: '', headers: {}, config: {} as any, data: '{"result":"ok"}' }
      })
    }
    const { adapter } = setup({ http })
    await adapter.start(WALNUT.key, 'a.gcode', signal())
    await adapter.queue(WALNUT.key, ['b.gcode', 'c.gcode'], signal())
    await adapter.cancelPrint(WALNUT.key, signal())
    expect(posts.map(([url, data]) => [url, JSON.parse(data as string)])).toEqual([
      ['/printer/print/start', { filename: 'a.gcode' }],
      ['/server/job_queue/job', { filenames: ['b.gcode', 'c.gcode'] }],
      ['/printer/print/cancel', {}]
    ])
    expect(posts[0][2].timeout).toBe(WRITE_ANSWER_MS)
    expect(posts[0][2].headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('takes a lost answer to a start as lost (it may have reached the printer), never as not done', async () => {
    const http: HttpClient = { get: vi.fn(), post: vi.fn(async () => { throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }) }) }
    const { adapter } = setup({ http })
    await expect(adapter.start(WALNUT.key, 'a.gcode', signal())).rejects.toMatchObject({ kind: 'lost' })
  })

  it('passes the printer\'s refusal with its words', async () => {
    const http: HttpClient = {
      get: vi.fn(),
      post: vi.fn(async () => ({ status: 403, statusText: '', headers: {}, config: {} as any, data: '{"error":{"code":403,"message":"access-denied:print: Viewers watch only"}}' }))
    }
    const { adapter } = setup({ http })
    await expect(adapter.start(WALNUT.key, 'a.gcode', signal())).rejects.toMatchObject({ kind: 'denied', action: 'print' })
  })
})
