import { afterEach, describe, expect, it, vi } from 'vitest'
import { PICTURES_KEPT, printerPicture, printerPictures } from '../thumbnails'

// How many pictures are kept, written out so the tests don't agree with any value.
const KEPT = 300

const createObjectURL = URL.createObjectURL
const revokeObjectURL = URL.revokeObjectURL

let made = 0
function objectUrls () {
  URL.createObjectURL = vi.fn(() => `blob:${++made}`)
  URL.revokeObjectURL = vi.fn()
  return URL.revokeObjectURL as ReturnType<typeof vi.fn>
}

const read = vi.fn(async () => new Blob(['png']))

afterEach(() => {
  printerPictures.urls = {}
  URL.createObjectURL = createObjectURL
  URL.revokeObjectURL = revokeObjectURL
  read.mockClear()
})

describe('the pictures read through Muon3D', () => {
  it('keeps a bounded number', () => {
    expect(PICTURES_KEPT).toBe(KEPT)
  })

  it('gives back the old picture when the file changes', async () => {
    const revoke = objectUrls()
    printerPicture('Boxwood', '/server/files/gcodes/.thumbs/cube.png?date=1', read)
    await vi.waitFor(() => expect(printerPicture('Boxwood', '/server/files/gcodes/.thumbs/cube.png?date=1', read)).toMatch(/^blob:/))
    const old = printerPictures.urls['Boxwood|/server/files/gcodes/.thumbs/cube.png?date=1'] as string

    printerPicture('Boxwood', '/server/files/gcodes/.thumbs/cube.png?date=2', read)
    await vi.waitFor(() => expect(printerPicture('Boxwood', '/server/files/gcodes/.thumbs/cube.png?date=2', read)).toMatch(/^blob:/))

    expect(revoke).toHaveBeenCalledWith(old)
    expect(Object.keys(printerPictures.urls)).toEqual(['Boxwood|/server/files/gcodes/.thumbs/cube.png?date=2'])
    // Another printer's file of the same name is its own picture.
    printerPicture('Walnut', '/server/files/gcodes/.thumbs/cube.png?date=3', read)
    await vi.waitFor(() => expect(Object.keys(printerPictures.urls)).toHaveLength(2))
    expect(revoke).toHaveBeenCalledTimes(1)
  })

  it('gives back the least recently shown when it holds too many, and reads none twice while kept', async () => {
    const revoke = objectUrls()
    const path = (n: number) => `/server/files/gcodes/.thumbs/part${n}.png?date=1`
    for (let n = 0; n < KEPT; n++) printerPicture('Boxwood', path(n), read)
    await vi.waitFor(() => expect(Object.keys(printerPictures.urls)).toHaveLength(KEPT))
    expect(read).toHaveBeenCalledTimes(KEPT)

    // Shown again: no read, and it's now the most recent.
    const first = printerPicture('Boxwood', path(0), read)
    expect(read).toHaveBeenCalledTimes(KEPT)

    printerPicture('Boxwood', path(KEPT), read)
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledTimes(1))
    expect(Object.keys(printerPictures.urls)).toHaveLength(KEPT)
    expect(printerPictures.urls[`Boxwood|${path(1)}`]).toBeUndefined()
    expect(printerPictures.urls[`Boxwood|${path(0)}`]).toBe(first)
  })
})
