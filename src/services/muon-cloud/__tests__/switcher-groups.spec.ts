import { describe, expect, it } from 'vitest'
import { switcherGroups, switcherSectionShown } from '../switcher-groups'
import type { DirectoryEntry } from '../directory'

const entry = (id: string, name = id): DirectoryEntry => ({
  key: `cloud:${id}`,
  section: 'cloud',
  name,
  endpointId: id,
  health: 'online',
  detail: 'Ready',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: [],
  cloud: { id, name, model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: 1 }
})

describe('switcherGroups', () => {
  const entries = [entry('a'), entry('b'), entry('c'), entry('d')]

  it('puts each printer under its account group, and the rest under Other printers', () => {
    const groups = [
      { id: 'g1', name: 'Workshop', printers: ['a', 'c'] },
      { id: 'g2', name: 'Lab', printers: ['b'] }
    ]
    const out = switcherGroups(entries, groups)
    expect(out.map(g => g.name)).toEqual(['Workshop', 'Lab', 'Other printers'])
    expect(out[0].entries.map(e => e.name)).toEqual(['a', 'c'])
    expect(out[1].entries.map(e => e.name)).toEqual(['b'])
    expect(out[2].entries.map(e => e.name)).toEqual(['d'])
    expect(out[0].hint).toBe('2 printers')
    expect(out[1].hint).toBe('1 printer')
  })

  it('has one list, Your printers, when the account has no groups', () => {
    const out = switcherGroups(entries, [])
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('Your printers')
    expect(out[0].entries).toHaveLength(4)
  })

  it('leaves out groups with nothing to show, and Other printers when everyone is grouped', () => {
    const out = switcherGroups([entry('a')], [
      { id: 'g1', name: 'Workshop', printers: ['a'] },
      { id: 'g2', name: 'Empty', printers: ['zzz'] }
    ])
    expect(out.map(g => g.name)).toEqual(['Workshop'])
  })

  it('lists a printer once, under the first group that holds it', () => {
    const out = switcherGroups([entry('a')], [
      { id: 'g1', name: 'One', printers: ['a'] },
      { id: 'g2', name: 'Two', printers: ['a'] }
    ])
    expect(out.map(g => g.name)).toEqual(['One'])
  })

  it('shows nothing for no printers', () => {
    expect(switcherGroups([], [{ id: 'g1', name: 'Workshop', printers: ['a'] }])).toEqual([])
  })
})

describe('switcherSectionShown', () => {
  it('hides Saved in this browser and Found on this network when empty', () => {
    expect(switcherSectionShown(0)).toBe(false)
    expect(switcherSectionShown(1)).toBe(true)
  })
})
