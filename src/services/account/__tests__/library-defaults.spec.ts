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

  it('reads a missing object as private and not chosen, and no preferences at all as unsupported', () => {
    expect(libraryDefaultsView({})).toEqual({ supported: true, visibility: 'private', licence: 'CC-BY-4.0', licenceChosen: false })
    expect(libraryDefaultsView(null).supported).toBe(false)
    expect(libraryDefaultsView(null).visibility).toBe('private')
    expect(libraryDefaultsView(null).licenceChosen).toBe(false)
  })
})

describe('saving the Library defaults', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', 'https://control.example.test')
    localStorage.setItem('muon.cloud.token', 'access-1')
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ preferences: { library_defaults: { visibility: 'public', licence: null } } }), { status: 200 }))
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
})
