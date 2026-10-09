import Vue from 'vue'

/**
 * Where /slice finds the slicer: VUE_MUON_SLICER_URL, the URL of its
 * embed.html. Relative to this page by default (`/slicer/embed.html`: the
 * copy a printer serves beside its own Fluidd); a hosted Fluidd sets the
 * slicer's own origin. Only http and https; anything else is no slicer.
 */
export const DEFAULT_SLICER_URL = '/slicer/embed.html'

export function slicerUrl (configured: string | undefined, base: string): URL | null {
  const text = (configured ?? '').trim() || DEFAULT_SLICER_URL
  try {
    const url = new URL(text, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    url.hash = ''
    return url
  } catch {
    return null
  }
}

/** The slicer's own URL as this build configures it, against this page. */
export const configuredSlicerUrl = (): URL | null =>
  slicerUrl(import.meta.env.VUE_MUON_SLICER_URL, window.location.href)

/**
 * A line only the slicer's embed.html carries (its frame-host list), never
 * Fluidd's index.html, which a server without the slicer answers for any
 * path (the SPA fallback).
 */
const EMBED_MARKER = /<meta\s+name=["']muon3d-embed-hosts["']/i

/**
 * Whether the slicer is there to frame. On this page's own origin (the copy a
 * printer serves beside its Fluidd) it is asked once: a 200 HTML answer that
 * is the slicer's embed.html, not a 404 nor Fluidd's own index.html. A slicer
 * on another origin (a hosted Fluidd's VUE_MUON_SLICER_URL, set on purpose at
 * build time) cannot be read from here without CORS and is taken as there:
 * its frame then answers for itself.
 */
export async function checkSlicer (url: URL | null, pageOrigin: string, fetchImpl: typeof fetch): Promise<boolean> {
  if (!url) return false
  if (url.origin !== pageOrigin) return true
  try {
    const answer = await fetchImpl(url.href, { cache: 'no-store', credentials: 'same-origin', redirect: 'error' })
    if (answer.status !== 200) return false
    if (!/^text\/html(?:\s*;|$)/i.test(answer.headers.get('content-type') ?? '')) return false
    return EMBED_MARKER.test(await answer.text())
  } catch {
    return false
  }
}

export type SlicerPresence = 'unknown' | 'present' | 'absent'

/** What the one probe found (the nav shows Slice only when it is `present`). */
export const slicerPresence = Vue.observable({ state: 'unknown' as SlicerPresence })

let probe: Promise<boolean> | null = null

/** Asks once per page load whether the slicer is there (checkSlicer), and records it in slicerPresence. */
export function probeSlicer (url: URL | null = configuredSlicerUrl(), pageOrigin = window.location.origin, fetchImpl: typeof fetch = (...args) => window.fetch(...args)): Promise<boolean> {
  if (!probe) {
    probe = checkSlicer(url, pageOrigin, fetchImpl).then((present) => {
      slicerPresence.state = present ? 'present' : 'absent'
      return present
    })
  }
  return probe
}

/** Forgets the probe (tests). */
export function resetSlicerProbe () {
  probe = null
  slicerPresence.state = 'unknown'
}
