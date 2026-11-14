import { beforeEach, describe, expect, it } from 'vitest'
import { autoPrintHandled, markAutoPrintHandled } from '../auto-print'

beforeEach(() => history.replaceState(null, ''))

describe('auto-print handled mark (the site\'s Print link opens Print on… once per history entry)', () => {
  it('an id is not handled until marked, and the mark stays on the entry (a reload, Back)', () => {
    expect(autoPrintHandled('pub-1')).toBe(false)
    markAutoPrintHandled('pub-1')
    expect(autoPrintHandled('pub-1')).toBe(true)
    expect(autoPrintHandled('pub-2')).toBe(false)
  })

  it('keeps the router\'s own state, and a new entry has no mark (a second click of the link)', () => {
    history.replaceState({ key: 'router-key-1' }, '')
    markAutoPrintHandled('pub-1')
    expect(history.state).toEqual({ key: 'router-key-1', autoPrinted: 'pub-1' })
    history.pushState({ key: 'router-key-2' }, '')
    expect(autoPrintHandled('pub-1')).toBe(false)
  })
})
