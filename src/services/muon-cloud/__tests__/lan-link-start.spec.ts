import { afterEach, describe, expect, it, vi } from 'vitest'
import { lanCodeOutcome, showLanCode } from '../discovery'

// discovery.ts reads the store and the Muon3D API client at import. Neither is
// used by the code under test, and loading the real store is slow.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('../api', () => ({ cloudApi: {} }))

const API = 'http://192.168.1.37'

type Answer = { status: number, body?: unknown }

function stubPrinter (answer: Answer) {
  const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async () => ({
    ok: answer.status >= 200 && answer.status < 300,
    status: answer.status,
    json: async () => {
      if (answer.body === undefined) throw new SyntaxError('no body')
      return answer.body
    }
  }) as Response)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('showLanCode', () => {
  it('posts a JSON body, which Moonraker needs before it forwards the start', async () => {
    const fetch = stubPrinter({ status: 200, body: { result: { phase: 'connecting' } } })

    await showLanCode(API)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe(`${API}/server/muon/link/start`)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe('{}')
  })

  it('returns where the link stands', async () => {
    stubPrinter({ status: 200, body: { result: { phase: 'connecting' } } })
    await expect(showLanCode(API)).resolves.toEqual({ phase: 'connecting' })
  })

  it.each(['offer', 'linked'])('returns %s when someone got there first', async phase => {
    stubPrinter({ status: 200, body: { result: { phase, account: 'Jack' } } })
    await expect(showLanCode(API)).resolves.toEqual({ phase, account: 'Jack' })
  })

  it('treats an answer without a phase as connecting', async () => {
    stubPrinter({ status: 200 })
    await expect(showLanCode(API)).resolves.toEqual({ phase: 'connecting' })
  })

  it('says to wait when the printer is rate limiting, rather than passing on its message', async () => {
    stubPrinter({
      status: 429,
      body: { error: { code: 429, message: 'muon_link: too many link starts, try again in a minute' } }
    })
    await expect(showLanCode(API)).rejects.toThrow(
      'The printer has been asked for a code too many times. Wait a minute, then try again.'
    )
  })

  it('passes on any other refusal', async () => {
    stubPrinter({ status: 403, body: { error: { code: 403, message: 'muon_link: Origin is not this printer' } } })
    await expect(showLanCode(API)).rejects.toThrow('muon_link: Origin is not this printer')
  })

  it('names the status when a refusal has no message', async () => {
    stubPrinter({ status: 502 })
    await expect(showLanCode(API)).rejects.toThrow('HTTP 502')
  })
})

describe('lanCodeOutcome', () => {
  it('asks the person to type the code while one is on its way', () => {
    for (const phase of ['connecting', 'code']) {
      expect(lanCodeOutcome('Boxwood', { phase })).toEqual({
        note: 'Boxwood is showing a code on its screen now. Type it below.'
      })
    }
  })

  it('points at the screen when an offer is already waiting there', () => {
    const outcome = lanCodeOutcome('Boxwood', { phase: 'offer', account: 'jack@example.com' })
    expect(outcome.error).toBeUndefined()
    expect(outcome.note).toContain('already asking on its screen')
    expect(outcome.note).toContain('jack@example.com')
    expect(outcome.note).not.toContain('Type it below')
  })

  it('is an error when the printer is already linked', () => {
    const outcome = lanCodeOutcome('Boxwood', { phase: 'linked' })
    expect(outcome.note).toBeUndefined()
    expect(outcome.error).toBe('Boxwood is already linked to an account. Its owner must unlink it first.')
  })
})
