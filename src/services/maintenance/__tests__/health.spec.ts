import { describe, expect, it } from 'vitest'
import { attentionCount, healthRows, healthSummary, heaterName, storageText, type HealthInput } from '../health'

const GB = 1024 ** 3

const healthy = (): HealthInput => ({
  socketConnected: true,
  klippyState: 'ready',
  klippyReady: true,
  version: 'v0.12.0-402',
  mcus: [{ name: 'mcu', awake: 0.04 }, { name: 'mcu toolhead', awake: 0.02 }],
  heaters: [{ name: 'extruder', temperature: 219.8, maxTemp: 300 }, { name: 'heater_bed', temperature: 59.5, maxTemp: 120 }],
  bedMesh: { loaded: true, status: { tone: 'ok', text: 'Good · 3 days ago', due: false }, spread: 0.09, measured: '3 days ago' },
  disk: { used: 6 * GB, total: 32 * GB, free: 24 * GB }
})

const row = (input: HealthInput, id: string) => healthRows(input).find(r => r.id === id)

describe('the Checks rows', () => {
  it('say OK for a printer that is well, with the reading behind each', () => {
    const rows = healthRows(healthy())
    expect(rows.map(r => r.id)).toEqual(['klipper', 'mcu', 'heaters', 'bedMesh', 'storage'])
    expect(rows.every(r => r.tone === 'ok')).toBe(true)
    expect(row(healthy(), 'klipper')!.sub).toBe('Running · v0.12.0-402')
    expect(row(healthy(), 'mcu')!.sub).toBe('Both connected · load 4%')
    expect(row(healthy(), 'heaters')!.sub).toBe('Hotend 219.8 °C · Bed 59.5 °C')
    expect(row(healthy(), 'bedMesh')!.sub).toBe('Last calibrated 3 days ago · 0.09 mm spread')
    expect(row(healthy(), 'storage')!.sub).toBe('19% used · 24 GB free')
  })

  it('leave out what the printer does not have, rather than invent a reading', () => {
    const rows = healthRows({ ...healthy(), mcus: [], heaters: [], bedMesh: null, disk: null })
    expect(rows.map(r => r.id)).toEqual(['klipper'])
  })

  it('flag a mesh that is due, and one never measured from here', () => {
    const due = { ...healthy(), bedMesh: { loaded: true, status: { tone: 'warn' as const, text: 'Due', due: true }, spread: 0.09, measured: '12 days ago' } }
    expect(row(due, 'bedMesh')).toMatchObject({ tone: 'warn', pill: 'Re-run soon' })
    const never = { ...healthy(), bedMesh: { loaded: true, status: { tone: 'warn' as const, text: 'Due', due: true }, spread: null, measured: '' } }
    expect(row(never, 'bedMesh')!.sub).toBe('Not calibrated from here yet')
    expect(row(never, 'bedMesh')!.pill).toBe('Run it')
  })

  it('say when Klipper or Moonraker is not up, instead of OK', () => {
    expect(row({ ...healthy(), socketConnected: false, klippyReady: false }, 'klipper')).toMatchObject({ tone: 'err', pill: 'Offline' })
    expect(row({ ...healthy(), klippyReady: false, klippyState: 'startup' }, 'klipper')).toMatchObject({ tone: 'warn', pill: 'Starting' })
    expect(row({ ...healthy(), klippyReady: false, klippyState: 'shutdown' }, 'klipper')).toMatchObject({ tone: 'err', sub: 'Klipper is shutdown' })
    expect(row({ ...healthy(), klippyReady: false }, 'mcu')).toMatchObject({ tone: 'warn', pill: 'Waiting' })
  })

  it('flag a heater with no reading or at its limit', () => {
    const silent = { ...healthy(), heaters: [{ name: 'extruder', temperature: NaN }] }
    expect(row(silent, 'heaters')).toMatchObject({ tone: 'err', sub: 'Hotend not reading' })
    const hot = { ...healthy(), heaters: [{ name: 'heater_bed', temperature: 120, maxTemp: 120 }] }
    expect(row(hot, 'heaters')).toMatchObject({ tone: 'err', pill: 'Too hot' })
  })

  it('flag low storage', () => {
    expect(row({ ...healthy(), disk: { used: 31.5 * GB, total: 32 * GB, free: 0.5 * GB } }, 'storage')).toMatchObject({ tone: 'warn', pill: 'Low' })
  })

  it('warn Not levelled when no mesh is loaded, even if a check ran from here recently', () => {
    const none = { ...healthy(), bedMesh: { loaded: false, status: { tone: 'ok' as const, text: 'Good · today', due: false }, spread: null, measured: 'today' } }
    expect(row(none, 'bedMesh')).toMatchObject({ tone: 'warn', pill: 'Not levelled' })
  })

  it('say Unknown, not OK, for live readings while Moonraker is not answering', () => {
    const down = { ...healthy(), socketConnected: false, klippyReady: false }
    for (const id of ['mcu', 'heaters', 'storage']) expect(row(down, id)).toMatchObject({ tone: 'off', pill: 'Unknown' })
    expect(row(down, 'klipper')).toMatchObject({ tone: 'err', pill: 'Offline' })
  })
})

describe('naming and counting', () => {
  it('names heaters for what they heat', () => {
    expect(heaterName('extruder')).toBe('Hotend')
    expect(heaterName('extruder1')).toBe('Hotend 1')
    expect(heaterName('heater_bed')).toBe('Bed')
    expect(heaterName('heater_generic chamber_heater')).toBe('chamber heater')
  })

  it('writes storage with the share used and what is free', () => {
    expect(storageText({ used: 1 * GB, total: 10 * GB, free: 2.46 * GB })).toBe('10% used · 2.5 GB free')
  })

  it('counts the rows that want a look, and says it under the title', () => {
    const rows = healthRows({ ...healthy(), disk: { used: 31.5 * GB, total: 32 * GB, free: 0.5 * GB } })
    expect(attentionCount(rows)).toBe(1)
    const now = Date.UTC(2026, 10, 6)
    expect(healthSummary('Boxwood', rows, now - 3 * 86_400_000, now)).toBe('Boxwood has 1 thing to look at · last check 3 days ago')
    expect(healthSummary('Boxwood', healthRows(healthy()), now, now)).toBe('Boxwood is in good shape · last check today')
    expect(healthSummary('Boxwood', healthRows(healthy()), null, now)).toBe('Boxwood is in good shape · no check run from here yet')
  })
})
