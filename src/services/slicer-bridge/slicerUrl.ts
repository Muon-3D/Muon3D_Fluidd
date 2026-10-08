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
