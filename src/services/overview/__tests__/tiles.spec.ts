import { describe, expect, it } from 'vitest'
import { filamentView, inkFor, signed, spanText } from '../tiles'

describe('filamentView', () => {
  it('says "No material loaded" plainly when nothing is known, with no amount', () => {
    const v = filamentView(null, null, null)
    expect(v).toEqual({ type: 'No material loaded', detail: 'Set it from the ⋯ menu', colour: null, source: 'none' })
    expect(JSON.stringify(v)).not.toMatch(/%| g\b|remaining/)
  })
  it('prefers the active Spoolman spool', () => {
    const v = filamentView({ filament: { material: 'PETG', name: 'Black', color_hex: '2b2f31', vendor: { name: 'Acme' } } }, { name: 'PLA', colour: '#FFFFFF' }, null)
    expect(v).toMatchObject({ type: 'PETG', detail: 'Acme Black', colour: '#2B2F31', source: 'spoolman' })
  })
  it('then what someone said is loaded, with its colour name', () => {
    expect(filamentView(undefined, { name: 'PLA', colour: '#FFFFFF' }, { name: 'ABS', colour: null })).toMatchObject({ type: 'PLA', source: 'printer', colour: '#FFFFFF' })
    expect(filamentView(undefined, { name: 'PLA', colour: null }, null).detail).toBe('Colour not set')
  })
  it('then what the print file was sliced for', () => {
    expect(filamentView(null, null, { name: 'PETG', colour: null })).toMatchObject({ type: 'PETG', detail: 'from the print file', source: 'file' })
  })
})

describe('small formatters', () => {
  it('writes a signed offset with a real minus', () => {
    expect(signed(-0.045)).toBe('−0.045')
    expect(signed(0.02)).toBe('+0.020')
    expect(signed(0)).toBe('0.000')
  })
  it('reads spans for people', () => {
    expect(spanText(2400)).toBe('40 min')
    expect(spanText(3900)).toBe('1 h 5 min')
    expect(spanText(null)).toBe('—')
    expect(spanText(-1)).toBe('—')
  })
  it('picks readable ink', () => {
    expect(inkFor('#FFFFFF')).toBe('#1d1d1f')
    expect(inkFor('#000000')).toBe('#f5f5f7')
    expect(inkFor(null)).toBe('var(--m3d-text-subtle)')
  })
})
