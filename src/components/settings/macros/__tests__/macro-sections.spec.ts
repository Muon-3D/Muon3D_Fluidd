import { describe, expect, it } from 'vitest'
import type { Macro } from '@/store/macros/types'
import { macroSections, macrosMovedTo } from '../macro-sections'

const macro = (name: string, categoryId = '0', visible = true, order?: number): Macro => ({ name, categoryId, visible, order, config: { description: `${name} it` } })

const all = [
  macro('load_filament', 'a', true, 0),
  macro('unload_filament', 'a', false, 1),
  macro('purge'),
  macro('park')
]
const macrosIn = (id: string) => all.filter(m => m.categoryId === id)
const categories = [{ id: 'a', name: 'Filament' }]

describe('macroSections', () => {
  it('is each category, then Uncategorised as a section of its own', () => {
    const sections = macroSections(categories, macrosIn, 'Uncategorised')
    expect(sections.map(s => [s.id, s.name, s.count, s.visible])).toEqual([
      ['a', 'Filament', 2, 1],
      ['0', 'Uncategorised', 2, 2]
    ])
  })

  it('keeps an empty Uncategorised, to drop into', () => {
    expect(macroSections([], () => [], 'Uncategorised')).toEqual([{ id: '0', name: 'Uncategorised', count: 0, visible: 0, macros: [] }])
  })

  it('narrows each section to what the search finds, by name, alias or description, keeping the counts', () => {
    const sections = macroSections(categories, macrosIn, 'Uncategorised', 'LOAD')
    expect(sections[0].macros.map(m => m.name)).toEqual(['load_filament', 'unload_filament'])
    expect(sections[1].macros).toEqual([])
    expect(sections[1].count).toBe(2)
  })
})

describe('macrosMovedTo', () => {
  it('puts the macro last in its new section, in that category', () => {
    const moved = macrosMovedTo(all, macrosIn, 'purge', 'a')
    expect(moved?.map(m => [m.name, m.categoryId])).toEqual([['load_filament', 'a'], ['unload_filament', 'a'], ['purge', 'a']])
  })

  it('puts it before the macro it was dropped on', () => {
    expect(macrosMovedTo(all, macrosIn, 'purge', 'a', 'unload_filament')?.map(m => m.name)).toEqual(['load_filament', 'purge', 'unload_filament'])
  })

  it('reorders within a section', () => {
    expect(macrosMovedTo(all, macrosIn, 'unload_filament', 'a', 'load_filament')?.map(m => m.name)).toEqual(['unload_filament', 'load_filament'])
  })

  it('moves back to Uncategorised', () => {
    expect(macrosMovedTo(all, macrosIn, 'load_filament', '0')?.map(m => [m.name, m.categoryId])).toEqual([['purge', '0'], ['park', '0'], ['load_filament', '0']])
  })

  it('does nothing for an unknown macro or a drop on itself', () => {
    expect(macrosMovedTo(all, macrosIn, 'nope', 'a')).toBeNull()
    expect(macrosMovedTo(all, macrosIn, 'purge', '0', 'purge')).toBeNull()
  })
})
