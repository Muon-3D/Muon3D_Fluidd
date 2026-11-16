import { describe, expect, it } from 'vitest'
import { STREAM_TYPES, cameraProblem, cameraProblems, cameraToSave, newCamera, pictureFacts, streamLine, streamTypeKey } from '../types'

describe('camera types', () => {
  it('has the eight stream types, adaptive first', () => {
    expect(STREAM_TYPES).toHaveLength(8)
    expect(STREAM_TYPES[0].value).toBe('mjpegstreamer-adaptive')
  })

  it('names a type by its i18n key, and has none for one that is not offered', () => {
    expect(streamTypeKey('ipstream')).toBe('app.setting.camera_type_options.video')
    expect(streamTypeKey('mjpegstreamer-adaptive')).toBe('app.setting.camera_type_options.mjpegadaptive')
    expect(streamTypeKey('device')).toBeNull()
    expect(streamTypeKey(undefined)).toBeNull()
  })

  it('shows rotation and flips as pills, none when as is', () => {
    expect(pictureFacts({ rotation: 0, flip_horizontal: false, flip_vertical: false })).toEqual([])
    expect(pictureFacts({ rotation: 180, flip_horizontal: true, flip_vertical: true })).toEqual(['180°', 'Flipped ↔', 'Flipped ↕'])
  })

  it('describes the stream, with frame rates only for adaptive', () => {
    expect(streamLine({ service: 'mjpegstreamer-adaptive', target_fps: 15, target_fps_idle: 5, enabled: true }, 'MJPEG Adaptive')).toBe('MJPEG Adaptive · 15 fps, 5 when not in focus')
    expect(streamLine({ service: 'ipstream', target_fps: 15, enabled: true }, 'IP Camera')).toBe('IP Camera')
    expect(streamLine({ service: 'ipstream', enabled: false }, 'IP Camera')).toBe('IP Camera · switched off')
  })

  it('starts a new camera with the defaults', () => {
    expect(newCamera('hlsstream', '/a', '/b')).toMatchObject({ service: 'hlsstream', name: '', rotation: 0, target_fps: 15, target_fps_idle: 5, stream_url: '/a', snapshot_url: '/b', enabled: true })
    expect(newCamera('iframe', '/a', '/b').aspect_ratio).toBe('4:3')
    expect(newCamera('ipstream', '/a', '/b').aspect_ratio).toBeUndefined()
  })
})

describe('what stops a save', () => {
  const ok = () => ({ ...newCamera('mjpegstreamer-adaptive', '/s', '/p'), name: 'Door' })

  it('lets a complete camera go', () => {
    expect(cameraProblems(ok())).toEqual({})
    expect(cameraProblem(ok())).toBe('')
  })

  it('needs a name and both addresses, blank or not', () => {
    expect(Object.keys(cameraProblems({ ...ok(), name: '  ', stream_url: '', snapshot_url: undefined }))).toEqual(['name', 'stream_url', 'snapshot_url'])
  })

  it('needs a whole adaptive frame rate of 1 or more: a cleared field is not one', () => {
    for (const bad of ['', undefined, null, 0, -3, 2.5, 'abc', NaN]) {
      expect(cameraProblems({ ...ok(), target_fps: bad as never }).target_fps, String(bad)).toBeTruthy()
    }
    for (const good of [1, 15, 60]) expect(cameraProblems({ ...ok(), target_fps: good }).target_fps).toBeUndefined()
  })

  it('lets the idle rate stay empty, but a rate that is set must be whole and 1 or more', () => {
    for (const empty of ['', undefined, null]) expect(cameraProblems({ ...ok(), target_fps_idle: empty as never }).target_fps_idle).toBeUndefined()
    for (const bad of [0, -1, 1.5, 'x', NaN]) expect(cameraProblems({ ...ok(), target_fps_idle: bad as never }).target_fps_idle, String(bad)).toBeTruthy()
    expect(cameraProblems({ ...ok(), target_fps_idle: 5 }).target_fps_idle).toBeUndefined()
  })

  it('checks the frame rates only for MJPEG Adaptive', () => {
    expect(cameraProblems({ ...newCamera('ipstream', '/s', '/p'), name: 'Door', target_fps: '' as never, target_fps_idle: 'x' as never })).toEqual({})
  })

  it('needs an aspect ratio as width:height for an HTTP page only', () => {
    const page = { ...newCamera('iframe', '/s', '/p'), name: 'Door' }
    expect(cameraProblems(page)).toEqual({})
    for (const bad of ['', '16', 'wide', '16:', undefined]) expect(cameraProblems({ ...page, aspect_ratio: bad }).aspect_ratio, String(bad)).toBeTruthy()
    for (const good of ['16:9', '4 : 3', '16/9']) expect(cameraProblems({ ...page, aspect_ratio: good }).aspect_ratio).toBeUndefined()
    expect(cameraProblems({ ...ok(), aspect_ratio: '' }).aspect_ratio).toBeUndefined()
  })

  it('says the first problem in the order the fields are shown', () => {
    expect(cameraProblem({ ...ok(), name: '', target_fps: '' as never })).toBe('Give the camera a name.')
    expect(cameraProblem({ ...ok(), target_fps: '' as never })).toContain('frame rate')
  })

  it('leaves an empty idle rate out of what is sent', () => {
    expect(cameraToSave({ ...ok(), target_fps_idle: '' as never })).not.toHaveProperty('target_fps_idle')
    expect(cameraToSave({ ...ok(), target_fps_idle: 5 }).target_fps_idle).toBe(5)
  })
})
