import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { homeXYDisabledReason } from '../home-readiness'

const SRC = resolve(__dirname, '../../..')
const isTest = (p: string) => p.includes('__tests__') || /\.(spec|test)\.[tj]sx?$/.test(p)
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = join(dir, e.name)
  if (e.isDirectory()) return walk(p)
  return /\.(vue|ts|js|tsx)$/.test(e.name) && !isTest(p) ? [p] : []
})

// KAN-6008 replaces KAN-1963: XY-only homing is allowed; it is disabled only per Klipper's readiness.
describe('XY-only home is allowed (KAN-6008)', () => {
  it('Control sends G28 X Y through home(\'XY\') from the Home XY button', () => {
    const src = readFileSync(join(SRC, 'components/control/ControlMove.vue'), 'utf8')
    expect(src).toMatch(/home\(\s*'XY'\s*\)/)
  })
  it('no source file hard-bans XY homing', () => {
    const bad = walk(SRC).flatMap(f => readFileSync(f, 'utf8').split(/\r?\n/)
      .map((line, i) => ({ f, i: i + 1, line }))
      .filter(x => /(refuse|ban|forbid|never)[^\n]*(home\(\s*['"`]XY|G28\s+X\s+Y)/i.test(x.line))
      .map(x => `${x.f.slice(SRC.length + 1)}:${x.i}`))
    expect(bad).toEqual([])
  })
  it('is disabled only per the mirrored Klipper readiness', () => {
    expect(homeXYDisabledReason({})).toBe('')
    expect(homeXYDisabledReason({ m1_machine: { ready: { home_xy: false }, missing: { home_xy: ['toolhead_disconnected'] } } })).toBe('Connect the toolhead first')
  })
})
