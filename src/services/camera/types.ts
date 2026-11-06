import type { NewWebcamConfig, WebcamService } from '@/store/webcams/types'

/** A stream type a camera can have, as the Add a camera cards and the Stream type row name it. */
export interface StreamType {
  value: WebcamService;
  label: string;
  hint: string;
}

export const STREAM_TYPES: StreamType[] = [
  { value: 'mjpegstreamer-adaptive', label: 'MJPEG Adaptive', hint: 'Most USB cameras. Default.' },
  { value: 'mjpegstreamer', label: 'MJPEG Stream', hint: 'Plain MJPEG, full rate' },
  { value: 'webrtc-camerastreamer', label: 'WebRTC (camera-streamer)', hint: 'Low delay' },
  { value: 'webrtc-go2rtc', label: 'WebRTC (go2rtc)', hint: 'Low delay' },
  { value: 'webrtc-mediamtx', label: 'WebRTC (MediaMTX)', hint: 'Low delay' },
  { value: 'hlsstream', label: 'HLS Stream', hint: 'Smooth, a few seconds behind' },
  { value: 'ipstream', label: 'IP Camera', hint: "A network camera's own stream" },
  { value: 'iframe', label: 'HTTP page', hint: 'Embed a web page' }
]

export const streamTypeLabel = (service: WebcamService | undefined): string =>
  STREAM_TYPES.find(t => t.value === service)?.label ?? (service === 'device' ? 'This device' : 'Unknown type')

/** The pills a camera's row shows: its rotation and flips, nothing when it is as it is. */
export function pictureFacts (camera: Pick<NewWebcamConfig, 'rotation' | 'flip_horizontal' | 'flip_vertical'>): string[] {
  const facts: string[] = []
  if (camera.rotation) facts.push(`${camera.rotation}°`)
  if (camera.flip_horizontal) facts.push('Flipped ↔')
  if (camera.flip_vertical) facts.push('Flipped ↕')
  return facts
}

/** The line under a camera's name: its stream type, and for adaptive its frame rates. */
export function streamLine (camera: NewWebcamConfig): string {
  const type = streamTypeLabel(camera.service)
  if (camera.enabled === false) return `${type} · switched off`
  if (camera.service === 'mjpegstreamer-adaptive' && camera.target_fps) {
    return camera.target_fps_idle ? `${type} · ${camera.target_fps} fps, ${camera.target_fps_idle} when not in focus` : `${type} · ${camera.target_fps} fps`
  }
  return type
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
