import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConsoleActions from '../ConsoleActions.vue'
import { consoleView } from '@/services/console/view'

function show (entries: unknown[] = []) {
  const dispatch = vi.fn()
  const wrapper = mount(ConsoleActions, {
    mocks: { $store: { getters: { 'console/getConsoleEntries': entries }, dispatch } },
    stubs: { 'frame-icon': true }
  })
  return { wrapper, dispatch }
}

describe('Console page-header actions', () => {
  it('chooses what the log shows through the shared view', async () => {
    consoleView.filter = 'all'
    const { wrapper } = show()
    const radios = wrapper.findAll('[role="radio"]').wrappers
    expect(radios.map(r => r.text())).toEqual(['All', 'Commands', 'Warnings', 'Errors'])
    await radios[1].trigger('click')
    expect(consoleView.filter).toBe('commands')
  })

  it('counts the errors on the Errors option', () => {
    const { wrapper } = show([{ type: 'response', message: '!! Move out of range' }])
    expect(wrapper.text()).toContain('Errors · 1')
  })

  it('Clear clears the log', async () => {
    const { wrapper, dispatch } = show()
    await wrapper.find('[data-tid="console-clear"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('console/onClear')
  })
})
