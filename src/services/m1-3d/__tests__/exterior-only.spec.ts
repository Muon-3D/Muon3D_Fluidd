import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * KAN-2048: the shipped M1 model is exterior only. This reads the GLB's JSON
 * (the Draco payload keeps its accessor counts) and holds the triangle budget
 * and the node list, so interior parts can't creep back in with a re-export.
 * `tools/m1-exterior-only.mjs` produces the file.
 */
function glbJson (): any {
  const b = readFileSync(resolve(__dirname, '../../../assets/m1/m1-accurate.glb'))
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
}

const NODES = [
  'M1', 'M1_Base', 'M1_Base_Decals', 'M1_Hose', 'M1_HoseRig', 'hose_base', 'M1_Belt', 'M1_BeltRig', 'belt_base',
  'M1_Arm', 'M1_Z_Stage', 'M1_BuildPlate_Glass', 'M1_Y_Gantry', 'M1_X_Carriage', 'hose_head', 'belt_gantry',
  'M1_Knob', 'M1_Panel_Screen',
  // the near-black surface behind openings and seams, riding with each part
  'M1_Backing_M1_Base', 'M1_Backing_M1_Arm', 'M1_Backing_M1_Z_Stage', 'M1_Backing_M1_Y_Gantry', 'M1_Backing_M1_X_Carriage'
]

describe('the shipped M1 model is exterior only', () => {
  const json = glbJson()
  const trianglesOf = (name: string): number => {
    const n = json.nodes.find((x: any) => x.name === name)
    if (n?.mesh === undefined) return 0
    return json.meshes[n.mesh].primitives.reduce((s: number, p: any) => s + json.accessors[p.indices].count / 3, 0)
  }
  const total = json.nodes.reduce((s: number, n: any) => s + (n.mesh === undefined ? 0 : trianglesOf(n.name)), 0)

  it('stays under the exterior-only triangle budget', () => {
    // The pre-KAN-2048 model had 681,041 triangles, with the inside of the shell.
    expect(total).toBeGreaterThan(50_000)
    expect(total).toBeLessThan(MAX_TRIANGLES)
  })

  it('has no node beyond the ones Control binds', () => {
    const names: string[] = json.nodes.map((n: any) => n.name)
    expect(names.filter(n => !NODES.includes(n))).toEqual([])
    for (const n of NODES) expect(names).toContain(n)
  })

  it('keeps every moving part, the glass and the screen', () => {
    for (const n of ['M1_Base', 'M1_X_Carriage', 'M1_Y_Gantry', 'M1_Z_Stage', 'M1_BuildPlate_Glass', 'M1_Panel_Screen', 'M1_Hose', 'M1_Belt']) {
      expect(trianglesOf(n), n).toBeGreaterThan(0)
    }
  })

  it('has no part that is a plain copy of the shell interior (no per-part budget exceeded)', () => {
    for (const n of NODES) expect(trianglesOf(n), n).toBeLessThan(MAX_PER_PART)
  })
})

const MAX_TRIANGLES = 600_000
const MAX_PER_PART = 160_000
