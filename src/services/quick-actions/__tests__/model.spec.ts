import { describe, expect, it } from 'vitest'
import { findFilamentMacro, quickActions, restartReason, type QuickActionContext } from '../model'

const ready: QuickActionContext = {
  controlLock: '',
  busy: false,
  restartRefusal: '',
  preheatName: 'PLA',
  changeFilament: true,
  levelGcode: 'BED_MESH_CALIBRATE',
  levelBlocked: ''
}

const by = (ctx: QuickActionContext) => Object.fromEntries(quickActions(ctx).map(a => [a.id, a]))

const printing: QuickActionContext = {
  ...ready,
  busy: true,
  levelBlocked: 'Wait until the printer is idle.',
  restartRefusal: 'Not sent. Wait until the printer has finished and is no longer paused or busy.'
}

describe('quickActions', () => {
  it('lists the seven actions in the drawn order', () => {
    expect(quickActions(ready).map(a => a.id)).toEqual(['home', 'preheat', 'cool', 'filament', 'level', 'motors', 'restart'])
  })

  it('enables everything on an idle, ready printer', () => {
    expect(quickActions(ready).every(a => a.reason === '')).toBe(true)
  })

  it('names the material to preheat', () => {
    expect(by(ready).preheat.label).toBe('Preheat PLA')
    expect(by({ ...ready, preheatName: null }).preheat.label).toBe('Preheat')
  })

  it('disables all of them, with the reason, when Control is not ready', () => {
    const a = by({
      ...ready,
      controlLock: 'Klipper is not ready',
      levelBlocked: 'Klipper is not ready',
      restartRefusal: 'Not sent. Connect to a printer you can control first.'
    })
    for (const id of ['home', 'preheat', 'cool', 'filament', 'level', 'motors']) expect(a[id].reason).toBe('Klipper is not ready')
    expect(a.restart.reason).toBe('Connect to a printer you can control first.')
  })

  it('leaves heating, cooling and filament changes available while printing, as Control does', () => {
    const a = by(printing)
    expect(a.preheat.reason).toBe('')
    expect(a.cool.reason).toBe('')
    expect(a.filament.reason).toBe('')
  })

  it('refuses homing, motors off, levelling and restart while busy, in plain words', () => {
    const a = by(printing)
    expect(a.home.reason).toBe('Not while the printer is printing.')
    expect(a.motors.reason).toBe('Not while the printer is printing.')
    expect(a.level.reason).toBe('Wait until the printer is idle.')
    expect(a.restart.reason).toBe('Wait until the printer has finished and is no longer paused or busy.')
  })

  it('says so when the printer has no preset, no filament macro or no bed mesh command', () => {
    const a = by({ ...ready, preheatName: null, changeFilament: false, levelGcode: null })
    expect(a.preheat.reason).toBe('No material is set up to preheat for.')
    expect(a.filament.reason).toBe('This printer has no filament change macro (M600).')
    expect(a.level.reason).toBe("This printer can't measure the bed.")
  })

  it('marks levelling and restart as the ones that ask first', () => {
    expect(by(ready).restart.confirms).toBe(true)
    expect(by(ready).level.confirms).toBe(true)
    expect(by(ready).home.confirms).toBe(false)
  })
})

describe('restartReason', () => {
  it('drops the "Not sent." of a refusal that already happened', () => {
    expect(restartReason('Not sent. Klipper is not connected.')).toBe('Klipper is not connected.')
    expect(restartReason('')).toBe('')
  })
})

describe('findFilamentMacro', () => {
  const macros = [{ name: 'M600', config: { gcode: 'M117 {params.TEMP}' } }, { name: 'LOAD_FILAMENT' }]
  it('finds the change macro by the names Control looks for', () => {
    expect(findFilamentMacro(macros, 'm600', 'change_filament')).toEqual({ name: 'M600', takesTemp: true })
    expect(findFilamentMacro(macros, 'unload_filament')).toBeNull()
  })
})
