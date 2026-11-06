/**
 * The order the cameras are listed in, wherever they are listed (the camera
 * page, Overview, Settings). It is a UI setting in Moonraker's database
 * (`uiSettings.general.cameraOrder`), a list of camera uids; Moonraker's own
 * webcam records are never changed.
 */
interface Orderable {
  uid: string;
  name?: string;
}

const byName = (a: Orderable, b: Orderable) => (a.name ?? '').localeCompare(b.name ?? '')

/**
 * `cameras` in the saved `order`. An entry matches a camera by uid, else by
 * name. Cameras the order doesn't name go last, by name; entries that match
 * no camera (a removed camera) are skipped. The input is not changed.
 */
export function orderCameras<T extends Orderable> (cameras: T[], order: readonly string[] | null | undefined): T[] {
  const left = [...cameras].sort(byName)
  const out: T[] = []
  for (const key of order ?? []) {
    let at = left.findIndex(c => c.uid === key)
    if (at < 0) at = left.findIndex(c => c.name === key)
    if (at >= 0) out.push(...left.splice(at, 1))
  }
  return [...out, ...left]
}

/** The uids of `cameras`, moved: the one at `from` goes to `to` (clamped). */
export function moveCamera<T extends Orderable> (cameras: T[], from: number, to: number): string[] {
  const uids = cameras.map(c => c.uid)
  if (from < 0 || from >= uids.length) return uids
  const target = Math.max(0, Math.min(uids.length - 1, to))
  const [one] = uids.splice(from, 1)
  uids.splice(target, 0, one)
  return uids
}
