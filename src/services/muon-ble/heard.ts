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

/** Whether this sighting is recent enough to say the printer is here now. */
export function heardRecently (p: { heardAt: number } | null | undefined, now = Date.now()): boolean {
  return !!p && p.heardAt > 0 && now - p.heardAt <= NEARBY_FRESH_MS
}
