import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forgetOwnAvatar, loadOwnAvatar, ownAvatar, publicAvatarUrl, removeOwnAvatar, setOwnAvatar } from '../avatar'

const photo = vi.fn()
vi.mock('../community', () => ({ communityApi: { photo: (...a: unknown[]) => photo(...a) } }))

let n = 0
const created: string[] = []
const revoked: string[] = []

beforeEach(() => {
  forgetOwnAvatar()
  photo.mockReset()
  created.length = 0
  revoked.length = 0
  URL.createObjectURL = vi.fn(() => { const u = `blob:test/${++n}`; created.push(u); return u }) as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn((u: string) => { revoked.push(u) })
})

const blob = () => new Blob(['x'], { type: 'image/png' })
const notFound = () => Object.assign(new Error('No photo.'), { status: 404 })

describe('own avatar service', () => {
  it('fetches once and shares it: later loads and parallel loads reuse the first', async () => {
    photo.mockResolvedValue(blob())
    await Promise.all([loadOwnAvatar(), loadOwnAvatar()])
    await loadOwnAvatar()
    expect(photo).toHaveBeenCalledTimes(1)
    expect(ownAvatar.url).toBe(created[0])
  })

  it('a 404 leaves no photo (initials) and is not asked again', async () => {
    photo.mockRejectedValue(notFound())
    await loadOwnAvatar()
    await loadOwnAvatar()
    expect(ownAvatar.url).toBeNull()
    expect(photo).toHaveBeenCalledTimes(1)
  })

  it('an unreachable service leaves initials and tries again next time', async () => {
    photo.mockRejectedValueOnce(Object.assign(new Error('offline'), { status: 0 }))
    await loadOwnAvatar()
    expect(ownAvatar.url).toBeNull()
    photo.mockResolvedValueOnce(blob())
    await loadOwnAvatar()
    expect(ownAvatar.url).toBe(created[0])
  })

  it('a forced reload replaces the photo and revokes the old blob URL', async () => {
    photo.mockResolvedValue(blob())
    await loadOwnAvatar()
    await loadOwnAvatar(true)
    expect(created).toHaveLength(2)
    expect(revoked).toEqual([created[0]])
    expect(ownAvatar.url).toBe(created[1])
  })

  it('setting a photo shows it at once, revokes the old one, and beats a load still in flight', async () => {
    let finish!: (b: Blob) => void
    photo.mockReturnValueOnce(new Promise<Blob>(resolve => { finish = resolve }))
    const pending = loadOwnAvatar()
    setOwnAvatar(blob())
    expect(ownAvatar.url).toBe(created[0])
    finish(blob())
    await pending
    expect(ownAvatar.url).toBe(created[0])
    expect(created).toHaveLength(1)
    setOwnAvatar(blob())
    expect(revoked).toEqual([created[0]])
  })

  it('removing the photo revokes it and leaves initials without asking again', async () => {
    setOwnAvatar(blob())
    removeOwnAvatar()
    expect(ownAvatar.url).toBeNull()
    expect(revoked).toEqual([created[0]])
    await loadOwnAvatar()
    expect(photo).not.toHaveBeenCalled()
  })

  it('signing out revokes the photo, drops a load in flight, and the next account fetches afresh', async () => {
    let finish!: (b: Blob) => void
    photo.mockReturnValueOnce(new Promise<Blob>(resolve => { finish = resolve }))
    const pending = loadOwnAvatar()
    forgetOwnAvatar()
    finish(blob())
    await pending
    expect(ownAvatar.url).toBeNull()
    expect(created).toHaveLength(0)
    photo.mockResolvedValue(blob())
    await loadOwnAvatar()
    expect(ownAvatar.url).toBe(created[0])
    forgetOwnAvatar()
    expect(ownAvatar.url).toBeNull()
    expect(revoked).toEqual([created[0]])
    await loadOwnAvatar()
    expect(photo).toHaveBeenCalledTimes(3)
  })
})

describe('publicAvatarUrl', () => {
  it('turns the public route into an address, and nothing into nothing', () => {
    expect(publicAvatarUrl('https://library.muon3d.com/models/v1/public/avatars/a')).toBe('https://library.muon3d.com/models/v1/public/avatars/a')
    expect(publicAvatarUrl('/v1/public/avatars/a')).toMatch(/^https?:\/\/.+\/v1\/public\/avatars\/a$/)
    expect(publicAvatarUrl(null)).toBeNull()
    expect(publicAvatarUrl('')).toBeNull()
    expect(publicAvatarUrl('javascript:alert(1)')).toBeNull()
  })
})
