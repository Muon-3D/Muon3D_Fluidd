import type * as THREE from 'three'

/**
 * Draw order of what the glass plate is seen over. The plate hangs above its
 * print, so the print, the probe dots and the nozzle's line sit behind it:
 * they draw first (CONTENTS_ORDER), then the plate (GLASS_ORDER), then its
 * edge and its decal.
 */
export const CONTENTS_ORDER = 1
export const GLASS_ORDER = 2

/** How much of the scene shows through the plate's faces. */
const GLASS_OPACITY = 0.2
const EDGE_OPACITY = 0.55

/**
 * Replaces the vendored glass's transmission with a plain transparent
 * material. Transmission re-renders the opaque scene into a render target
 * (twice the shaders, a second pass), and it only ever contains OPAQUE
 * objects: the print's lines and the probe dots are transparent (they fade as
 * the plate comes off), so they were left out of it, and the plate's depth
 * write then hid them as well. A transparent plate that does not write depth
 * and draws after its contents shows them all, and costs one draw.
 */
export function flattenGlass (mats: Record<string, THREE.Material>): void {
  for (const [name, opacity] of [['glass', GLASS_OPACITY], ['glassEdge', EDGE_OPACITY]] as const) {
    const m = mats[name] as THREE.MeshPhysicalMaterial | undefined
    if (!m) continue
    m.transmission = 0
    m.thickness = 0
    m.transparent = true
    m.opacity = opacity
    m.depthWrite = false
    m.needsUpdate = true
  }
}
