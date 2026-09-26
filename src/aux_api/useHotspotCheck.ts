import { ref } from 'vue'

/** The printer's own address on its hotspot, ap0. */
export const HOTSPOT_ADDRESS = '10.42.0.1'

/**
 * Whether this page reaches the printer over the printer's own hotspot.
 *
 * Only the page's origin can say so. Fluidd sends every request to the origin
 * that served it, so the hotspot carries them exactly when that origin is the
 * hotspot address. Probing http://10.42.0.1 from a page served anywhere else
 * answered a different question, and from https it could not answer at all.
 */
export function isHotspotOrigin (hostname: string = window.location.hostname): boolean {
  return hostname === HOTSPOT_ADDRESS
}

/**
 * The same answer as a ref. It registers no lifecycle hook, so it is correct
 * wherever it is called, module scope included. The old version registered
 * onMounted outside any component, which never ran, so the answer stayed null.
 */
export function useHotspotCheck () {
  const onHotspot = ref<boolean>(isHotspotOrigin())
  return { onHotspot }
}
