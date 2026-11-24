import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrinterRouteProblem from '../PrinterRouteProblem.vue'
import { MUON_LOCAL_QUESTION, setLeave } from '@/services/muon-cloud/muon-local'

describe('PrinterRouteProblem', () => {
  it('asks the muon3d.local question, and only Open navigates', async () => {
    const go = vi.fn()
    setLeave(go)
    const w = mount(PrinterRouteProblem, { propsData: { problem: null, ask: true } })
    expect(w.get('[data-tid="muon-local-question"]').text()).toBe(MUON_LOCAL_QUESTION)
    expect(MUON_LOCAL_QUESTION).toBe("Can't reach your printers from here. Open muon3d.local, the offline page for printers on this network?")
    await w.get('[data-tid="muon-local-cancel"]').trigger('click')
    expect(go).not.toHaveBeenCalled()
    expect(w.emitted('cancel')).toHaveLength(1)
    await w.get('[data-tid="muon-local-open"]').trigger('click')
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith('http://muon3d.local/')
  })

  it('a failed picked route shows its line and the other routes as buttons, which only emit', async () => {
    const w = mount(PrinterRouteProblem, {
      propsData: { problem: { line: "Couldn't connect over Bluetooth.", choices: [{ id: 'cloud', label: 'Over Muon3D' }, { id: 'local', label: 'On this network' }] }, ask: false }
    })
    expect(w.get('[data-tid="route-problem-line"]').text()).toBe("Couldn't connect over Bluetooth.")
    await w.get('[data-tid="route-choice-cloud"]').trigger('click')
    expect(w.emitted('choose')).toEqual([['cloud']])
    expect(w.find('[data-tid="muon-local-question"]').exists()).toBe(false)
  })

  it('shows nothing when nothing failed', () => {
    expect(mount(PrinterRouteProblem, { propsData: { problem: null, ask: false } }).find('[data-tid="route-problem"]').exists()).toBe(false)
  })
})
