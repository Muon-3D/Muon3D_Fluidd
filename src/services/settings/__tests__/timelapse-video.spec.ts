import { describe, expect, it } from 'vitest'
import { VIDEO_LENGTHS, videoLengthOf, videoQualityOf } from '../timelapse-video'

describe('timelapse video choices', () => {
  it('reads 10 s and 20 s from a variable-fps target length, and Every frame from a fixed 30 fps', () => {
    expect(videoLengthOf({ variable_fps: true, targetlength: 10, output_framerate: 30 })).toBe('short')
    expect(videoLengthOf({ variable_fps: true, targetlength: 20, output_framerate: 25 })).toBe('long')
    expect(videoLengthOf({ variable_fps: false, targetlength: 10, output_framerate: 30 })).toBe('every')
  })

  it('is none of them for a length or frame rate the storyboard has no choice for', () => {
    expect(videoLengthOf({ variable_fps: true, targetlength: 15, output_framerate: 30 })).toBeNull()
    expect(videoLengthOf({ variable_fps: false, targetlength: 10, output_framerate: 25 })).toBeNull()
    expect(videoLengthOf(undefined)).toBeNull()
  })

  it('writes exactly the settings a choice stands for', () => {
    expect(VIDEO_LENGTHS.map(l => l.settings)).toEqual([
      { variable_fps: true, targetlength: 10 },
      { variable_fps: true, targetlength: 20 },
      { variable_fps: false, output_framerate: 30 }
    ])
  })

  it('maps quality to the constant rate factor', () => {
    expect([videoQualityOf(28), videoQualityOf(23), videoQualityOf(18), videoQualityOf(30)]).toEqual(['small', 'balanced', 'best', null])
  })
})
