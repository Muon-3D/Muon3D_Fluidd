import { describe, expect, it } from 'vitest'
import { ACTIVE_MS, BADGE_MS, CONTROL_IDS, activityFor, applyEvent, controlsFor, dropAgent, emptyActivity, nextExpiry, prune, SAFETY_NAME, type ActivityState } from '../activity'
import type { AgentActionEvent, AgentRef } from '../types'

const DEVICE = 'a'.repeat(64)
const CLAUDE: AgentRef = { id: 'agt_1', name: 'Claude', colour: '#476CE0', colour_index: 5, provider: 'anthropic' }
const GPT: AgentRef = { id: 'agt_2', name: 'ChatGPT', colour: '#2F9E5F', colour_index: 3, provider: 'openai' }

function ev (over: Partial<AgentActionEvent> = {}): AgentActionEvent {
  return {
    v: 1,
    at: '2026-11-06T12:00:00Z',
    agent: CLAUDE,
    printer: { id: 'p1', name: 'Boxwood', device_id: DEVICE },
    action: 'printer.heat',
    phase: 'started',
    ask_id: null,
    target: { heater: 'extruder', target_c: 210 },
    error: null,
    ...over
  }
}

function run (events: Array<[AgentActionEvent, number, number]>): ActivityState {
  return events.reduce((s, [e, id, now]) => applyEvent(s, e, id, now), emptyActivity())
}

describe('controlsFor', () => {
  it('maps actions to control ids', () => {
    expect(controlsFor('printer.home', { axes: 'xyz' })).toEqual(['home'])
    expect(controlsFor('printer.move', { move: { x: 1 } })).toEqual(['jog'])
    expect(controlsFor('printer.heat', { heater: 'extruder', target_c: 200 })).toEqual(['hotend'])
    expect(controlsFor('printer.heat', { heater: 'heater_bed', target_c: 60 })).toEqual(['bed'])
    expect(controlsFor('printer.heat', [{ heater: 'extruder', target_c: 0 }, { heater: 'heater_bed', target_c: 0 }])).toEqual(['hotend', 'bed'])
    for (const a of ['printer.start', 'printer.pause', 'printer.cancel']) expect(controlsFor(a, null)).toEqual(['print-start'])
    expect(controlsFor('printer.estop', null)).toEqual([...CONTROL_IDS])
    expect(controlsFor('printer.read', null)).toEqual([])
    expect(controlsFor('printer.unknown', null)).toEqual([])
  })
})

