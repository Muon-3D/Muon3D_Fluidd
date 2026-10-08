/**
 * The selected printer's status for the bridge, from Fluidd's own
 * subscription (it subscribes to every Klipper object when it connects):
 * never a second subscription. A snapshot is the printer store's objects now;
 * the changes are the status notifications the store takes in
 * (printer/onNotifyStatusUpdate, and motion_report's fast path).
 *
 * A feed belongs to one printer key. Fluidd resets its store when it switches
 * printer, and the next printer's notifications arrive through the same
 * actions, so a change is passed on only while `isCurrent()` still says the
 * feed's printer is the one selected; the helper ends the watch on the
 * switch itself.
 */
import type { Store } from 'vuex'
import type { HostStatus, StatusFeed } from './vendor/printer-client/bridge/host'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A plain copy (the store's objects are reactive). */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * The Klipper objects in the printer store. Fluidd keeps its own fields
 * beside them (info, objects, endstops…), and lists each subscribed object
 * with its first space as a dot ("mcu toolhead" as "mcu.toolhead"), which is
 * how an object is told from Fluidd's own fields.
 */
export function klipperObjects (printer: Record<string, unknown>): HostStatus {
  const listed = Array.isArray(printer.objects) ? printer.objects as unknown[] : []
  const out: HostStatus = {}
  for (const [name, value] of Object.entries(printer)) {
    if (name === 'objects' || !isRecord(value)) continue
    if (!listed.includes(name.replace(' ', '.'))) continue
    out[name] = plain(value)
  }
  return out
}

/** A status notification's objects (Moonraker's diff) as the feed passes them on. */
function changed (payload: unknown): HostStatus | null {
  if (!isRecord(payload)) return null
  const out: HostStatus = {}
  for (const [name, value] of Object.entries(payload)) if (isRecord(value)) out[name] = plain(value)
  return Object.keys(out).length ? out : null
}

export function createStoreStatusFeed (store: Pick<Store<any>, 'state' | 'subscribeAction'>, isCurrent: () => boolean): StatusFeed {
  return {
    snapshot: () => ({ status: klipperObjects(store.state.printer.printer as Record<string, unknown>), eventtime: null }),
    subscribe (on) {
      return store.subscribeAction((action, state) => {
        if (!isCurrent() || !state.socket?.acceptingNotifications) return
        let diff: HostStatus | null = null
        if (action.type === 'printer/onNotifyStatusUpdate') diff = changed(action.payload)
        else if (action.type === 'printer/onFastNotifyStatusUpdate' && isRecord(action.payload) && typeof action.payload.key === 'string') {
          diff = changed({ [action.payload.key]: action.payload.payload })
        }
        if (diff) on(diff, null)
      })
    }
  }
}
