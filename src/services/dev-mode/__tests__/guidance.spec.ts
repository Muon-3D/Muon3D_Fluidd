import { describe, expect, it } from 'vitest'
import { UNLOCKS } from '../guidance'

describe('what developer mode unlocks', () => {
  it('lists the eight unlocks, each linking into Settings or Files', () => {
    expect(UNLOCKS).toHaveLength(8)
    for (const u of UNLOCKS) expect(u.to).toMatch(/^\/(settings(#\w+)?|configure)$/)
    expect(new Set(UNLOCKS.map(u => u.id)).size).toBe(8)
  })

  it('names every page whose locked row says it needs developer mode', () => {
    const where = UNLOCKS.map(u => u.where).join(' | ')
    for (const page of ['Macros', 'Materials', 'Moving and extruding', 'Timelapse', 'Console', 'Updates', 'Files and editor', 'People and access']) {
      expect(where).toContain(page)
    }
  })
})
