import { describe, expect, it } from 'vitest'
import { TRACKPAD_LIVE_AVAILABLE, TRACKPAD_MODE_KEY, readTrackpadMode, writeTrackpadMode } from '../trackpad-mode'

const memory = (initial?: string) => {
  const m = new Map<string, string>(initial ? [[TRACKPAD_MODE_KEY, initial]] : [])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } }
}

describe('trackpad mode', () => {
  it('is On release by default and while live moving is not available', () => {
    expect(TRACKPAD_LIVE_AVAILABLE).toBe(false)
    expect(readTrackpadMode(memory())).toBe('release')
    expect(readTrackpadMode(memory('live'))).toBe('release')
    expect(readTrackpadMode(null)).toBe('release')
  })

  it('never stores live while it is not available', () => {
    const store = memory()
    expect(writeTrackpadMode('live', store)).toBe('release')
    expect(store.getItem(TRACKPAD_MODE_KEY)).toBe('release')
  })

  it('remembers a live choice once live moving is available', () => {
    const store = memory()
    expect(writeTrackpadMode('live', store, true)).toBe('live')
    expect(readTrackpadMode(store, true)).toBe('live')
    expect(writeTrackpadMode('release', store, true)).toBe('release')
    expect(readTrackpadMode(store, true)).toBe('release')
  })

  it('survives a storage that throws', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(readTrackpadMode(broken)).toBe('release')
    expect(writeTrackpadMode('release', broken)).toBe('release')
  })
})
