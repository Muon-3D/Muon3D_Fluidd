import { afterEach, describe, expect, it, vi } from 'vitest'
import { cancelQueuedThumbnail, clearRemoteThumbnails, jobThumbnailPath, MAX_CACHED, MAX_READING, MAX_TRIES, remoteJobThumbnail, remoteThumbnails, retryFailedThumbnails, RETRY_AFTER_MS, thumbnailKey } from '../thumbnail'

const meta = {
  thumbnails: [
    { width: 32, height: 32, size: 900, relative_path: '.thumbs/a-32x32.png' },
    { width: 300, height: 300, size: 9000, relative_path: '.thumbs/a-300x300.png' }
  ]
}

const createObjectURL = URL.createObjectURL
// jsdom has neither object-URL function.
URL.revokeObjectURL = URL.revokeObjectURL ?? (() => {})

afterEach(() => {
  vi.useRealTimers()
  clearRemoteThumbnails()
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

  it('does not ask again when the printer says the picture is not there', async () => {
    const read = vi.fn(async () => { throw Object.assign(new Error('HTTP 404'), { response: { status: 404 } }) })
    remoteJobThumbnail('p1', '/x.png', 1, read)
    await vi.waitFor(() => expect(remoteThumbnails.urls['p1|/x.png|1']).toBeNull())
    expect(remoteJobThumbnail('p1', '/x.png', 1, read)).toBe('')
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('asks again after a dropped read, and shows the picture once one succeeds', async () => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:second-try')
    const read = vi.fn()
      .mockRejectedValueOnce(new Error('stream closed'))
      .mockResolvedValue(new Blob(['png']))
    remoteJobThumbnail('p1', '/y.png', 1, read)
    await vi.advanceTimersByTimeAsync(RETRY_AFTER_MS + 10)
    expect(remoteJobThumbnail('p1', '/y.png', 1, read)).toBe('')
    await vi.advanceTimersByTimeAsync(10)
    expect(remoteJobThumbnail('p1', '/y.png', 1, read)).toBe('blob:second-try')
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('gives up after a few tries, and stays empty', async () => {
    vi.useFakeTimers()
    const read = vi.fn(async () => { throw new Error('stream closed') })
    for (let i = 0; i < MAX_TRIES; i++) {
      remoteJobThumbnail('p1', '/z.png', 1, read)
      await vi.advanceTimersByTimeAsync(RETRY_AFTER_MS + 10)
    }
    expect(remoteJobThumbnail('p1', '/z.png', 1, read)).toBe('')
    await vi.advanceTimersByTimeAsync(RETRY_AFTER_MS * 3)
    expect(read).toHaveBeenCalledTimes(MAX_TRIES)
  })

  it('reads only a few pictures at once', async () => {
    let open = 0
    let peak = 0
    const release: Array<() => void> = []
    const read = vi.fn(() => new Promise<Blob>((resolve) => {
      open++
      peak = Math.max(peak, open)
      release.push(() => { open--; resolve(new Blob(['png'])) })
    }))
    URL.createObjectURL = vi.fn(() => 'blob:x')
    for (let i = 0; i < MAX_READING + 3; i++) remoteJobThumbnail('p1', `/q${i}.png`, 1, read)
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(MAX_READING))
    release.splice(0).forEach(r => r())
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(MAX_READING + 3))
    release.splice(0).forEach(r => r())
    expect(peak).toBe(MAX_READING)
  })

  it('revokes the old picture when the file changed, and keeps only the new one', async () => {
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:v${++n}`)
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const read = vi.fn(async () => new Blob(['png']))
    remoteJobThumbnail('p1', '/f.png', 1, read)
    await vi.waitFor(() => expect(remoteJobThumbnail('p1', '/f.png', 1, read)).toBe('blob:v1'))
    remoteJobThumbnail('p1', '/f.png', 2, read)
    await vi.waitFor(() => expect(remoteJobThumbnail('p1', '/f.png', 2, read)).toBe('blob:v2'))
    expect(revoke).toHaveBeenCalledWith('blob:v1')
    expect(Object.keys(remoteThumbnails.urls)).toEqual([thumbnailKey('p1', '/f.png', 2)])
    revoke.mockRestore()
  })

  it('keeps a bounded number of pictures, revoking the oldest', async () => {
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:c${++n}`)
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const read = vi.fn(async () => new Blob(['png']))
    for (let i = 0; i < MAX_CACHED + 5; i++) {
      remoteJobThumbnail('p1', `/c${i}.png`, 1, read)
      await vi.waitFor(() => expect(remoteJobThumbnail('p1', `/c${i}.png`, 1, read)).not.toBe(''))
    }
    expect(Object.keys(remoteThumbnails.urls)).toHaveLength(MAX_CACHED)
    expect(revoke).toHaveBeenCalledTimes(5)
    expect(revoke).toHaveBeenCalledWith('blob:c1')
    revoke.mockRestore()
  }, 30000)

  it('gives a picture that gave up another go when Jobs is opened again', async () => {
    const read = vi.fn()
      .mockRejectedValue(Object.assign(new Error('HTTP 500'), { response: { status: 500 } }))
    vi.useFakeTimers()
    for (let i = 0; i < MAX_TRIES; i++) {
      remoteJobThumbnail('p1', '/r.png', 1, read)
      await vi.advanceTimersByTimeAsync(RETRY_AFTER_MS + 10)
    }
    expect(remoteThumbnails.urls[thumbnailKey('p1', '/r.png', 1)]).toBeNull()
    URL.createObjectURL = vi.fn(() => 'blob:back')
    read.mockResolvedValue(new Blob(['png']))
    retryFailedThumbnails()
    expect(remoteThumbnails.urls[thumbnailKey('p1', '/r.png', 1)]).toBeUndefined()
    remoteJobThumbnail('p1', '/r.png', 1, read)
    await vi.advanceTimersByTimeAsync(10)
    expect(remoteJobThumbnail('p1', '/r.png', 1, read)).toBe('blob:back')
  })

  it('drops a read that is still waiting for its turn when its row is gone', async () => {
    const release: Array<() => void> = []
    const read = vi.fn(() => new Promise<Blob>(resolve => release.push(() => resolve(new Blob(['png'])))))
    URL.createObjectURL = vi.fn(() => 'blob:x')
    for (let i = 0; i < MAX_READING + 2; i++) remoteJobThumbnail('p1', `/w${i}.png`, 1, read)
    expect(read).toHaveBeenCalledTimes(MAX_READING)
    cancelQueuedThumbnail(thumbnailKey('p1', `/w${MAX_READING}.png`, 1))
    release.splice(0).forEach(r => r())
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(MAX_READING + 1))
    expect(read).not.toHaveBeenCalledWith(`/w${MAX_READING}.png`)
    release.splice(0).forEach(r => r())
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
