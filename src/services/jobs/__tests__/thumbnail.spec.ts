import { afterEach, describe, expect, it, vi } from 'vitest'
import { jobThumbnailPath, remoteJobThumbnail, remoteThumbnails } from '../thumbnail'

const meta = {
  thumbnails: [
    { width: 32, height: 32, size: 900, relative_path: '.thumbs/a-32x32.png' },
    { width: 300, height: 300, size: 9000, relative_path: '.thumbs/a-300x300.png' }
  ]
}

const createObjectURL = URL.createObjectURL

afterEach(() => {
  remoteThumbnails.urls = {}
  URL.createObjectURL = createObjectURL
})

describe('where a job thumbnail lives', () => {
  it('is beside the job, in its own folder', () => {
    expect(jobThumbnailPath(meta, 'Harry/Parts')).toBe('/server/files/gcodes/Harry/Parts/.thumbs/a-300x300.png')
    expect(jobThumbnailPath(meta, '')).toBe('/server/files/gcodes/.thumbs/a-300x300.png')
  })

  it('encodes # and ? in names, which would cut the address short', () => {
    const odd = { thumbnails: [{ width: 300, height: 300, size: 1, relative_path: '.thumbs/a #1?-300x300.png' }] }
    expect(jobThumbnailPath(odd, 'My Parts #2')).toBe('/server/files/gcodes/My%20Parts%20%232/.thumbs/a%20%231%3F-300x300.png')
  })

  it('is empty when the file has no thumbnail', () => {
    expect(jobThumbnailPath({ thumbnails: [] }, 'x')).toBe('')
    expect(jobThumbnailPath({}, 'x')).toBe('')
  })
})

describe('a job thumbnail over the remote route', () => {
  it('is fetched as bytes through the transport, once, and shown from an object URL', async () => {
    // A plain <img src> pointed at https://muon-cloud.invalid and never loaded (5 Nov 2026).
    URL.createObjectURL = vi.fn(() => 'blob:thumb-1')
    const read = vi.fn(async () => new Blob(['png']))
    expect(remoteJobThumbnail('p1', '/server/files/gcodes/Harry/.thumbs/a.png', 5, read)).toBe('')
    expect(remoteJobThumbnail('p1', '/server/files/gcodes/Harry/.thumbs/a.png', 5, read)).toBe('')
    await vi.waitFor(() => expect(remoteJobThumbnail('p1', '/server/files/gcodes/Harry/.thumbs/a.png', 5, read)).toBe('blob:thumb-1'))
    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith('/server/files/gcodes/Harry/.thumbs/a.png')
  })

  it('stays empty, and does not retry in a loop, when the read fails', async () => {
    const read = vi.fn(async () => { throw new Error('HTTP 404') })
    remoteJobThumbnail('p1', '/x.png', 1, read)
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    await Promise.resolve()
    expect(remoteJobThumbnail('p1', '/x.png', 1, read)).toBe('')
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('reads again when the file changed', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:new')
    const read = vi.fn(async () => new Blob(['png']))
    remoteJobThumbnail('p1', '/x.png', 1, read)
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    remoteJobThumbnail('p1', '/x.png', 2, read)
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(2))
  })
})
