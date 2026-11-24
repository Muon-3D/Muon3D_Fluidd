import * as THREE from 'three'

/**
 * The toolhead and the cross rail go almost clear while the camera looks at the printer's panel (KAN-5984, Jack 24 Nov),
 * so the panel shows through them instead of being hidden behind. They come back when the view leaves the panel.
 *
 * The nodes' materials are shared with other parts (the diffuser, the shell's white), so each material used under
 * these nodes gets a copy of its own and only the copies fade. A faded copy is `transparent` with `depthWrite` off, so
 * it is drawn in the transparent pass after the opaque panel and cannot hide it or sort wrongly; at full opacity it
 * goes back to exactly what the asset had, and the opaque pass takes it again.
 */
export const PANEL_SEE_THROUGH_NODES = ['M1_Y_Gantry', 'M1_X_Carriage'] as const
/** How much of the head and rail shows at the panel: 0.1 of full. */
export const PANEL_SEE_THROUGH_LEVEL = 0.1
/** The fade, in and out. */
export const PANEL_SEE_THROUGH_MS = 200

interface Faded {
  material: THREE.Material;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

export interface PanelSeeThrough {
  /** Fades toward see-through (on) or back to solid (off) from the level it is at now. With `animate` false it snaps. */
  set: (on: boolean, now: number, animate: boolean) => void;
  /** Advances the fade to `now` (ms); whether it is still fading. */
  step: (now: number) => boolean;
  /** 1 solid .. PANEL_SEE_THROUGH_LEVEL see-through, as drawn now. */
  level: () => number;
  /** How many materials are faded (0 when the model has neither node). */
  count: () => number;
}

export function buildPanelSeeThrough (root: THREE.Object3D): PanelSeeThrough {
  const copies = new Map<THREE.Material, Faded>()
  const seen = new Set<THREE.Object3D>()
  for (const name of PANEL_SEE_THROUGH_NODES) {
    root.getObjectByName(name)?.traverse(o => {
      const mesh = o as THREE.Mesh
      if (seen.has(o) || !mesh.isMesh || mesh.userData.partOverlay) return
      seen.add(o)
      const swap = (m: THREE.Material): THREE.Material => {
        // Glass that the asset draws by transmission is left alone: its own pass is not an opacity.
        if ((m as THREE.MeshPhysicalMaterial).transmission > 0) return m
        let copy = copies.get(m)?.material
        if (!copy) {
          copy = m.clone()
          copies.set(m, { material: copy, opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite })
        }
        return copy
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
    })
  }
  const faded = [...copies.values()]

  let level = 1
  let goal = 1
  let from = 1
  let start = 0
  let duration = 0

  const apply = () => {
    const see = level < 1 - 1e-3
    for (const f of faded) {
      const m = f.material
      const transparent = f.transparent || see
      const depthWrite = see ? false : f.depthWrite
      if (m.transparent !== transparent || m.depthWrite !== depthWrite) {
        m.transparent = transparent
        m.depthWrite = depthWrite
        m.needsUpdate = true
      }
      m.opacity = f.opacity * level
    }
  }

  return {
    set (on, now, animate) {
      const next = on ? PANEL_SEE_THROUGH_LEVEL : 1
      if (next === goal && (animate || level === goal)) return
      goal = next
      from = level
      start = now
      duration = animate ? PANEL_SEE_THROUGH_MS * Math.abs(goal - from) / (1 - PANEL_SEE_THROUGH_LEVEL) : 0
      if (!duration) {
        level = goal
        apply()
      }
    },
    step (now) {
      if (level === goal) return false
      const t = duration > 0 ? Math.min(1, Math.max(0, (now - start) / duration)) : 1
      level = t >= 1 ? goal : from + (goal - from) * t
      apply()
      return level !== goal
    },
    level: () => level,
    count: () => faded.length
  }
}
