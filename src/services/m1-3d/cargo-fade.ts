import * as THREE from 'three'

/**
 * The print's materials (the part's lines and the touches of the plate),
 * opaque while they're whole.
 *
 * three.js draws the glass plate (transmission > 0) over a picture of the
 * opaque objects alone, then draws transparent objects after it, tested
 * against the plate's depth. A transparent part is therefore missing from
 * the glass's picture and hidden behind the plate itself: looking down
 * through the plate showed the floor and no print.
 */
export function cargoMaterials () {
  return {
    part: new THREE.LineBasicMaterial({ color: 0xc00a66 }),
    taps: new THREE.MeshBasicMaterial({ toneMapped: false })
  }
}

/**
 * Fades the print as it falls off a returned plate (accessory-parts.ts):
 * transparent only while it fades, so it's seen through the glass the rest
 * of the time.
 */
export function fadeCargoMaterials (materials: THREE.Material[], opacity: number) {
  const fading = opacity < 1
  for (const material of materials) {
    material.opacity = opacity
    if (material.transparent !== fading) {
      material.transparent = fading
      // Another list and another shader (three.js's OPAQUE define).
      material.needsUpdate = true
    }
  }
}
