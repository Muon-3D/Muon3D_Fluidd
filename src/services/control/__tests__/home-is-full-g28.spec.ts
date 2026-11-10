import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(__dirname, '../../..')
const isTest = (p: string) => p.includes('__tests__') || /\.(spec|test)\.[tj]sx?$/.test(p)

function walk (dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.(vue|ts|js|tsx)$/.test(e.name) && !isTest(p) ? [p] : []
  })
}

// KAN-1963: Home is always a full G28 (X, Y and Z) so the M1 contact guard re-zeros.
describe('no XY-only home anywhere in src', () => {
  it('has no home(\'XY\') call and no "G28 X Y" string outside tests', () => {
    const files = walk(SRC)
    expect(files.length).toBeGreaterThan(100)
    const bad = files.flatMap(f => readFileSync(f, 'utf8').split(/\r?\n/)
      .map((line, i) => ({ f, i: i + 1, line }))
      .filter(x => /home\(\s*['"`]XY['"`]\s*\)/i.test(x.line) || /G28\s+X\s+Y/i.test(x.line))
      .map(x => `${x.f.slice(SRC.length + 1)}:${x.i}`))
    expect(bad).toEqual([])
  })
})