describe('applyEvent / activityFor', () => {
  it('requested shows nothing; asked waits; started tints with the name; finished clears', () => {
    let s = run([[ev({ phase: 'requested' }), 1, 0]])
    expect(activityFor(s, DEVICE, 0)).toEqual({})
    s = applyEvent(s, ev({ phase: 'asked' }), 2, 10)
    expect(activityFor(s, DEVICE, 10).hotend?.look).toBe('asked')
    s = applyEvent(s, ev({ phase: 'approved' }), 3, 20)
    expect(activityFor(s, DEVICE, 20).hotend?.look).toBe('approved')
    expect(activityFor(s, DEVICE, 20 + BADGE_MS).hotend).toBeUndefined()
    s = applyEvent(s, ev({ phase: 'started' }), 4, 30)
    expect(activityFor(s, DEVICE, 30).hotend).toMatchObject({ agentName: 'Claude', colourIndex: 5, colour: '#476CE0', phase: 'started', look: 'active', since: 30 })
    s = applyEvent(s, ev({ phase: 'finished' }), 5, 40)
    expect(activityFor(s, DEVICE, 40)).toEqual({})
  })

  it('a start with no finish clears itself after 120 s', () => {
    const s = run([[ev(), 1, 1000]])
    expect(activityFor(s, DEVICE, 1000 + ACTIVE_MS - 1).hotend).toBeDefined()
    expect(activityFor(s, DEVICE, 1000 + ACTIVE_MS).hotend).toBeUndefined()
    expect(nextExpiry(s)).toBe(1000 + ACTIVE_MS)
    expect(prune(s, 1000 + ACTIVE_MS).entries).toEqual([])
  })

  it('two agents on one control stack, oldest first; one finishing leaves the other', () => {
    let s = run([
      [ev({ action: 'printer.heat', target: { heater: 'heater_bed', target_c: 60 } }), 1, 0],
      [ev({ agent: GPT, target: { heater: 'heater_bed', target_c: 65 } }), 2, 5]
    ])
    const bed = activityFor(s, DEVICE, 10).bed!
    expect(bed.stack.map(h => h.agentName)).toEqual(['Claude', 'ChatGPT'])
    expect(bed.agentName).toBe('ChatGPT')
    s = applyEvent(s, ev({ agent: CLAUDE, phase: 'finished', target: { heater: 'heater_bed', target_c: 60 } }), 3, 20)
    expect(activityFor(s, DEVICE, 20).bed!.stack.map(h => h.agentName)).toEqual(['ChatGPT'])
  })

  it('drops a replayed or older id', () => {
    const s = run([[ev({ phase: 'started' }), 5, 0]])
    expect(applyEvent(s, ev({ phase: 'finished' }), 5, 1)).toBe(s)
    expect(applyEvent(s, ev({ phase: 'finished' }), 4, 1)).toBe(s)
  })

  it('a dual-heater target lights both', () => {
    const s = run([[ev({ target: [{ heater: 'extruder', target_c: 0 }, { heater: 'heater_bed', target_c: 0 }] }), 1, 0]])
    expect(Object.keys(activityFor(s, DEVICE, 0)).sort()).toEqual(['bed', 'hotend'])
  })

  it('no agent is Muon3D safety; a null colour_index stays null; an empty name is Agent', () => {
    let s = run([[ev({ agent: null, phase: 'started', target: [{ heater: 'extruder', target_c: 0 }] }), 1, 0]])
    expect(activityFor(s, DEVICE, 0).hotend).toMatchObject({ agentName: SAFETY_NAME, colourIndex: null, colour: null })
    s = applyEvent(s, ev({ agent: { ...CLAUDE, id: 'agt_3', name: ' ', colour_index: null } }), 2, 0)
    expect(activityFor(s, DEVICE, 0).hotend!.stack[1]).toMatchObject({ agentName: 'Agent', colourIndex: null })
  })

  it('ignores printer.read, other printers and events with no printer', () => {
    let s = run([[ev({ action: 'printer.read', phase: 'finished', target: null }), 1, 0]])
    expect(s.entries).toEqual([])
    expect(s.lastId).toBe(1)
    s = applyEvent(s, ev({ printer: null }), 2, 0)
    expect(s.entries).toEqual([])
    s = applyEvent(s, ev(), 3, 0)
    expect(activityFor(s, 'b'.repeat(64), 0)).toEqual({})
    expect(activityFor(s, DEVICE.toUpperCase(), 0).hotend).toBeDefined()
  })

  it('a failure flashes red; an estop flashes every control', () => {
    let s = run([[ev({ phase: 'failed', error: { code: 'printer_offline', message: 'The printer is offline.' } }), 1, 0]])
    expect(activityFor(s, DEVICE, 0).hotend?.look).toBe('failed')
    s = applyEvent(s, ev({ action: 'printer.estop', phase: 'finished', target: null }), 2, 0)
    const all = activityFor(s, DEVICE, 0)
    expect(Object.keys(all).sort()).toEqual([...CONTROL_IDS].sort())
    expect(all.jog?.look).toBe('estop')
  })

  it('dropAgent takes off everything an agent shows', () => {
    const s = run([[ev(), 1, 0], [ev({ agent: GPT, action: 'printer.home', target: { axes: 'xy' } }), 2, 0]])
    expect(Object.keys(activityFor(dropAgent(s, 'agt_1'), DEVICE, 0))).toEqual(['home'])
  })
})
