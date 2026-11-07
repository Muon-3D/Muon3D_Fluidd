import * as THREE from 'three'

export type LightMode = 'active' | 'info'

/**
 * A part lit by a tinted copy of its own meshes drawn over it (sharing their
 * geometry, and their skeleton for the hose), so the model's shared
 * materials are never changed. `active` is the accent; `info` (not idle) is
 * a faint grey.
 */
export class PartLight {
  private overlays: THREE.Mesh[] = []
  private readonly material = new THREE.MeshBasicMaterial({
    // Drawn in the opaque pass, right after its part: in the transparent pass
    // the glass plate's transmission hides it everywhere. Custom blending keeps
    // it see-through there (three blends an opaque material only when told how).
    transparent: false,
    depthWrite: false,
    // Laid over, not added: an added tint vanishes on the M1's white shell.
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  })

  /** The accent, as Control's CSS has it. */
  accent = new THREE.Color('#80d6d1')

  light (meshes: THREE.Mesh[], mode: LightMode) {
    this.clear()
    this.material.color.copy(mode === 'active' ? this.accent : new THREE.Color('#aab4be'))
    this.material.opacity = mode === 'active' ? 0.55 : 0.3
    for (const mesh of meshes) {
      const skinned = mesh as THREE.SkinnedMesh
      let copy: THREE.Mesh
      if (skinned.isSkinnedMesh) {
        const rigged = new THREE.SkinnedMesh(skinned.geometry, this.material)
        rigged.bind(skinned.skeleton, skinned.bindMatrix)
        copy = rigged
      } else {
        copy = new THREE.Mesh(mesh.geometry, this.material)
      }
      copy.userData.partOverlay = true
      copy.renderOrder = 10
      copy.raycast = () => {}
      if (skinned.isSkinnedMesh) {
        // A skinned copy sits beside its mesh, where the skeleton expects it.
        copy.position.copy(mesh.position)
        copy.quaternion.copy(mesh.quaternion)
        copy.scale.copy(mesh.scale)
        mesh.parent?.add(copy)
      } else {
        mesh.add(copy)
      }
      this.overlays.push(copy)
    }
  }

  clear () {
    for (const o of this.overlays) o.removeFromParent()
    this.overlays = []
  }

  dispose () {
    this.clear()
    this.material.dispose()
  }
}
