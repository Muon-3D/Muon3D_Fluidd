import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountApi, libraryDefaultsView, LICENCES, SUGGESTED_LICENCE } from '../api'

describe('the Library defaults for new things', () => {
  it('start private, with CC BY 4.0 only suggested', () => {
    const view = libraryDefaultsView({ library_defaults: { visibility: 'private', licence: null } })
    expect(view).toEqual({ supported: true, visibility: 'private', licence: 'CC-BY-4.0', licenceChosen: false })
    expect(SUGGESTED_LICENCE).toBe('CC-BY-4.0')
    expect(LICENCES.find(l => l.id === SUGGESTED_LICENCE)?.label).toBe('CC BY 4.0')
  })

  it('shows the choice once the person has made one', () => {
    const view = libraryDefaultsView({ library_defaults: { visibility: 'public', licence: 'CC0-1.0' } })
    expect(view).toEqual({ supported: true, visibility: 'public', licence: 'CC0-1.0', licenceChosen: true })
  })

  it('does not claim support without an explicit defaults object', () => {
    expect(libraryDefaultsView({})).toEqual({ supported: false, visibility: 'private', licence: 'CC-BY-4.0', licenceChosen: false })
    expect(libraryDefaultsView(null).supported).toBe(false)
    expect(libraryDefaultsView(null).visibility).toBe('private')
    expect(libraryDefaultsView(null).licenceChosen).toBe(false)
  })

  it.each([null, {}, { visibility: 'shared', licence: null }, { visibility: 'private' }, { visibility: null, licence: null }, { visibility: 'private', licence: 'MIT' }])('does not invent a choice from malformed defaults %j', (saved) => {
    const view = libraryDefaultsView({ library_defaults: saved } as unknown as Parameters<typeof libraryDefaultsView>[0])
    expect(view.supported).toBe(false)
    expect(view.licenceChosen).toBe(false)
  })
})

describe('saving the Library defaults', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', 'https://control.example.test')
    localStorage.setItem('muon.cloud.token', 'access-1')
    fetchMock = vi.fn()
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ preferences: { library_defaults: { visibility: 'public', licence: null } } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

  it('PUTs only what was changed, under library_defaults', async () => {
    const saved = await accountApi.setLibraryDefaults({ visibility: 'public' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/v1/me/preferences')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ library_defaults: { visibility: 'public' } })
    expect(saved.library_defaults).toEqual({ visibility: 'public', licence: null })
  })

  it('sends nothing for the suggestion: only an explicit licence is saved', async () => {
    await accountApi.setLibraryDefaults({ licence: 'CC-BY-SA-4.0' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ library_defaults: { licence: 'CC-BY-SA-4.0' } })
  })

  it('can clear the licence without overwriting visibility', async () => {
    await accountApi.setLibraryDefaults({ licence: null })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ library_defaults: { licence: null } })
  })

  it('does not report a refused write as saved', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'invalid', message: 'Unknown licence' } }), { status: 400 }))
    await expect(accountApi.setLibraryDefaults({ licence: 'MIT' })).rejects.toMatchObject({ status: 400 })
  })
})
