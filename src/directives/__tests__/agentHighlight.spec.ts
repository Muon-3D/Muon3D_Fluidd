import Vue from 'vue'
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgentHighlight, colourOf, labelOf } from '../agentHighlight'
import type { AgentActivity } from '@/services/agents'
import type { Highlight } from '@/services/agents/activity'

const release = vi.hoisted(() => vi.fn())
vi.mock('@/services/agents', () => ({ acquireAgentStream: () => release, agentActivity: () => activity.current }))
const activity = Vue.observable({ current: {} as AgentActivity })
const highlight = (over: Partial<Highlight> = {}): Highlight => ({
  key: 'agent:agt_1|printer|hotend',
  controlId: 'hotend',
  deviceId: 'printer',
  agentId: 'agt_1',
  agentName: 'Claude',
  colour: '#476CE0',
  colourIndex: 5,
  action: 'printer.heat',
  phase: 'asked',
  look: 'asked',
  since: 0,
  until: 120_000,
  ...over
})
const wrappers: Array<Wrapper<Vue>> = []
function open () {
  const w = mount({
    directives: { 'agent-highlight': AgentHighlight },
    data: () => ({ id: 'hotend' }),
    template: '<button v-agent-highlight="id">Heat</button>'
  })
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.splice(0).forEach(w => w.destroy())
  activity.current = {}
  release.mockClear()
})

describe('agent highlight', () => {
  it('uses palette, safe hex and neutral colours and labels each phase', () => {
    expect(colourOf(highlight())).toBe('var(--m3d-agent-5)')
    expect(colourOf(highlight({ colourIndex: null }))).toBe('#476CE0')
    expect(colourOf(highlight({ agentId: null }))).toBe('var(--m3d-agent-neutral)')
    expect(colourOf(highlight({ colourIndex: -1, colour: 'url(https://untrusted.invalid)' }))).toBe('var(--m3d-agent-neutral)')
    expect(['asked', 'approved', 'denied', 'failed', 'estop', 'active'].map(look => labelOf(highlight({ look: look as Highlight['look'] })))).toEqual([
      'Claude · waiting for you', 'Claude · approved', 'Claude · denied', 'Claude · failed', 'Claude · emergency stop', 'Claude'
    ])
  })

  it('renders stacked names and follows a changed control binding', async () => {
    const a = highlight()
    const b = highlight({ key: 'agent:agt_2|printer|hotend', agentId: 'agt_2', agentName: 'ChatGPT' })
    activity.current = { hotend: { ...b, stack: [a, b] }, bed: { ...a, look: 'active', stack: [a] } }
    const w = open()
    expect(w.findAll('[data-tid="agent-highlight-name"]').wrappers.map(n => n.text())).toEqual(['Claude · waiting for you', 'ChatGPT · waiting for you'])
    expect(w.attributes('data-agent-look')).toBe('asked')
    await w.setData({ id: 'bed' })
    await Vue.nextTick()
    expect(w.find('[data-tid="agent-highlight"]').attributes('data-control')).toBe('bed')
    expect(w.findAll('[data-tid="agent-highlight-name"]').length).toBe(1)
    expect(w.attributes('data-agent-look')).toBe('active')
  })

  it('shows nothing when idle and releases the overlay and stream on removal', async () => {
    const w = open()
    expect(w.find('[data-tid="agent-highlight"]').exists()).toBe(false)
    expect(w.attributes('data-agent-look')).toBeUndefined()
    const a = highlight()
    activity.current = { hotend: { ...a, stack: [a] } }
    await Vue.nextTick()
    await Vue.nextTick()
    expect(w.attributes('data-agent-look')).toBe('asked')
    activity.current = {}
    await Vue.nextTick()
    await Vue.nextTick()
    expect(w.find('[data-tid="agent-highlight"]').exists()).toBe(false)
    expect(w.attributes('data-agent-look')).toBeUndefined()
    w.destroy()
    expect(release).toHaveBeenCalledTimes(1)
    expect(w.element.classList.contains('m3d-agent-host')).toBe(false)
  })
})
