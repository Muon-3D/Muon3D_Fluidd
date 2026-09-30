import { describe, expect, it, vi } from 'vitest'
import { connectForSetup, groupedCode, plainCode } from '../setup'
import type { NearbyPrinter } from '../nearby'
import newState from '@/services/muon-setup/__tests__/fixtures/state.01-new.json'
import completeState from '@/services/muon-setup/__tests__/fixtures/state.08-complete-with-skips.json'
import { EID, fakeEndpoint, fakePrinter } from './fakes'

function nearby (device: unknown, fields: Partial<NearbyPrinter> = {}): NearbyPrinter {
  return {
    deviceId: 'dev-walnut',
    device: device as NearbyPrinter['device'],
    localName: 'walnut-8987',
    display: 'Walnut · 8987',
    endpointId: EID,
    advert: null,
    heardAt: 1,
    ...fields
  }
}

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))

/** A gateway session whose setup GET answers `status` and `body`. */
function session (status: number, body: unknown, extra: Record<string, unknown> = {}) {
  const requests: Array<{ method: string, path: string, headers: string[] }> = []
  return {
    requests,
    printer: {
      printerId: () => EID,
      comparison: () => 'F6Q TDH',
      fetch: vi.fn(async (method: string, path: string, headers: string[]) => {
        requests.push({ method, path, headers })
        return { status, headers: ['content-type', 'application/json'], body: bytes(body) }
      }),
      openWebSocket: async () => { throw new Error('no websocket for a setup session') },
      close: vi.fn(),
      ...extra
    }
  }
}

function endpointWith (connect: () => Promise<unknown>) {
  const ble = fakeEndpoint()
  const endpoint = { ...ble.endpoint, connect: vi.fn(connect) }
  return { endpoint, options: { endpoint: async () => endpoint } }
}

describe('connectForSetup', () => {
  it('links the radio, dials the gateway over it, and reads the setup state once: nothing but a read', async () => {
    const printer = fakePrinter()
    const gateway = session(200, { result: newState })
    const { endpoint, options } = endpointWith(async () => gateway.printer)
    const result = await connectForSetup(nearby(printer.device), options)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(endpoint.addLink).toHaveBeenCalledTimes(1)
    expect(endpoint.connect).toHaveBeenCalledWith(EID)
    expect(result.session.code).toBe('F6QTDH')
    expect(result.session.state.rev).toBe(newState.rev)
    expect(gateway.requests.map(r => `${r.method} ${r.path}`)).toEqual(['GET /server/muon/setup'])
    await result.session.close()
    expect(gateway.printer.close).toHaveBeenCalled()
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })

  it("says the console's connection cannot use Bluetooth yet, and touches no radio", async () => {
    const printer = fakePrinter()
    const result = await connectForSetup(nearby(printer.device), { endpoint: async () => ({ connect () {} }) })
    expect(result).toMatchObject({ ok: false, reason: 'unsupported' })
    expect(printer.calls).toEqual([])
  })

  it('hangs up on a connection with no comparison value to check (before muon-link#33)', async () => {
    const printer = fakePrinter()
    const gateway = session(200, { result: newState }, { comparison: undefined })
    const { options } = endpointWith(async () => gateway.printer)
    expect(await connectForSetup(nearby(printer.device), options)).toMatchObject({ ok: false, reason: 'unsupported' })
    expect(gateway.requests).toEqual([])
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })

  it('knows a set-up printer: muon-link refuses a stranger once setup is complete', async () => {
    const printer = fakePrinter()
    const refused = Object.assign(new Error('the printer refused this key: no live authorisation'), { kind: 'refused', code: 0x040a })
    const gateway = session(200, {}, { fetch: vi.fn(async () => { throw refused }) })
    const { options } = endpointWith(async () => gateway.printer)
    expect(await connectForSetup(nearby(printer.device), options)).toMatchObject({ ok: false, reason: 'set-up' })
  })

  it('knows a set-up printer from its state too', async () => {
    const { options } = endpointWith(async () => session(200, { result: completeState }).printer)
    expect(await connectForSetup(nearby(fakePrinter().device), options)).toMatchObject({ ok: false, reason: 'set-up' })
  })

  it('says another device holds the printer when its advertisement said so', async () => {
    const printer = fakePrinter({ answers: false })
    const { options } = endpointWith(async () => session(200, {}).printer)
    const busy = nearby(printer.device, { advert: { unclaimed: true, busy: true, endpointPrefix: EID.slice(0, 16) } })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const result = connectForSetup(busy, options)
      await vi.advanceTimersByTimeAsync(11_000)
      expect(await result).toMatchObject({ ok: false, reason: 'busy' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('calls anything else unreachable, and hangs up', async () => {
    const printer = fakePrinter()
    const { options } = endpointWith(async () => { throw Object.assign(new Error('lost'), { kind: 'lost' }) })
    expect(await connectForSetup(nearby(printer.device), options)).toMatchObject({ ok: false, reason: 'unreachable' })
    expect(printer.calls[printer.calls.length - 1]).toBe('disconnect')
  })
})

describe('the code', () => {
  it('is carried plain and shown grouped', () => {
    expect(plainCode('f6q tdh')).toBe('F6QTDH')
    expect(groupedCode('F6QTDH')).toBe('F6Q TDH')
  })
})
