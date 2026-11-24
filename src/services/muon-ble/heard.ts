/**
 * When a Bluetooth sighting still counts as "nearby now" (KAN-2528). Kept
 * apart from `nearby.ts` so the directory can read it without the Bluetooth
 * code.
 */

/**
 * A printer advertises several times a second, and the browser reports each;
 * 30 s is long enough to ride out a gap in reports, short enough that a
 * printer that was switched off stops showing as nearby.
 */
export const NEARBY_FRESH_MS = 30_000

/**
 * Whether this sighting says the printer is here now: heard in the last 30 s, or held (KAN-5974). A printer this page
 * connected to over Bluetooth stops advertising while it is linked, so it is held as reachable from the link coming
 * up until the link drops, however long ago its last advertisement was.
 */
export function heardRecently (p: { heardAt: number, held?: boolean } | null | undefined, now = Date.now()): boolean {
  return !!p && (p.held === true || (p.heardAt > 0 && now - p.heardAt <= NEARBY_FRESH_MS))
}
