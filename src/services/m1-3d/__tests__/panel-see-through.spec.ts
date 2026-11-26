import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildPanelSeeThrough, PANEL_SEE_THROUGH_LEVEL, PANEL_SEE_THROUGH_MS } from '../accurate/panel-see-through'

/** A small M1: a gantry holding a carriage (sharing one material with the shell), a shell and a panel. */
function model () {
  const shared = new THREE.MeshStandardMaterial({ name: 'M1_White' })
  const glassy = new THREE.MeshPhysicalMaterial({ name: 'Glass', transmission: 1 })
  const root = new THREE.Group()
  const gantry = new THREE.Object3D(); gantry.name = 'M1_Y_Gantry'
  const carriage = new THREE.Object3D(); carriage.name = 'M1_X_Carriage'
  const rail = new THREE.Mesh(new THREE.BufferGeometry(), shared)
  const head = new THREE.Mesh(new THREE.BufferGeometry(), [shared, glassy])
  const shell = new THREE.Mesh(new THREE.BufferGeometry(), shared)
  const panel = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ name: 'Panel' }))
  gantry.add(rail, carriage)
  carriage.add(head)
  root.add(gantry, shell, panel)
  return { root, shared, glassy, rail, head, shell, panel }
}

describe('the toolhead and rail at the panel view (KAN-5984)', () => {
  it('fades them to about a tenth over 200 ms and back, from wherever the fade is', () => {
    const m = model()
    const see = buildPanelSeeThrough(m.root)
    const rail = m.rail.material as THREE.MeshStandardMaterial
    expect(rail.opacity).toBe(1)
    see.set(true, 1000, true)
    see.step(1100)
    expect(see.level()).toBeLessThan(1)
    expect(see.level()).toBeGreaterThan(PANEL_SEE_THROUGH_LEVEL)
    expect(rail.transparent).toBe(true)
    expect(rail.depthWrite).toBe(false)
    expect(see.step(1000 + PANEL_SEE_THROUGH_MS)).toBe(false)
    expect(see.level()).toBe(PANEL_SEE_THROUGH_LEVEL)
    expect(rail.opacity).toBeCloseTo(0.1, 5)
    // Back out part-way through: it turns round from where it is, never jumping.
    see.set(false, 2000, true)
    see.step(2060)
    const mid = see.level()
    expect(mid).toBeGreaterThan(PANEL_SEE_THROUGH_LEVEL)
    expect(mid).toBeLessThan(1)
    see.set(true, 2060, true)
    see.step(2061)
    expect(Math.abs(see.level() - mid)).toBeLessThan(0.02)
  })

  it('restores solid, opaque and depth-writing materials exactly when it leaves the view', () => {
    const m = model()
    const see = buildPanelSeeThrough(m.root)
    see.set(true, 0, true); see.step(500)
    see.set(false, 600, true); see.step(900)
    const rail = m.rail.material as THREE.MeshStandardMaterial
    expect(see.level()).toBe(1)
    expect(rail.opacity).toBe(1)
    expect(rail.transparent).toBe(false)
    expect(rail.depthWrite).toBe(true)
  })

  it('keeps a material that was transparent in the asset transparent when solid again', () => {
    const root = new THREE.Group()
    const gantry = new THREE.Object3D(); gantry.name = 'M1_Y_Gantry'
    const m = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, depthWrite: false })
    gantry.add(new THREE.Mesh(new THREE.BufferGeometry(), m))
    root.add(gantry)
    const see = buildPanelSeeThrough(root)
    const copy = (gantry.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
    see.set(true, 0, false)
    expect(copy.opacity).toBeCloseTo(0.5 * PANEL_SEE_THROUGH_LEVEL, 5)
    see.set(false, 1, false)
    expect(copy.opacity).toBe(0.5)
    expect(copy.transparent).toBe(true)
    expect(copy.depthWrite).toBe(false)
  })

  it('touches only the head and rail: the shell sharing their material, and the panel, stay solid', () => {
    const m = model()
    const see = buildPanelSeeThrough(m.root)
    see.set(true, 0, false)
    expect(m.shared.opacity).toBe(1)
    expect(m.shared.transparent).toBe(false)
    expect((m.shell.material as THREE.Material).opacity).toBe(1)
    expect((m.panel.material as THREE.Material).opacity).toBe(1)
    expect((m.rail.material as THREE.Material).opacity).toBeCloseTo(0.1, 5)
    expect(m.rail.material).not.toBe(m.shared)
    // One copy of a shared material for the whole head, and transmissive glass left as the asset has it.
    const [a, b] = m.head.material as THREE.Material[]
    expect(a).toBe(m.rail.material)
    expect(b).toBe(m.glassy)
  })

  it('with reduced motion (no animation) it switches at once', () => {
    const m = model()
    const see = buildPanelSeeThrough(m.root)
    see.set(true, 0, false)
    expect(see.level()).toBe(PANEL_SEE_THROUGH_LEVEL)
    expect(see.step(1)).toBe(false)
    see.set(false, 2, false)
    expect(see.level()).toBe(1)
  })

  it('does nothing, harmlessly, for a model without the nodes', () => {
    const see = buildPanelSeeThrough(new THREE.Group())
    expect(see.count()).toBe(0)
    see.set(true, 0, true)
    expect(see.step(100)).toBe(true)
    expect(see.step(300)).toBe(false)
  })
})
