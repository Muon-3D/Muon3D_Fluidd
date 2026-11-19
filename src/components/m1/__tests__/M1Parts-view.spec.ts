import { describe, expect, it } from 'vitest'
import M1Parts from '../M1Parts.vue'

/**
 * KAN-4816: the top-down view the person chose stays through a toolhead move. The printer reports busy while the head
 * moves (the stage's state turns 'printing'); only a real print lets the view go. The real getters run against a plain
 * stand-in for the component.
 */
type Getter = (this: Record<string, unknown>) => unknown
const computed = (M1Parts as unknown as { options: { computed: Record<string, { get: Getter }> } }).options.computed

function view (over: Record<string, unknown>) {
  const c: Record<string, unknown> = {
    selected: 'toolhead',
    controlReady: true,
    printLocked: false,
    stageState: 'idle',
    busy: false,
    viewer: { accurate: true },
    ...over
  }
  for (const name of ['interactive', 'busyHere', 'holdsPart', 'topView']) {
    Object.defineProperty(c, name, { get: () => computed[name].get.call(c) })
  }
  return c as { topView: boolean, holdsPart: boolean }
}

describe('the chosen top view persists across position updates', () => {
  it('is top-down when the toolhead is selected and the printer idle', () => {
    expect(view({}).topView).toBe(true)
  })
  it('stays top-down while the head moves (printer busy, not a print)', () => {
    for (const position of [[100, 100, 10], [120, 90, 10], [130, 40, 3]]) {
      expect(view({ stageState: 'printing', busy: true, position }).topView).toBe(true)
    }
  })
  it('is let go in a real print', () => {
    expect(view({ stageState: 'printing', busy: true, printLocked: true }).topView).toBe(false)
  })
  it('is let go when the printer is offline or the part is not the toolhead', () => {
    expect(view({ stageState: 'offline' }).topView).toBe(false)
    expect(view({ selected: 'plate' }).topView).toBe(false)
  })
})
