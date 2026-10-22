import { describe, expect, it } from 'vitest'
import { changedLines, compareWithDefaults, opensInEditor, orderRoots, resetRestartNote, restartNote, rootGroup, rootSection, validName } from '../model'

describe('Files\' folders', () => {
  it('names MuonOS\'s roots for people', () => {
    expect(rootGroup('calibration').title).toBe('This printer\'s settings')
    expect(rootGroup('defaults').note).toMatch(/^read only/)
    expect(rootGroup('logs').download).toBe(true)
    expect(rootGroup('timelapse_frames').title).toBe('Timelapse frames')
  })

  it('lists the printer\'s own first', () => {
    expect(orderRoots(['docs', 'logs', 'defaults', 'calibration', 'zzz', 'config'])).toEqual(['config', 'calibration', 'defaults', 'logs', 'docs', 'zzz'])
  })
})

describe('opening a file', () => {
  it('edits text files under 2 MB and downloads the rest', () => {
    expect(opensInEditor('printer.cfg', 4000)).toBe(true)
    expect(opensInEditor('moonraker.conf', 900)).toBe(true)
    expect(opensInEditor('klippy.log', 30_000_000)).toBe(false)
    expect(opensInEditor('photo.jpg', 100)).toBe(false)
  })
})

describe('saving', () => {
  it('says a Klipper restart stops a print, and whether one is running', () => {
    expect(restartNote('klipper', 'Boxwood', false)).toBe('Restarting Klipper stops a print. Boxwood isn\'t printing, so it\'s safe now.')
    expect(restartNote('klipper', 'Boxwood', true)).toMatch(/is printing: save now, and restart once it's done\.$/)
    expect(restartNote('moonraker', 'Boxwood', true)).toBe('Saving and restarting restarts Moonraker.')
    expect(restartNote(null, 'Boxwood', false)).toBe('')
  })

  it('counts the lines changed', () => {
    expect(changedLines('a\nb\nc', 'a\nB\nc')).toBe(1)
    expect(changedLines('a\nb', 'a\nb\nc\nd')).toBe(2)
    expect(changedLines('same', 'same')).toBe(0)
  })

  it('takes names without slashes', () => {
    expect(validName('my_macros.cfg')).toBe(true)
    expect(validName('macros/x.cfg')).toBe(false)
    expect(validName('..')).toBe(false)
    expect(validName('  ')).toBe(false)
  })
})

describe('your configuration and the defaults', () => {
  it('heads the folders as Fluidd lists them, grouped: yours, the defaults, the rest', () => {
    expect(['config', 'calibration', 'defaults', 'logs', 'docs', 'timelapse'].map(rootSection))
      .toEqual(['yours', 'yours', 'defaults', 'other', 'other', 'other'])
    expect(rootGroup('config').title).toBe('Your copy of the configuration')
  })

  it('tells a changed file from a copied one by the listings, and leaves the rest to the contents', () => {
    const defaults = [
      { path: 'core.cfg', size: 3000, modified: 1700000000 },
      { path: 'macros/print.cfg', size: 800, modified: 1700000000 },
      { path: 'macros/homing.cfg', size: 120, modified: 1700000000 }
    ]
    const mine = [
      { path: 'core.cfg', size: 3000, modified: 1700000000 },
      { path: 'macros/print.cfg', size: 812, modified: 1760000000 },
      { path: 'macros/homing.cfg', size: 120, modified: 1760000000 },
      { path: 'my_macros.cfg', size: 40, modified: 1760000000 },
      { path: 'backups/20261016-1/core.cfg', size: 3000, modified: 1700000000 }
    ]
    expect(compareWithDefaults(mine, defaults)).toEqual({
      'core.cfg': 'same',
      'macros/print.cfg': 'changed',
      'macros/homing.cfg': 'check',
      'my_macros.cfg': 'yours'
    })
  })

  it('asks for the restart after a reset only when it is safe', () => {
    expect(resetRestartNote('Boxwood', false)).toBe("Boxwood uses it after Klipper restarts. It isn't printing, so it's safe now.")
    expect(resetRestartNote('Boxwood', true)).toMatch(/stops the print\. Restart once it's done\.$/)
  })
})
