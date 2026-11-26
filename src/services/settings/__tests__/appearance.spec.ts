import { describe, expect, it } from 'vitest'
import { APPEARANCE_KEY, readAppearance, resolveAppearance, writeAppearance } from '../appearance'

const memory = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [[APPEARANCE_KEY, initial]])
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) } }
}

describe('appearance (KAN-6106)', () => {
  it('reads what this browser holds, and nothing from a bad copy', () => {
    expect(readAppearance(memory('{"color":"#7AA7FF","mode":"light"}'))).toEqual({ color: '#7aa7ff', mode: 'light' })
    expect(readAppearance(memory('{"color":"blue","mode":"sepia"}'))).toBeNull()
    expect(readAppearance(memory('not json'))).toBeNull()
    expect(readAppearance(memory())).toBeNull()
  })

  it('round-trips through the store', () => {
    const store = memory()
    writeAppearance({ color: '#c9a7ff', mode: 'auto' }, store)
    expect(readAppearance(store)).toEqual({ color: '#c9a7ff', mode: 'auto' })
  })

  it('keeps this browser\'s choice over the printer\'s', () => {
    const r = resolveAppearance({ color: '#9be38f', mode: 'dark' }, { color: '#7aa7ff', isDark: false, mode: 'light' })
    expect(r.appearance).toEqual({ color: '#9be38f', mode: 'dark' })
    expect(r.migrate).toBeNull()
  })

  it('hands a theme a printer saved before to this browser, once', () => {
    const r = resolveAppearance(null, { color: '#7aa7ff', isDark: false, mode: 'light' })
    expect(r.appearance).toEqual({ color: '#7aa7ff', mode: 'light' })
    expect(r.migrate).toEqual({ color: '#7aa7ff', mode: 'light' })
  })

  it('reads a theme saved before Auto by its isDark', () => {
    expect(resolveAppearance(null, { color: '#80d6d1', isDark: false }).appearance).toEqual({ color: '#80d6d1', mode: 'light' })
  })

  it('migrates nothing from a printer that never changed the defaults', () => {
    const r = resolveAppearance(null, { color: '#80D6D1', isDark: true })
    expect(r.appearance).toEqual({ color: '#80d6d1', mode: 'dark' })
    expect(r.migrate).toBeNull()
  })
})
