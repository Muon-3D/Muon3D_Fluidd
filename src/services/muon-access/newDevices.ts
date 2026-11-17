/**
 * The owner's switch "Allow new devices to ask" (I-170).
 *
 * `GET /access/settings` and `PUT /access/settings` with `{ accept_requests }`
 * are muon-link's owner admin routes. They are Owner-only and the printer is
 * the authority: this page asks, shows what the printer answers, and never
 * assumes a change took.
 *
 * Wire assumptions (lead-prn plan, departments/prn/i170-accept-reject-plan.md,
 * step 1g; nothing is released yet):
 *  - the path is `/access/settings` on the printer the page is showing, reached
 *    over the same session as the rest of Control (an Owner session);
 *  - GET answers `{ accept_requests: boolean }`, bare or under `result`;
 *  - PUT answers 2xx, with the new `{ accept_requests }` or nothing;
 *  - an older printer answers 404 (no such route), a non-owner 403.
 */
import Vue from 'vue'

export const NEW_DEVICES_PATH = '/access/settings'

/** The printer refused the change, in its own words. */
export class NewDevicesRefused extends Error {
  constructor (message: string, readonly status: number) {
    super(message)
    this.name = 'NewDevicesRefused'
  }
}

export interface NewDevicesClient {
  /** Whether new devices may ask; null when this printer has no such setting for this browser. */
  get (): Promise<boolean | null>;
  /** Sets it, and resolves to what the printer now holds. Rejects with the printer's words. */
  set (acceptRequests: boolean): Promise<boolean>;
}

type Body = { result?: { accept_requests?: unknown }, accept_requests?: unknown, error?: string | { message?: string } } | undefined

const flag = (data: Body): boolean | undefined => {
  const value = data?.result?.accept_requests ?? data?.accept_requests
  return typeof value === 'boolean' ? value : undefined
}

function words (data: Body, status: number): string {
  const answer = data?.error
  const text = typeof answer === 'string' ? answer : answer?.message
  return text || `The printer refused (HTTP ${status}).`
}

/** Through Fluidd's client: the printer on screen, over the LAN or Iroh. */
export function currentPrinterNewDevices (): NewDevicesClient {
  const status = (error: unknown) => (error as { response?: { status: number, data?: Body } }).response
  const get = async (): Promise<boolean | null> => {
    try {
      const flagged = flag((await Vue.$httpClient.get(NEW_DEVICES_PATH)).data)
      return flagged ?? null
    } catch (error) {
      // 404: an older printer. 403: not the owner. Either way, no switch.
      if (status(error)) return null
      throw error
    }
  }
  return {
    get,
    set: async acceptRequests => {
      try {
        const response = await Vue.$httpClient.put(NEW_DEVICES_PATH, { accept_requests: acceptRequests })
        const held = flag(response.data)
        if (held !== undefined) return held
      } catch (error) {
        const response = status(error)
        if (!response) throw error
        throw new NewDevicesRefused(words(response.data, response.status), response.status)
      }
      const read = await get()
      if (read === null) throw new NewDevicesRefused('The printer did not confirm the change.', 0)
      return read
    }
  }
}
