import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import M1Parts from '../M1Parts.vue'

/**
 * KAN-5982: moving the pointer off the stage or off the part's panel lets go of the hover and keeps the selection.
 * The real methods run against a plain stand-in for the component.
 */
type Methods = Record<string, (...args: unknown[]) => unknown>
const methods = (M1Parts as unknown as { options: { methods: Methods } }).options.methods

function ctx (over: Record<string, unknown> = {}) {
  const c: Record<string, unknown> = {
    pickFrame: 0,
    pickAt: null,
    bound: { style: { cursor: '' } },
    interactive: true,
    hovered: 'toolhead',
    selected: 'toolhead',
    hoverPicked: false,
    labelOver: false,
    leaveTimer: 0,
    releaseTimer: 0,
    refused: '',
    down: null,
    drag: null,
    dragPointer: null,
    screenOpen: false,
    $el: { contains: () => false },
    deselect: vi.fn(),
    ...over
  }
  for (const name of ['onLeave', 'onPoint', 'onLabelLeave']) c[name] = methods[name].bind(c)
  return c as Record<string, unknown> & { onLeave: (e?: unknown) => void, onLabelLeave: (e?: unknown) => void, deselect: ReturnType<typeof vi.fn>, selected: string | null, hoverPicked: boolean }
}

describe('the selection stays when the pointer leaves (KAN-5982)', () => {
  it('leaving the canvas keeps the selected part, mouse or not', () => {
    for (const pointerType of ['mouse', 'pen', 'touch']) {
      const c = ctx()
      c.onLeave({ pointerType, relatedTarget: null })
      expect(c.selected).toBe('toolhead')
      expect(c.deselect).not.toHaveBeenCalled()
    }
  })

  it('leaving the canvas with a part picked by pointing keeps it too: no release timer is left to run', () => {
    vi.useFakeTimers()
    try {
      const c = ctx({ selected: 'filament', hoverPicked: true })
      c.onLeave({ pointerType: 'mouse', relatedTarget: null })
      vi.advanceTimersByTime(10_000)
      expect(c.deselect).not.toHaveBeenCalled()
      expect(c.selected).toBe('filament')
      expect(c.hoverPicked).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("leaving the part's own panel keeps the selection", () => {
    const c = ctx({ selected: 'filament', hoverPicked: true, labelOver: true })
    c.onLabelLeave({ relatedTarget: null })
    expect(c.deselect).not.toHaveBeenCalled()
    expect(c.selected).toBe('filament')
  })

  it('the hover does clear when the pointer leaves', () => {
    vi.useFakeTimers()
    try {
      const c = ctx() as Record<string, unknown>
      ;(c.onLeave as () => void)()
      vi.advanceTimersByTime(2000)
      expect(c.hovered).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('an unhomed printer never greys the stage (KAN-5982)', () => {
  it('no rule dims the canvas by its place state', () => {
    const live = readFileSync(resolve(__dirname, '../M1Live.vue'), 'utf8')
    const rules = [...live.matchAll(/[^{}]*data-place[^{}]*\{([^}]*)\}/g)]
    for (const [, body] of rules) {
      expect(body).not.toMatch(/opacity|filter|grayscale|saturate|brightness/)
    }
  })
})
