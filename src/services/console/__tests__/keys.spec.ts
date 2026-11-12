import { describe, expect, it } from 'vitest'
import { arrowIsHistory, enterAction } from '../keys'

const k = (o: Partial<{ shiftKey: boolean, ctrlKey: boolean, metaKey: boolean, isComposing: boolean }> = {}) =>
  ({ shiftKey: false, ctrlKey: false, metaKey: false, ...o })

describe('Enter in the Console line', () => {
  it('sends on a plain Enter and adds a line on Shift Enter', () => {
    expect(enterAction(k(), true)).toBe('send')
    expect(enterAction(k({ shiftKey: true }), true)).toBe('newline')
    expect(enterAction(k({ ctrlKey: true }), true)).toBe('send')
  })
  it('with Enter sends off, adds a line, and Ctrl or Cmd Enter sends; Shift Enter still adds a line', () => {
    expect(enterAction(k(), false)).toBe('newline')
    expect(enterAction(k({ ctrlKey: true }), false)).toBe('send')
    expect(enterAction(k({ metaKey: true }), false)).toBe('send')
    expect(enterAction(k({ shiftKey: true, ctrlKey: true }), false)).toBe('newline')
  })
  it('never sends while an input method is composing', () => {
    expect(enterAction(k({ isComposing: true }), true)).toBe('newline')
  })
})

describe('arrows in a multi-line line', () => {
  const v = 'G28\nG1 X10\nM105'
  it('up is history only on the first line, down only on the last', () => {
    expect(arrowIsHistory('up', v, 2, 2)).toBe(true)
    expect(arrowIsHistory('up', v, 6, 6)).toBe(false)
    expect(arrowIsHistory('down', v, v.length, v.length)).toBe(true)
    expect(arrowIsHistory('down', v, 6, 6)).toBe(false)
  })
  it('a single line, or an empty one, always recalls; a selection moves the caret instead', () => {
    expect(arrowIsHistory('up', 'M105', 4, 4)).toBe(true)
    expect(arrowIsHistory('down', '', 0, 0)).toBe(true)
    expect(arrowIsHistory('up', 'M105', 0, 4)).toBe(false)
  })
})
