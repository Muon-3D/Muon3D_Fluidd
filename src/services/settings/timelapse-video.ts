/**
 * Settings › Timelapse › The video: the storyboard's choices, mapped onto
 * moonraker-timelapse's render settings (`settings/timelapse.md`).
 */
import type { TimelapseWritableSettings } from '@/store/timelapse/types'

export type VideoLength = 'short' | 'long' | 'every'
export type VideoQuality = 'small' | 'balanced' | 'best'

type Render = Pick<TimelapseWritableSettings, 'variable_fps' | 'targetlength' | 'output_framerate'>

/** 10 s and 20 s are a target length (variable fps); "Every frame" is a fixed 30 fps. */
export const VIDEO_LENGTHS: ReadonlyArray<{ value: VideoLength, label: string, settings: Partial<Render> }> = [
  { value: 'short', label: '10 s', settings: { variable_fps: true, targetlength: 10 } },
  { value: 'long', label: '20 s', settings: { variable_fps: true, targetlength: 20 } },
  { value: 'every', label: 'Every frame at 30 fps', settings: { variable_fps: false, output_framerate: 30 } }
]

/** The constant rate factor each quality stands for: lower is better and bigger. */
export const VIDEO_QUALITIES: ReadonlyArray<{ value: VideoQuality, label: string, crf: number }> = [
  { value: 'small', label: 'Small file', crf: 28 },
  { value: 'balanced', label: 'Balanced', crf: 23 },
  { value: 'best', label: 'Best', crf: 18 }
]

/** The length choice the settings are, or null when they are another (a 15 s target, 25 fps…). */
export function videoLengthOf (settings: Partial<Render> | undefined): VideoLength | null {
  if (!settings) return null
  if (settings.variable_fps) {
    return VIDEO_LENGTHS.find(l => l.settings.variable_fps && l.settings.targetlength === Number(settings.targetlength))?.value ?? null
  }
  return Number(settings.output_framerate) === 30 ? 'every' : null
}

export function videoQualityOf (crf: number | undefined): VideoQuality | null {
  return VIDEO_QUALITIES.find(q => q.crf === Number(crf))?.value ?? null
}
