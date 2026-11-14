import { beforeEach, describe, expect, it } from 'vitest'
import { autoPrintHandled, markAutoPrintHandled } from '../auto-print'

beforeEach(() => sessionStorage.clear())

describe('auto-print handled ids (the site\'s Print link opens Print on… once)', () => {
  it('an id is not handled until marked, and stays handled (a reload, Back)', () => {
    expect(autoPrintHandled('pub-1')).toBe(false)
    markAutoPrintHandled('pub-1')
    expect(autoPrintHandled('pub-1')).toBe(true)
    expect(autoPrintHandled('pub-2')).toBe(false)
  })

  it('keeps the last twenty ids', () => {
    for (let i = 0; i < 22; i++) markAutoPrintHandled(`pub-${i}`)
    expect(autoPrintHandled('pub-0')).toBe(false)
    expect(autoPrintHandled('pub-21')).toBe(true)
  })

  it('unreadable storage reads as nothing handled', () => {
    sessionStorage.setItem('muon.library.autoPrinted', '{not json')
    expect(autoPrintHandled('pub-1')).toBe(false)
  })
})
