import { describe, expect, it } from 'vitest'
import {
  DEFAULT_QUICK_COMMANDS, chipText, compileFilter, consoleConfig, defaultConsoleConfig, describeFilter, filterProblem,
  accountQuickKey, moveQuickCommand, previewFilter, quickCommandsFor, quickCommandsKey, saveQuickCommand
} from '../settings'
import type { ConsoleEntry } from '@/store/console/types'

const line = (message: string, i = 0): ConsoleEntry => ({ id: i, message, type: 'response', time: 1000 + i })

describe('console settings', () => {
  it('fill anything missing or unusable with the defaults', () => {
    expect(consoleConfig(undefined)).toEqual(defaultConsoleConfig())
    expect(consoleConfig({ timestamps: false, linesKept: 7, textSize: 'xl' as any, historyCount: 50 })).toMatchObject({
      timestamps: false, linesKept: 1000, textSize: 'md', historyCount: 50, suggest: true, enterSends: true
    })
  })
})

describe('quick commands', () => {
  it('are kept per person, with the defaults until someone saves their own', () => {
    const config = consoleConfig({ quickCommands: { acc_1: [{ id: 'a', command: 'M115', label: 'Firmware', send: false }] } })
    expect(quickCommandsFor(config, 'acc_1')).toEqual([{ id: 'a', command: 'M115', label: 'Firmware', send: false }])
    expect(quickCommandsFor(config, 'anonymous').map(q => q.command)).toEqual(DEFAULT_QUICK_COMMANDS.map(q => q.command))
  })

  it('keep an empty list empty, and drop saved entries with no command', () => {
    expect(quickCommandsFor(consoleConfig({ quickCommands: { me: [] } }), 'me')).toEqual([])
    expect(quickCommandsFor(consoleConfig({ quickCommands: { me: [{ command: ' ' } as any, { command: 'G28' } as any] } }), 'me'))
      .toEqual([{ id: 'q0', command: 'G28', label: '', send: true }])
  })

  it('key a person so a dot cannot split the settings path', () => {
    expect(quickCommandsKey('acc.1@x')).toBe('acc_1_x')
    expect(quickCommandsKey(null)).toBe('anonymous')
  })

  it('has no key while the account is still loading, then the account key, or anonymous when nobody is signed in', () => {
    expect(accountQuickKey({ ready: false, account: null })).toBeNull()
    expect(accountQuickKey({ ready: false, account: { id: 'a1' } })).toBeNull()
    expect(accountQuickKey({ ready: true, account: { id: 'a1' } })).toBe('a1')
    expect(accountQuickKey({ ready: true, account: null })).toBe('anonymous')
  })

  it('add with a fresh id, replace by id, and move', () => {
    const list = DEFAULT_QUICK_COMMANDS.slice(0, 2)
    const added = saveQuickCommand(list, { id: '', command: ' M115 ', label: ' FW ', send: true })
    expect(added.at(-1)).toEqual({ id: 'q2', command: 'M115', label: 'FW', send: true })
    expect(saveQuickCommand(added, { ...added[0], label: 'Home' })[0].label).toBe('Home')
    expect(moveQuickCommand(added, 2, 0).map(q => q.command)).toEqual(['M115', 'G28', 'M105'])
    expect(chipText({ id: 'x', command: 'G28', label: '', send: true })).toBe('G28')
  })
})

describe('hide-lines filters', () => {
  const entries = [line('probe at 1,2 is z=0.01', 1), line('ok', 2), line('Probe at 3,4 is z=0.02', 3), line('// timelapse frame', 4)]

  it('match as the console store does: text ignores case, a pattern is as written', () => {
    expect(compileFilter({ type: 'contains', value: 'PROBE' }).test('a probe at')).toBe(true)
    expect(compileFilter({ type: 'starts-with', value: '// time' }).test('// timelapse')).toBe(true)
    expect(compileFilter({ type: 'expression', value: '^probe' }).test('Probe')).toBe(false)
  })

  it('preview what they would hide of the last 200 lines', () => {
    expect(previewFilter({ type: 'expression', value: '^probe at .* is z=' }, entries).hidden.map(e => e.id)).toEqual([1])
    expect(previewFilter({ type: 'contains', value: 'probe' }, entries)).toMatchObject({ of: 4 })
    const many = Array.from({ length: 250 }, (_, i) => line(i < 50 ? 'old probe' : 'new', i))
    expect(previewFilter({ type: 'contains', value: 'probe' }, many)).toEqual({ of: 200, hidden: [] })
  })

  it('refuse a bad pattern with the reason, and an empty one', () => {
    expect(filterProblem({ type: 'expression', value: '([' })).toMatch(/^That pattern can't be used: /)
    expect(filterProblem({ type: 'contains', value: '  ' })).toBe('Type the text to match.')
    expect(filterProblem({ type: 'expression', value: '^ok' })).toBeNull()
    expect(previewFilter({ type: 'expression', value: '([' }, entries).hidden).toEqual([])
  })

  it('describe themselves under their name', () => {
    expect(describeFilter({ type: 'starts-with', value: '// timelapse' })).toBe('starts with "// timelapse"')
    expect(describeFilter({ type: 'expression', value: '^probe' })).toBe('matches /^probe/')
    expect(describeFilter({ type: 'contains', value: 'x' })).toBe('contains "x"')
  })
})
