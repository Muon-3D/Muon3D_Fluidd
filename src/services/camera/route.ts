/**
 * Whether a camera's picture can be drawn when the printer is reached through
 * Muon3D. The gateway carries Moonraker's API and websocket, not camera
 * streams (muon-link's policy: "the streams themselves are not proxied"), so
 * an address on the printer (`/webcam/?action=stream`) has nowhere to load
 * from. A full address the camera serves itself still loads as it would on
 * the printer's network, unless this page is https and it is http (the
 * browser blocks that).
 */
export function cameraReachableThroughMuon3d (url: string | null | undefined, pageProtocol: string): boolean {
  if (!url) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol === 'https:') return true
  return parsed.protocol === 'http:' && pageProtocol === 'http:'
}

/**
 * The camera's picture can't be drawn on this route: through Muon3D, with an
 * address the gateway doesn't carry. A camera on this device is always drawn.
 */
export function cameraOutOfReach (
  camera: { service?: string, stream_url?: string, snapshot_url?: string },
  throughMuon3d: boolean,
  pageProtocol: string
): boolean {
  if (!throughMuon3d || camera.service === 'device') return false
  const url = camera.service === 'mjpegstreamer-adaptive' ? camera.snapshot_url : camera.stream_url
  return !cameraReachableThroughMuon3d(url, pageProtocol)
}
