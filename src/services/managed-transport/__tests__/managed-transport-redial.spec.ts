import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManagedIrohPrinterTransport } from '../index'
import { MAX_FLAP_DELAY_MS, REGRANT_AFTER_MS, REGRANT_WAIT_MS, STABLE_AFTER_MS } from '../managedIrohTransport'
import type { AuthorizedManagedRelaySession, ManagedIrohRelay } from '../index'

function session (id: string): AuthorizedManagedRelaySession {
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: id,
    tenantId: 'tenant-muon',
    printerId: 'printer-17',
    relayUrl: 'https://relay.example.test',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }
}

/** A relay whose requests fail once its connection is "lost". */
function relay (name: string, log: string[]) {
  let lost = false
  const r: ManagedIrohRelay & { lose: () => void } = {
    fetch: async () => {
      if (lost) throw new Error('connection lost')
      log.push(`${name}:fetch`)
      return new Response(null, { status: 204 })
    },
    openWebSocket: async () => { throw new Error('not used') },
    close: () => log.push(`${name}:close`),
    lose: () => { lost = true }
  }
  return r
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ManagedIrohPrinterTransport re-dialling', () => {
  it.each([401, 403])('HTTP %s is route-neutral and never redials', async status => {
    const log: string[] = []
    const shared = relay('shared', log)
    shared.fetch = vi.fn(async () => new Response('policy refused', { status }))
    const openRelay = vi.fn(async () => shared)
    const onStatusChange = vi.fn()
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }), onStatusChange })
    expect((await transport.fetch('/server/muon/identity')).status).toBe(status)
    await transport.fetch('/server/info')
    expect(openRelay).toHaveBeenCalledOnce()
    expect(log).not.toContain('shared:close')
    expect(transport.status.connection).toBe('connected')
    expect(onStatusChange.mock.calls.some(([s]) => s.connection === 'unavailable')).toBe(false)
  })

  it.each([{ status: 401 }, { response: { status: 403 } }, new Error('muon-link policy refused this request')])('a rejected request refusal preserves the connection: %j', async refusal => {
    const log: string[] = []
    const shared = relay('shared', log)
    const fetch = shared.fetch
    shared.fetch = async path => {
      if (path === '/server/muon/identity') throw refusal
      return fetch(path)
    }
    const openRelay = vi.fn(async () => shared)
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await expect(transport.fetch('/server/muon/identity')).rejects.toBe(refusal)
    await transport.fetch('/server/info')
    expect(openRelay).toHaveBeenCalledOnce()
    expect(log).toEqual(['shared:fetch'])
    expect(transport.status.connection).toBe('connected')
  })
  it('never redials a shared transport after its owner closes it', async () => {
    const log: string[] = []
    const openRelay = vi.fn(async () => relay('shared', log))
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    transport.close()
    await expect(transport.fetch('/server/info')).rejects.toThrow(/closed/)
    await expect(transport.openWebSocket('/websocket')).rejects.toThrow(/closed/)
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(transport.status.connection).toBe('closed')
  })
  it('keeps the shared connection when one HTTP caller cancels its request', async () => {
    const log: string[] = []
    const shared = relay('shared', log)
    const originalFetch = shared.fetch
    shared.fetch = async (path, init) => {
      if (init?.signal?.aborted) throw init.signal.reason
      return originalFetch(path, init)
    }
    const openRelay = vi.fn(async () => shared)
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(transport.fetch('/server/files', { signal: cancelled.signal })).rejects.toMatchObject({ name: 'AbortError' })
    await transport.fetch('/server/info')
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(log).toEqual(['shared:fetch', 'shared:fetch'])
  })
  it('dials a new relay when the cached one closed itself (cancelled Bluetooth upload)', async () => {
    const log: string[] = []
    const first: ManagedIrohRelay & { closed: boolean } = Object.assign(relay('first', log), { closed: false })
    const second = relay('second', log)
    const relays = [first, second]
    const openRelay = vi.fn(async () => relays.shift()!)
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    first.closed = true
    await transport.fetch('/server/info')
    expect(openRelay).toHaveBeenCalledTimes(2)
    expect(log).toEqual(['first:fetch', 'second:fetch'])
  })
  it('keeps the connection when the printer stops one upload stream (STOP_SENDING)', async () => {
    // Harry, 11 Nov: an upload over the cloud route failed with "sending
    // stopped by peer: error 0", and dropping the relay then failed the
    // developer-mode read and the next upload with "closed".
    const log: string[] = []
    const shared = relay('shared', log)
    const originalFetch = shared.fetch
    shared.fetch = async (path, init) => {
      if (path === '/server/files/upload') throw new Error('sending stopped by peer: error 0')
      return originalFetch(path, init)
    }
    const openRelay = vi.fn(async () => shared)
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    await expect(transport.fetch('/server/files/upload', { method: 'POST', body: 'x' })).rejects.toThrow('sending stopped by peer: error 0')
    await transport.fetch('/server/muon/dev_mode')
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(log).toEqual(['shared:fetch', 'shared:fetch'])
  })
  it('drops a relay that failed a request, and dials a new one for the next', async () => {
    // Before this, a dead connection was kept for the life of the selection
    // and every request failed until the page was reloaded.
    const log: string[] = []
    const first = relay('first', log)
    const second = relay('second', log)
    const openRelay = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: session('grant-1'),
      createEndpoint: async () => ({ openRelay, close: () => {} })
    })

    await transport.fetch('/server/info')
    await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
    first.lose()
    await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
    await transport.fetch('/server/info')

    expect(openRelay).toHaveBeenCalledTimes(2)
    expect(log).toEqual(['first:fetch', 'first:close', 'second:fetch'])
  })

  it('waits longer after each failed dial, and asks for a new handoff after two', async () => {
    const log: string[] = []
    const sessions: string[] = []
    const openRelay = vi.fn(async (s: AuthorizedManagedRelaySession) => {
      sessions.push(s.sessionId)
      if (s.sessionId === 'grant-1') throw new Error('refused')
      return relay('fresh', log)
    })
    const reauthorize = vi.fn(async () => session('grant-2'))
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: session('grant-1'),
      createEndpoint: async () => ({ openRelay, close: () => {} }),
      reauthorize
    })

    await expect(transport.fetch('/server/info')).rejects.toThrow('refused')

    // The second dial waits a second before going out.
    const second = transport.fetch('/server/info')
    second.catch(() => {})
    await vi.advanceTimersByTimeAsync(999)
    expect(openRelay).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await expect(second).rejects.toThrow('refused')
    expect(reauthorize).not.toHaveBeenCalled()

    // Two failures: the third dial asks for a new handoff first, two seconds on.
    const third = transport.fetch('/server/info')
    await vi.advanceTimersByTimeAsync(2000)
    await third

    expect(reauthorize).toHaveBeenCalledTimes(1)
    expect(sessions).toEqual(['grant-1', 'grant-1', 'grant-2'])
    expect(log).toEqual(['fresh:fetch'])
  })

  // KAN-3636: the owner got the printer's "let this device in" prompt because a
  // redial reached a printer that had forgotten the console's grant for the key.
  describe('the owner is admitted by a grant, never by the panel', () => {
    function lostThenRedial (reauthorize: () => Promise<AuthorizedManagedRelaySession>) {
      const events: string[] = []
      const first = relay('first', events)
      let dials = 0
      const openRelay = vi.fn(async (s: AuthorizedManagedRelaySession): Promise<ManagedIrohRelay> => {
        events.push(`dial:${s.sessionId}`)
        return ++dials === 1 ? first : relay('second', events)
      })
      const transport = new ManagedIrohPrinterTransport({
        authorizedSession: session('grant-1'),
        createEndpoint: async () => ({ openRelay, close: () => {} }),
        reauthorize: async () => { events.push('grant-asked'); return reauthorize() }
      })
      return { events, first, transport, openRelay }
    }

    it('asks for a fresh grant before it redials, and dials with that grant', async () => {
      const { events, first, transport } = lostThenRedial(async () => session('grant-2'))
      await transport.fetch('/server/info')
      // The first dial uses the handoff the transport was made with.
      expect(events).toEqual(['dial:grant-1', 'first:fetch'])
      await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
      first.lose()
      await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
      await transport.fetch('/server/info')
      expect(events.slice(2)).toEqual(['first:close', 'grant-asked', 'dial:grant-2', 'second:fetch'])
    })

    it('still redials with the grant it has when the console does not answer', async () => {
      const { events, first, transport } = lostThenRedial(() => new Promise(() => {}))
      await transport.fetch('/server/info')
      await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
      first.lose()
      await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
      const again = transport.fetch('/server/info')
      await vi.advanceTimersByTimeAsync(REGRANT_WAIT_MS)
      await again
      expect(events.slice(-3)).toEqual(['grant-asked', 'dial:grant-1', 'second:fetch'])
    })

    it('uses the redial-only refresh when one is given, and dials on when it is skipped', async () => {
      const events: string[] = []
      const first = relay('first', events)
      let dials = 0
      const openRelay = vi.fn(async (s: AuthorizedManagedRelaySession): Promise<ManagedIrohRelay> => {
        events.push(`dial:${s.sessionId}`)
        return ++dials === 1 ? first : relay('second', events)
      })
      const reauthorize = vi.fn(async () => session('hard'))
      const transport = new ManagedIrohPrinterTransport({
        authorizedSession: session('grant-1'),
        createEndpoint: async () => ({ openRelay, close: () => {} }),
        reauthorize,
        regrant: async () => { throw new Error('console does not see the printer online') }
      })
      await transport.fetch('/server/info')
      await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
      first.lose()
      await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
      await transport.fetch('/server/info')
      expect(reauthorize).not.toHaveBeenCalled()
      expect(events.slice(-2)).toEqual(['dial:grant-1', 'second:fetch'])
    })

    it('still redials when the console refuses', async () => {
      const { events, first, transport } = lostThenRedial(async () => { throw new Error('503') })
      await transport.fetch('/server/info')
      await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
      first.lose()
      await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
      await transport.fetch('/server/info')
      expect(events.slice(-2)).toEqual(['dial:grant-1', 'second:fetch'])
    })
  })

  // KAN-6081: the console minted a grant every ~4-5 s because each relay drop
  // was followed by a redial that asked for a new grant, with no backoff.
  describe('a flapping relay does not hammer the console', () => {
    type Internals = { relayPromise: Promise<ManagedIrohRelay> | null, dropRelay: (r: Promise<ManagedIrohRelay>) => void, flaps: number }
    function setup (presenceEpoch?: () => number) {
      const dials: number[] = []
      const openRelay = vi.fn(async () => { dials.push(Date.now()); return relay('r', []) })
      const regrant = vi.fn(async () => session('fresh'))
      const transport = new ManagedIrohPrinterTransport({
        authorizedSession: session('grant-1'),
        createEndpoint: async () => ({ openRelay, close: () => {} }),
        regrant,
        presenceEpoch
      })
      const inner = transport as unknown as Internals
      /** Lets the transport run until the request settles, one second of fake time at a time. */
      const settle = async (p: Promise<unknown>) => {
        const state = { done: false }
        p.then(() => { state.done = true }, () => { state.done = true })
        for (let i = 0; i < 200 && !state.done; i++) await vi.advanceTimersByTimeAsync(1000)
        expect(state.done).toBe(true)
      }
      /** The relay in hand fails, as a transport error does. */
      const drop = () => inner.dropRelay(inner.relayPromise!)
      return { openRelay, regrant, transport, inner, dials, settle, drop }
    }

    it('asks for no new grant while a relay keeps dropping within the window', async () => {
      const { regrant, openRelay, transport, settle, drop } = setup()
      for (let i = 0; i < 8; i++) {
        await settle(transport.fetch('/server/info'))
        drop()
      }
      expect(openRelay).toHaveBeenCalledTimes(8)
      expect(regrant).not.toHaveBeenCalled()
    })

    it('asks again once the grant is old, and when the console saw the printer return', async () => {
      let epoch = 0
      const { regrant, transport, settle, drop } = setup(() => epoch)
      await settle(transport.fetch('/server/info'))
      await vi.advanceTimersByTimeAsync(STABLE_AFTER_MS)
      drop()
      await settle(transport.fetch('/server/info'))
      expect(regrant).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(STABLE_AFTER_MS)
      epoch = 1
      drop()
      await settle(transport.fetch('/server/info'))
      expect(regrant).toHaveBeenCalledTimes(1)
      // the epoch was taken with the new grant: no second ask for the same offline blip
      await vi.advanceTimersByTimeAsync(STABLE_AFTER_MS)
      drop()
      await settle(transport.fetch('/server/info'))
      expect(regrant).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(REGRANT_AFTER_MS)
      drop()
      await settle(transport.fetch('/server/info'))
      expect(regrant).toHaveBeenCalledTimes(2)
    })

    it('backs off exponentially to a cap, and a stable connection resets it', async () => {
      const { transport, inner, dials, settle, drop } = setup()
      const waits: number[] = []
      await settle(transport.fetch('/server/info'))
      for (let i = 0; i < 8; i++) {
        const droppedAt = Date.now()
        drop()
        await settle(transport.fetch('/server/info'))
        waits.push(dials[dials.length - 1] - droppedAt)
      }
      // each wait is at least as long as the last (to a 1 s polling step), none past the cap
      for (let i = 1; i < waits.length; i++) expect(waits[i]).toBeGreaterThanOrEqual(waits[i - 1])
      expect(waits[3]).toBeGreaterThan(waits[0])
      expect(Math.max(...waits)).toBeLessThanOrEqual(MAX_FLAP_DELAY_MS + 1000)
      expect(inner.flaps).toBe(8)
      // a relay that stays up past the window resets it: the next redial is not held back
      await vi.advanceTimersByTimeAsync(STABLE_AFTER_MS)
      const droppedAt = Date.now()
      drop()
      expect(inner.flaps).toBe(0)
      await settle(transport.fetch('/server/info'))
      expect(dials[dials.length - 1] - droppedAt).toBeLessThanOrEqual(1000)
    })
  })
})
