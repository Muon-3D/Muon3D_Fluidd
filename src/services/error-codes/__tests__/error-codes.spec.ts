import { afterEach, describe, expect, it } from 'vitest'
import { docsUrl, GENERIC_SHORT, lookupCode, resetErrorBook, resolveError, useErrorBook } from '..'
import { MESSAGE_MATCHERS } from '../matchers'
import seed from '../catalogue.json'

afterEach(() => resetErrorBook())

describe('error code mapping', () => {
  it('an explicit known code gives the book line, whatever the message says', () => {
    const r = resolveError({ code: 'mu-homing-0001', message: 'something else entirely' })
    expect(r.via).toBe('code')
    expect(r.code).toBe('MU-HOMING-0001')
    expect(r.short).toBe('Homing could not settle on one position.')
    expect(r.full).toContain('something else entirely')
  })

  it('a message with no code is matched conservatively', () => {
    const r = resolveError({ message: 'y home taps disagree by 0.8 mm, tolerance 0.2 mm after 2 retries' })
    expect(r.via).toBe('message')
    expect(r.code).toBe('MU-HOMING-0001')
    expect(r.full).toContain('0.8 mm')
  })

  it('matches the markup Klipper puts in a shutdown message', () => {
    const r = resolveError({ message: 'Error: nozzle is touching the plate, lift Z first<br />Restart.' })
    expect(r.code).toBe('MU-MOTION-0001')
    expect(r.full).not.toContain('<br')
  })

  it('an unknown error keeps a generic line and its original text, never blank', () => {
    const r = resolveError({ message: 'Widget exploded at frame 9' })
    expect(r).toMatchObject({ via: 'none', code: null, entry: null, short: GENERIC_SHORT })
    expect(r.full).toBe('Widget exploded at frame 9')
    expect(resolveError({}).full).not.toBe('')
  })

  it('an unknown code falls back to the message, then to the generic line', () => {
    expect(resolveError({ code: 'MU-NOPE-9999', message: 'sending stopped by peer: error 0' }).code).toBe('MU-NETWORK-0001')
    const r = resolveError({ code: 'MU-NOPE-9999', message: 'odd' })
    expect(r.code).toBeNull()
    expect(r.full).toContain('MU-NOPE-9999')
  })

  it('a retired entry is not shown', () => {
    useErrorBook({ version: 't', entries: [{ ...seed.entries[0], status: 'retired' } as any] })
    expect(lookupCode('MU-HOMING-0001')).toBeNull()
  })

  it('only public entries link to the docs', () => {
    expect(docsUrl(lookupCode('MU-HEAT-0001'))).toBe('https://muon3d.com/errors/MU-HEAT-0001')
    expect(docsUrl(lookupCode('MU-HOMING-0001'))).toBeNull()
    expect(docsUrl(null)).toBeNull()
  })

  it('every matcher points at a seed entry, and each entry has its own code', () => {
    for (const m of MESSAGE_MATCHERS) expect(lookupCode(m.code), m.code).not.toBeNull()
    const codes = seed.entries.map(e => e.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const c of codes) expect(c).toMatch(/^MU-[A-Z]+-\d{4}$/)
  })
})
