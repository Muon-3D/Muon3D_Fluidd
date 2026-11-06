import { describe, expect, it } from 'vitest'
import { changedLines, downloadsOnly, opensInEditor, orderRoots, restartNote, tapDownloads } from '../model'

describe('Files\' folders', () => {
  it('downloads the logs and nothing else by root', () => {
    expect(downloadsOnly('logs')).toBe(true)
    expect(downloadsOnly('calibration')).toBe(false)
    expect(downloadsOnly('docs')).toBe(false)
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

  it('downloads on a tap: logs, files over 2 MB, and anything that is not text', () => {
    expect(tapDownloads('logs', 'klippy.log', 100)).toBe(true)
    expect(tapDownloads('calibration', 'big.cfg', 3_000_000)).toBe(true)
    expect(tapDownloads('calibration', 'photo.jpg', 100)).toBe(true)
    expect(tapDownloads('calibration', 'printer.cfg', 4000)).toBe(false)
    expect(tapDownloads('defaults', 'm1.cfg', 4000)).toBe(false)
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
})
