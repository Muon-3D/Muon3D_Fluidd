/**
 * One profile photo everywhere in Control (KAN-1826): your own photo is
 * fetched once from the authenticated GET /v1/community/profile/avatar,
 * kept as a blob URL, and shared by the top bar and the Profile page.
 * Changing it on Profile updates the top bar at once. Other people's
 * photos use their public avatar_url (which 404s while their page is not
 * visible: the image falls back to initials).
 */
import Vue from 'vue'
import { MODELS_URL } from '@/services/library/api'
import { communityApi } from './community'

export const ownAvatar = Vue.observable({
  /** A blob URL for your photo, or null: the initials stand in. */
  url: null as string | null,
  /** The service has answered (a photo, or none): don't ask again. */
  loaded: false
})

let inflight: Promise<void> | null = null
let generation = 0

function revoke (): void {
  if (ownAvatar.url) URL.revokeObjectURL(ownAvatar.url)
  ownAvatar.url = null
}

/** Your photo, fetched once and shared. `force` reads it again (after a change). */
export function loadOwnAvatar (force = false): Promise<void> {
  if (!force) {
    if (ownAvatar.loaded) return Promise.resolve()
    if (inflight) return inflight
  }
  const mine = ++generation
  const run = (async () => {
    try {
      const blob = await communityApi.photo()
      if (mine !== generation) return
      revoke()
      ownAvatar.url = URL.createObjectURL(blob)
      ownAvatar.loaded = true
    } catch (error) {
      if (mine !== generation) return
      // No photo (404): initials, and no need to ask again. Anything else may pass: try next time.
      if ((error as { status?: number }).status === 404) {
        revoke()
        ownAvatar.loaded = true
      }
    } finally {
      if (mine === generation) inflight = null
    }
  })()
  inflight = run
  return run
}

/** A photo just chosen: show it at once, ahead of anything still loading. */
export function setOwnAvatar (photo: Blob): void {
  generation++
  inflight = null
  revoke()
  ownAvatar.url = URL.createObjectURL(photo)
  ownAvatar.loaded = true
}

/** The photo was removed: initials, without asking the service. */
export function removeOwnAvatar (): void {
  generation++
  inflight = null
  revoke()
  ownAvatar.loaded = true
}

/** Another account or none (sign-out): nothing of the last photo stays. */
export function forgetOwnAvatar (): void {
  generation++
  inflight = null
  revoke()
  ownAvatar.loaded = false
}

/** Someone else's photo address (their public avatar_url), or null when there is none to use. */
export function publicAvatarUrl (url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${MODELS_URL}${url}`
  return null
}
