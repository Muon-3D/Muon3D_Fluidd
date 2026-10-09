import { describe, expect, it } from 'vitest'
import { cameraFor, liveFacts, snapshotName } from '../model'

const job = { printing: true, paused: false, name: 'NGMI stamp', progress: 42.7, layer: 84, layers: 200, left: '14m left' }

describe('the Live line', () => {
  it('says what is printing, how far, which layer and how long', () => {
    expect(liveFacts(job)).toBe('NGMI stamp · 42% · layer 84 of 200 · 14m left')
  })

  it('says paused in place of the time left', () => {
    expect(liveFacts({ ...job, printing: false, paused: true })).toBe('NGMI stamp · 42% · layer 84 of 200 · paused')
  })

  it('leaves out what the slicer didn\'t say', () => {
    expect(liveFacts({ ...job, layer: null, left: null })).toBe('NGMI stamp · 42%')
  })

  it('is empty while idle', () => {
    expect(liveFacts({ ...job, printing: false })).toBe('')
  })
})

describe('the camera shown', () => {
  const cameras = [{ uid: 'a b' }, { uid: 'front' }]

  it('is the one the address names, as written or encoded', () => {
    expect(cameraFor(cameras, 'front')?.uid).toBe('front')
    expect(cameraFor(cameras, 'a%20b')?.uid).toBe('a b')
  })

  it('is the first for no name or an unknown one, and none without cameras', () => {
    expect(cameraFor(cameras, undefined)?.uid).toBe('a b')
    expect(cameraFor(cameras, 'gone')?.uid).toBe('a b')
    expect(cameraFor([], 'front')).toBeNull()
  })
})

it('names a snapshot by printer, camera and time', () => {
  expect(snapshotName('Boxwood', 'Front cam', new Date(2026, 9, 10, 0, 12))).toBe('boxwood-front-cam-2026-10-10-0012.jpg')
})
