import Vue from 'vue'
import { checkSlicer, slicerUrl } from '@/services/slicer-bridge/slicerUrl'

/**
 * Where /design finds Muon3D Design: VUE_MUON_DESIGN_URL, the URL of its
 * embed.html. Relative to this page by default (`/design/embed.html`: a
 * copy served beside this Fluidd); a hosted Fluidd sets Design's own
 * origin. The same rules as the slicer's (slicerUrl.ts): only http and
 * https, no credentials, no hash.
 */
export const DEFAULT_DESIGN_URL = '/design/embed.html'

export function designUrl (configured: string | undefined, base: string): URL | null {
  return slicerUrl((configured ?? '').trim() || DEFAULT_DESIGN_URL, base)
}

/** Design's embed.html as this build is configured. */
export const configuredDesignUrl = (): URL | null =>
  designUrl(import.meta.env.VUE_MUON_DESIGN_URL, window.location.href)

/**
 * Whether Design is there to frame: the slicer's check (checkSlicer), as
 * Design's embed.html carries the same muon3d-embed-hosts line and a server
 * without it answers with Fluidd's own index.html.
 */
export const checkDesign = checkSlicer

export type DesignPresence = 'unknown' | 'present' | 'absent'

/** What the one probe found (the nav shows Design only when it is `present`). */
export const designPresence = Vue.observable({ state: 'unknown' as DesignPresence })

let probe: Promise<boolean> | null = null

/** Asks once per page load whether Design is there (checkDesign), and records it in designPresence. */
export function probeDesign (url: URL | null = configuredDesignUrl(), pageOrigin = window.location.origin, fetchImpl: typeof fetch = (...args) => window.fetch(...args)): Promise<boolean> {
  if (!probe) {
    probe = checkDesign(url, pageOrigin, fetchImpl).then((present) => {
      designPresence.state = present ? 'present' : 'absent'
      return present
    })
  }
  return probe
}

/** Forgets the probe (tests). */
export function resetDesignProbe () {
  probe = null
  designPresence.state = 'unknown'
}
