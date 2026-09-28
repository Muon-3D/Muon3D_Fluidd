import { afterEach, describe, expect, it, vi } from 'vitest'
import { lanLinkAvailability, lanLinkStatus } from '../discovery'

// discovery.ts reads the store and the Muon3D API client at import. Neither is
// used by the code under test, and loading the real store is slow.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('../api', () => ({ cloudApi: {} }))

const API = 'http://192.168.1.153'

function stubPrinter (answer: { status: number, body?: unknown } | Error) {
  const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async () => {
    if (answer instanceof Error) throw answer
    return {
      ok: answer.status >= 200 && answer.status < 300,
      status: answer.status,
      json: async () => {
        if (answer.body === undefined) throw new SyntaxError('no body')
        return answer.body
      }
    } as Response
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lanLinkStatus', () => {
  it('reads the phase the printer reports', async () => {
    const fetch = stubPrinter({ status: 200, body: { result: { phase: 'unlinked' } } })
    await expect(lanLinkStatus(API)).resolves.toEqual({ phase: 'unlinked' })
    expect(fetch.mock.calls[0][0]).toBe(`${API}/server/muon/link`)
  })

  it('calls a 404 unsupported: that MuonOS has no account link', async () => {
    // KAN-423: a printer on the newest build, 20260926130029-2335fc1, answered
    // 404 here, and Fluidd told its owner to update it.
    stubPrinter({ status: 404, body: { error: { code: 404, message: 'Not Found' } } })
    await expect(lanLinkStatus(API)).resolves.toEqual({ phase: 'unsupported' })
  })

  it('calls a network failure unreachable, which says nothing about the version', async () => {
    stubPrinter(new TypeError('Failed to fetch'))
    await expect(lanLinkStatus(API)).resolves.toEqual({ phase: 'unreachable' })
  })

  it('calls a server error unreachable too', async () => {
    stubPrinter({ status: 503, body: { error: { message: 'muon-link is not answering' } } })
    await expect(lanLinkStatus(API)).resolves.toEqual({ phase: 'unreachable' })
  })

  it('keeps muon-link\'s own unavailable, the phase for no orchestrator', async () => {
    stubPrinter({ status: 200, body: { result: { phase: 'unavailable' } } })
    await expect(lanLinkStatus(API)).resolves.toEqual({ phase: 'unavailable' })
  })
})

describe('lanLinkAvailability', () => {
  it('never tells the owner of an up-to-date printer to update it', () => {
    for (const phase of ['unsupported', 'unavailable', 'unreachable', 'something-new']) {
      const { canShow, note } = lanLinkAvailability({ phase })
      expect(canShow).toBe(false)
      expect(note).not.toMatch(/update/i)
    }
  })

  it('gives each reason its own sentence', () => {
    const notes = ['unsupported', 'unavailable', 'unreachable']
      .map(phase => lanLinkAvailability({ phase }).note)
    expect(new Set(notes).size).toBe(3)
    expect(notes[0]).toMatch(/MuonOS/)
    expect(notes[2]).toMatch(/this browser/)
  })

  it('still offers a code for an unlinked printer', () => {
    expect(lanLinkAvailability({ phase: 'unlinked' }).canShow).toBe(true)
  })
})
