import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { forgetOwnRecents, latestRecent, readRecents, recordRecent } from '../recents'

// The literal key and cap are the contract with what is already stored on a device: asserted here as literals, not imported.
const KEY = 'm3d.control.library.recents.v1'

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null')

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('recents: what this device opened', () => {
  it('forgetting your own prints keeps the public models', () => {
    recordRecent({ id: 'mine', kind: 'own', title: 'Hex planter' }, 1000)
    recordRecent({ id: 'pub', kind: 'publication', title: 'Pocket robot' }, 2000)
    recordRecent({ id: 'mine2', kind: 'own', title: 'Cable clip' }, 3000)
    forgetOwnRecents()
    expect(readRecents().map(entry => [entry.kind, entry.id])).toEqual([['publication', 'pub']])
  })

  it('is empty when nothing was opened', () => {
    expect(readRecents()).toEqual([])
    expect(latestRecent()).toBeNull()
  })

  it('keeps the newest first', () => {
    recordRecent({ id: 'a', kind: 'own', title: 'Hex planter' }, 1000)
    recordRecent({ id: 'p1', kind: 'publication', title: 'Pocket robot', maker: 'Wren Atelier' }, 2000)
    recordRecent({ id: 'b', kind: 'own', title: 'Desk bracket' }, 3000)
    expect(readRecents().map(e => e.id)).toEqual(['b', 'p1', 'a'])
    expect(latestRecent()?.title).toBe('Desk bracket')
  })

  it('opening the same print again moves it to the front once', () => {
    recordRecent({ id: 'a', kind: 'own', title: 'Hex planter' }, 1000)
    recordRecent({ id: 'b', kind: 'own', title: 'Desk bracket' }, 2000)
    recordRecent({ id: 'a', kind: 'own', title: 'Hex planter v2' }, 3000)
    const list = readRecents()
    expect(list.map(e => e.id)).toEqual(['a', 'b'])
    expect(list[0].title).toBe('Hex planter v2')
  })

  it('an own print and a public model that share an id are two entries', () => {
    recordRecent({ id: 'x', kind: 'own', title: 'Mine' }, 1000)
    recordRecent({ id: 'x', kind: 'publication', title: 'Theirs' }, 2000)
    expect(readRecents().map(e => `${e.kind}:${e.title}`)).toEqual(['publication:Theirs', 'own:Mine'])
  })

  it('keeps twelve, dropping the oldest', () => {
    for (let i = 1; i <= 15; i++) recordRecent({ id: `p${i}`, kind: 'publication', title: `Print ${i}` }, i * 1000)
    const list = readRecents()
    expect(list).toHaveLength(12)
    expect(list[0].id).toBe('p15')
    expect(list[11].id).toBe('p4')
    expect(stored()).toHaveLength(12)
  })

  it('stores under the v1 key, and only what a card needs', () => {
    recordRecent({ id: 'p1', kind: 'publication', title: 'Pocket robot', thumbnail: 'https://library.muon3d.com/img/p1.jpg', maker: 'Wren Atelier' }, 5000)
    expect(stored()).toEqual([{ id: 'p1', kind: 'publication', title: 'Pocket robot', thumbnail: 'https://library.muon3d.com/img/p1.jpg', maker: 'Wren Atelier', opened_at: 5000 }])
  })

  it('stores nothing private: no picture of your own print, no blob or signed link, and no field beyond the six', () => {
    recordRecent({ id: 'a', kind: 'own', title: 'Hex planter', thumbnail: 'blob:http://localhost/1234' }, 1000)
    recordRecent({ id: 'b', kind: 'own', title: 'Desk bracket', thumbnail: 'https://bucket.example/t.png?X-Amz-Signature=abc' }, 2000)
    recordRecent({ id: 'p1', kind: 'publication', title: 'Signed', thumbnail: 'https://bucket.example/t.png?X-Amz-Signature=abc' }, 3000)
    recordRecent({ id: 'p2', kind: 'publication', title: 'Data', thumbnail: 'data:image/png;base64,AAAA' }, 4000)
    recordRecent({ id: 'c', kind: 'own', title: 'Extra', secret: 'token', account: 'u1' } as never, 5000)
    for (const entry of stored()) {
      expect(Object.keys(entry).sort()).toEqual(['id', 'kind', 'maker', 'opened_at', 'thumbnail', 'title'])
      expect(entry.thumbnail).toBeNull()
    }
    expect(localStorage.getItem(KEY)).not.toMatch(/token|u1|Signature|blob:|data:/)
  })

  it('does not keep an entry without an id or a title', () => {
    recordRecent({ id: '', kind: 'own', title: 'No id' }, 1000)
    recordRecent({ id: 'a', kind: 'own', title: '   ' }, 2000)
    expect(readRecents()).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('damaged JSON reads as an empty list, and the next open starts a clean one', () => {
    localStorage.setItem(KEY, '{not json')
    expect(readRecents()).toEqual([])
    recordRecent({ id: 'a', kind: 'own', title: 'Hex planter' }, 1000)
    expect(readRecents().map(e => e.id)).toEqual(['a'])
  })

  it('a stored value that is not a list reads as empty', () => {
    localStorage.setItem(KEY, JSON.stringify({ id: 'a' }))
    expect(readRecents()).toEqual([])
  })

  it('validates every entry on read: bad ones are skipped, duplicates and extras are dropped', () => {
    localStorage.setItem(KEY, JSON.stringify([
      { id: 'good', kind: 'own', title: 'Good', thumbnail: null, maker: null, opened_at: 3000 },
      { id: 'noKind', title: 'x', opened_at: 2900 },
      { id: 'badKind', kind: 'share', title: 'x', opened_at: 2800 },
      { id: 'badTime', kind: 'own', title: 'x', opened_at: 'yesterday' },
      { id: 'nan', kind: 'own', title: 'x', opened_at: null },
      { id: 7, kind: 'own', title: 'x', opened_at: 1 },
      null,
      'text',
      { id: 'good', kind: 'own', title: 'Good again', opened_at: 1000 },
      { id: 'p', kind: 'publication', title: 'Pub', thumbnail: 12, maker: { a: 1 }, secret: 'x', opened_at: 2000 }
    ]))
    expect(readRecents()).toEqual([
      { id: 'good', kind: 'own', title: 'Good', thumbnail: null, maker: null, opened_at: 3000 },
      { id: 'p', kind: 'publication', title: 'Pub', thumbnail: null, maker: null, opened_at: 2000 }
    ])
  })

  it('a store that refuses reads and writes is an empty list, never an error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('denied', 'SecurityError') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    expect(readRecents()).toEqual([])
    expect(() => recordRecent({ id: 'a', kind: 'own', title: 'Hex planter' })).not.toThrow()
    expect(latestRecent()).toBeNull()
  })

  it('a browser with no localStorage at all is an empty list too', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    expect(readRecents()).toEqual([])
    expect(() => recordRecent({ id: 'a', kind: 'own', title: 'Hex planter' })).not.toThrow()
  })
})
