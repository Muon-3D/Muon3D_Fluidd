import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import type { AccessoryFrame } from '../accessory-motion'
import { buildAccurateSpool, ACCURATE_SPOOL_NODES } from '../accurate/spool'
import { buildPowerPlug, buildPlateDecal, ACCURATE_FITTING_NODES } from '../accurate/fittings'

/** The accurate GLB's scene, cut down to the nodes the fittings hang on. */
function scene () {
  const root = new THREE.Group()
  const m1 = new THREE.Group()
  m1.name = 'M1'
  m1.rotation.y = -Math.PI / 2
  root.add(m1)
  const arm = new THREE.Group()
  arm.name = 'M1_Arm'
  arm.position.set(-118.4, -136.4, 0)
  const base = new THREE.Group()
  base.name = 'M1_Base'
  const plate = new THREE.Mesh(new THREE.BoxGeometry(180, 4, 200), new THREE.MeshStandardMaterial())
  plate.name = 'M1_BuildPlate_Glass'
  plate.position.y = -28
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ name: 'M1_Logo-Print' }))
  plate.add(logo)
  m1.add(arm, base, plate)
  return { root, arm, base, plate, logo }
}

function frame (loaded: boolean, spool = true, clip: 'load' | 'unload' | null = null, t = 0): AccessoryFrame {
  return {
    plate: { on: true, clip: null, t: 0, carriesPrint: false },
    tube: { attached: true, clip: null, t: 0, unlocking: false },
    column: { state: 'locked', level: 0, clip: null },
    filament: { loaded, clip, t, autoLoad: null, autoLoadAge: 0 },
    spool
  } as unknown as AccessoryFrame
}

describe('accurate spool', () => {
  it('hangs a named spool on the column and runs a named strand', () => {
    const { root, arm } = scene()
    buildAccurateSpool(root)
    const spool = root.getObjectByName(ACCURATE_SPOOL_NODES.spool)
    expect(spool?.parent).toBe(arm)
    expect(spool?.getObjectByName(ACCURATE_SPOOL_NODES.reel)).toBeTruthy()
    expect(root.getObjectByName(ACCURATE_SPOOL_NODES.strand)).toBeTruthy()
  })

  it('draws the strand when loaded, hides it unloaded, and follows the page and the mount', () => {
    const { root } = scene()
    const spool = buildAccurateSpool(root)
    const strand = root.getObjectByName(ACCURATE_SPOOL_NODES.strand) as THREE.Mesh
    spool.apply(frame(true))
    expect(strand.visible).toBe(true)
    expect(spool.shown()).toBe(true)
    spool.apply(frame(false))
    expect(strand.visible).toBe(false)
    spool.apply(frame(true, false))
    expect(spool.shown()).toBe(false)
    expect(strand.visible).toBe(false)
    spool.apply(frame(true))
    spool.setShown(false)
    expect(spool.shown()).toBe(false)
  })

  it('turns the reel as the load clip pulls filament off it', () => {
    const { root } = scene()
    const spool = buildAccurateSpool(root)
    const reel = root.getObjectByName(ACCURATE_SPOOL_NODES.reel) as THREE.Object3D
    spool.apply(frame(false, true, 'load', 0))
    const start = reel.rotation.y
    spool.apply(frame(false, true, 'load', 1))
    expect(reel.rotation.y).toBeGreaterThan(start)
  })

  it('colours the strand from the loaded filament', () => {
    const { root } = scene()
    const spool = buildAccurateSpool(root)
    spool.setColour(0x123456)
    const strand = root.getObjectByName(ACCURATE_SPOOL_NODES.strand) as THREE.Mesh
    expect((strand.material as THREE.MeshPhysicalMaterial).color.getHex()).toBe(0x123456)
    // And the wound filament on the reel, which the stage reports so a test can read what colour is drawn.
    expect(spool.colour()).toBe(0x123456)
  })
})

describe('accurate fittings', () => {
  it('plugs the power socket on the base', () => {
    const { root, base } = scene()
    const plug = buildPowerPlug(root)
    expect(plug?.name).toBe(ACCURATE_FITTING_NODES.plug)
    expect(plug?.parent).toBe(base)
  })

  it('puts the plate print on the plate in place of the GLB logo', () => {
    const { root, plate, logo } = scene()
    expect(buildPlateDecal(root, null)).toBeNull()
    const decal = buildPlateDecal(root, document.createElement('canvas'))
    expect(decal?.name).toBe(ACCURATE_FITTING_NODES.plateDecal)
    expect(decal?.parent).toBe(plate)
    expect(logo.visible).toBe(false)
  })

  it('leaves the existing nodes where they were', () => {
    const { root, arm, base, plate } = scene()
    const before = [arm, base, plate].map(o => { o.updateMatrix(); return o.matrix.clone() })
    buildAccurateSpool(root)
    buildPowerPlug(root)
    buildPlateDecal(root, document.createElement('canvas'))
    ;[arm, base, plate].forEach((o, i) => { o.updateMatrix(); expect(o.matrix.equals(before[i])).toBe(true) })
  })
})
