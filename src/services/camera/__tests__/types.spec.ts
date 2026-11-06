import { describe, expect, it } from 'vitest'
import { STREAM_TYPES, newCamera, pictureFacts, streamLine, streamTypeLabel } from '../types'

describe('camera types', () => {
  it('has the eight stream types, adaptive first', () => {
    expect(STREAM_TYPES).toHaveLength(8)
    expect(STREAM_TYPES[0].value).toBe('mjpegstreamer-adaptive')
  })

  it('names a type, and says when it does not know it', () => {
    expect(streamTypeLabel('ipstream')).toBe('IP Camera')
    expect(streamTypeLabel('device')).toBe('This device')
    expect(streamTypeLabel(undefined)).toBe('Unknown type')
  })

  it('shows rotation and flips as pills, none when as is', () => {
    expect(pictureFacts({ rotation: 0, flip_horizontal: false, flip_vertical: false })).toEqual([])
    expect(pictureFacts({ rotation: 180, flip_horizontal: true, flip_vertical: true })).toEqual(['180°', 'Flipped ↔', 'Flipped ↕'])
  })

  it('describes the stream, with frame rates only for adaptive', () => {
    expect(streamLine({ service: 'mjpegstreamer-adaptive', target_fps: 15, target_fps_idle: 5, enabled: true })).toBe('MJPEG Adaptive · 15 fps, 5 when not in focus')
    expect(streamLine({ service: 'ipstream', target_fps: 15, enabled: true })).toBe('IP Camera')
    expect(streamLine({ service: 'ipstream', enabled: false })).toBe('IP Camera · switched off')
  })

  it('starts a new camera with the defaults', () => {
    expect(newCamera('hlsstream', '/a', '/b')).toMatchObject({ service: 'hlsstream', name: '', rotation: 0, target_fps: 15, target_fps_idle: 5, stream_url: '/a', snapshot_url: '/b', enabled: true })
    expect(newCamera('iframe', '/a', '/b').aspect_ratio).toBe('4:3')
    expect(newCamera('ipstream', '/a', '/b').aspect_ratio).toBeUndefined()
  })
})
