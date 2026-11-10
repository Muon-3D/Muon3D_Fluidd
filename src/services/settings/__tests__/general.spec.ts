import { describe, expect, it } from 'vitest'
import {
  ACCENTS, accentFor, copyFileName, etaChoiceOf, etaStoredFor, isPersonalPath, mergePersonal, modelLine,
  pickPersonal, progressChoiceOf, progressStoredFor, restoreChanges, serialFromIdentity, themeModeOf
} from '../general'

describe('accents', () => {
  it('are the five from the storyboard, teal first', () => {
    expect(ACCENTS.map(a => a.color)).toEqual(['#80d6d1', '#7aa7ff', '#c9a7ff', '#ffb36b', '#9be38f'])
  })

  it('finds the swatch for a stored colour whatever its case, and none for an older free colour', () => {
    expect(accentFor('#80D6D1')?.name).toBe('Teal')
    expect(accentFor('#123456')).toBeNull()
    expect(accentFor(undefined)).toBeNull()
  })
})

describe('light or dark', () => {
  it('reads a theme saved before Auto from isDark', () => {
    expect(themeModeOf({ isDark: true })).toBe('dark')
    expect(themeModeOf({ isDark: false })).toBe('light')
    expect(themeModeOf({ isDark: true, mode: 'auto' })).toBe('auto')
    expect(themeModeOf({ isDark: true, mode: 'light' })).toBe('light')
  })
})

describe('progress and time left', () => {
  it('shows one choice for a list of one, and none for an older mix (kept until picked)', () => {
    expect(progressChoiceOf(['file'])).toBe('file')
    expect(progressChoiceOf(['layers'])).toBe('layers')
    expect(progressChoiceOf(['slicer'])).toBe('slicer')
    expect(progressChoiceOf(['file', 'filament'])).toBeNull()
    expect(progressChoiceOf(['fileAbsolute'])).toBeNull()
    expect(progressStoredFor('layers')).toEqual(['layers'])
  })

  it('stores Average as the existing average of file and slicer', () => {
    expect(etaChoiceOf(['slicer'])).toBe('slicer')
    expect(etaChoiceOf(['file'])).toBe('file')
    expect(etaChoiceOf(['slicer', 'file'])).toBe('average')
    expect(etaChoiceOf([])).toBeNull()
    expect(etaStoredFor('average')).toEqual(['file', 'slicer'])
    expect(etaStoredFor('slicer')).toEqual(['slicer'])
  })
})

describe('the model line', () => {
  it('names a Muon printer, with its serial only when the printer reports one', () => {
    expect(modelLine(true, 'M1-0042')).toBe('Muon M1 · serial M1-0042')
    expect(modelLine(true, null)).toBe('Muon M1')
    expect(modelLine(true, '  ')).toBe('Muon M1')
    expect(modelLine(false)).toBe('Klipper printer')
  })

  it('reads a serial from the identity, in or out of result, and none from today\'s identity', () => {
    expect(serialFromIdentity({ result: { serial: 'M1-0042' } })).toBe('M1-0042')
    expect(serialFromIdentity({ serial_number: 'M1-7' })).toBe('M1-7')
    expect(serialFromIdentity({ result: { name: 'Boxwood', suffix: '367a' } })).toBeNull()
    expect(serialFromIdentity(null)).toBeNull()
  })
})

describe('personal settings', () => {
  const ui = {
    theme: { color: '#80d6d1', isDark: true, logo: { src: '' }, backgroundLogo: false, style: 'glass' as const },
    general: { confirmOnEstop: false, confirmOnSaveConfigAndRestart: true, confirmOnPowerDeviceChange: true, showUploadAndPrint: true, locale: 'en' }
  }

  it('are Look and Ask before only', () => {
    expect(pickPersonal(ui as never)).toEqual({
      theme: { color: '#80d6d1', isDark: true },
      general: { confirmOnEstop: false, confirmOnSaveConfigAndRestart: true, confirmOnPowerDeviceChange: true, showUploadAndPrint: true }
    })
    expect(isPersonalPath('theme.color')).toBe(true)
    expect(isPersonalPath('general.confirmOnEstop')).toBe(true)
    expect(isPersonalPath('general.locale')).toBe(false)
  })

  it('lay someone\'s own over the printer\'s', () => {
    const merged = mergePersonal(pickPersonal(ui as never), { theme: { color: '#7aa7ff' }, general: { confirmOnEstop: true } })
    expect(merged.theme).toEqual({ color: '#7aa7ff', isDark: true })
    expect(merged.general.confirmOnEstop).toBe(true)
    expect(merged.general.showUploadAndPrint).toBe(true)
  })
})

describe('restoring a copy', () => {
  const current = {
    uiSettings: {
      general: { instanceName: 'Boxwood', confirmOnEstop: false },
      theme: { color: '#80d6d1', isDark: true },
      dashboard: { overviewMacros: ['a', 'b'] },
      editor: { autoSave: true, tabs: 2 }
    },
    macros: { stored: [] },
    charts: { kept: 1 }
  }

  it('lists each setting that changes as old → new, and sections of other changes as a count', () => {
    const copy = {
      uiSettings: {
        general: { instanceName: 'Boxwood', confirmOnEstop: true },
        theme: { color: '#7aa7ff', isDark: true },
        dashboard: { overviewMacros: ['a', 'b', 'c'] },
        editor: { autoSave: false, tabs: 4 }
      },
      macros: { stored: [] }
    }
    expect(restoreChanges(current, copy)).toEqual([
      { label: 'Ask before an emergency stop', value: 'Off → On' },
      { label: 'Accent colour', value: 'Teal → Blue' },
      { label: 'Macros on Overview', value: '1 added' },
      { label: 'Files and editor', value: '2 changed' }
    ])
  })

  it('finds nothing to change in an identical copy, and leaves out what the copy does not hold', () => {
    const { charts, ...held } = current
    expect(charts).toBeDefined()
    expect(restoreChanges(current, JSON.parse(JSON.stringify(held)))).toEqual([])
  })

  it('reads someone\'s own setting as the setting', () => {
    expect(restoreChanges({}, { uiSettings: { personal: { anonymous: { theme: { color: '#ffb36b' } } } } }))
      .toEqual([{ label: 'Accent colour', value: 'None → Orange' }])
  })

  it('names the file after the printer and the day', () => {
    expect(copyFileName('boxwood', new Date(2026, 9, 30))).toBe('boxwood-control-2026-10-30.json')
  })
})
