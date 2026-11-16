import type { NewWebcamConfig, WebcamService } from '@/store/webcams/types'

/** A stream type a camera can have, as the Add a camera cards and the Stream type row name it. */
export interface StreamType {
  value: WebcamService;
  /** The type's name: an i18n key, `app.setting.camera_type_options.*`. */
  labelKey: string;
  hint: string;
}

const KEY = 'app.setting.camera_type_options.'

export const STREAM_TYPES: StreamType[] = [
  { value: 'mjpegstreamer-adaptive', labelKey: `${KEY}mjpegadaptive`, hint: 'Most USB cameras. Default.' },
  { value: 'mjpegstreamer', labelKey: `${KEY}mjpegstream`, hint: 'Plain MJPEG, full rate' },
  { value: 'webrtc-camerastreamer', labelKey: `${KEY}webrtc_camera_streamer`, hint: 'Low delay' },
  { value: 'webrtc-go2rtc', labelKey: `${KEY}webrtc_go2rtc`, hint: 'Low delay' },
  { value: 'webrtc-mediamtx', labelKey: `${KEY}webrtc_mediamtx`, hint: 'Low delay' },
  { value: 'hlsstream', labelKey: `${KEY}hlsstream`, hint: 'Smooth, a few seconds behind' },
  { value: 'ipstream', labelKey: `${KEY}video`, hint: "A network camera's own stream" },
  { value: 'iframe', labelKey: `${KEY}iframe`, hint: 'Embed a web page' }
]

/** The i18n key of a service's name; null for one that is not offered (the device camera). */
export const streamTypeKey = (service: WebcamService | undefined): string | null =>
  STREAM_TYPES.find(t => t.value === service)?.labelKey ?? null

/** The pills a camera's row shows: its rotation and flips, nothing when it is as it is. */
export function pictureFacts (camera: Pick<NewWebcamConfig, 'rotation' | 'flip_horizontal' | 'flip_vertical'>): string[] {
  const facts: string[] = []
  if (camera.rotation) facts.push(`${camera.rotation}°`)
  if (camera.flip_horizontal) facts.push('Flipped ↔')
  if (camera.flip_vertical) facts.push('Flipped ↕')
  return facts
}

/** The line under a camera's name: its stream type (already translated), and for adaptive its frame rates. */
export function streamLine (camera: NewWebcamConfig, type: string): string {
  if (camera.enabled === false) return `${type} · switched off`
  if (camera.service === 'mjpegstreamer-adaptive' && camera.target_fps) {
    return camera.target_fps_idle ? `${type} · ${camera.target_fps} fps, ${camera.target_fps_idle} when not in focus` : `${type} · ${camera.target_fps} fps`
  }
  return type
}

export type CameraField = 'name' | 'stream_url' | 'snapshot_url' | 'target_fps' | 'target_fps_idle' | 'aspect_ratio'

const FIELD_ORDER: CameraField[] = ['name', 'stream_url', 'snapshot_url', 'target_fps', 'target_fps_idle', 'aspect_ratio']

const isWhole = (v: unknown): boolean => typeof v === 'number' && Number.isInteger(v) && v >= 1
const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/**
 * What stops a camera being saved, by field, in plain words. The name and
 * both addresses are required; the adaptive frame rate is required and a
 * whole number of 1 or more; the idle rate may be left empty, but if it is
 * set it must be one too; an HTTP page needs its aspect ratio as width:height.
 */
export function cameraProblems (camera: NewWebcamConfig): Partial<Record<CameraField, string>> {
  const problems: Partial<Record<CameraField, string>> = {}
  if (isBlank(camera.name)) problems.name = 'Give the camera a name.'
  if (isBlank(camera.stream_url)) problems.stream_url = 'Enter the stream address.'
  if (isBlank(camera.snapshot_url)) problems.snapshot_url = 'Enter the snapshot address.'
  if (camera.service === 'mjpegstreamer-adaptive') {
    if (!isWhole(camera.target_fps)) problems.target_fps = 'Enter the frame rate as a whole number, 1 or more.'
    if (!isBlank(camera.target_fps_idle) && !isWhole(camera.target_fps_idle)) {
      problems.target_fps_idle = 'Enter the background frame rate as a whole number, 1 or more, or leave it empty.'
    }
  }
  if (camera.service === 'iframe' && !/^\d+\s*[:/]\s*\d+$/.test(camera.aspect_ratio ?? '')) {
    problems.aspect_ratio = 'Enter the aspect ratio as width:height, like 16:9.'
  }
  return problems
}

/** The first thing that stops a save, in the order the fields are shown; empty when it can go. */
export function cameraProblem (camera: NewWebcamConfig): string {
  const problems = cameraProblems(camera)
  const first = FIELD_ORDER.find(f => problems[f])
  return first ? problems[first] ?? '' : ''
}

/** The camera as it is sent: an empty idle frame rate is left out, not posted as ''. */
export function cameraToSave<T extends NewWebcamConfig> (camera: T): T {
  const out = { ...camera }
  if (isBlank(out.target_fps_idle)) delete out.target_fps_idle
  return out
}

/** A new camera, as Add starts it: the chosen type, /webcam/ addresses, 15 and 5 fps, no rotation. */
export function newCamera (service: WebcamService, streamUrl: string, snapshotUrl: string): NewWebcamConfig {
  return {
    enabled: true,
    flip_horizontal: false,
    flip_vertical: false,
    name: '',
    rotation: 0,
    service,
    target_fps: 15,
    target_fps_idle: 5,
    stream_url: streamUrl,
    snapshot_url: snapshotUrl,
    ...(service === 'iframe' ? { aspect_ratio: '4:3' } : {})
  }
}
