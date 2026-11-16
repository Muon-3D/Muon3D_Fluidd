import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ConsoleCommand from '../ConsoleCommand.vue'
import Console from '../Console.vue'

function mountCommand (console: Record<string, unknown> | undefined) {
  return shallowMount(ConsoleCommand, {
    propsData: { value: 'G2' },
    mocks: {
      $t: (key: string) => key,
      $store: {
        state: { config: { uiSettings: { console } }, console: { commandHistory: [] } },
        getters: { 'printer/getAvailableCommands': { G28: { help: 'Home' } } },
        dispatch: vi.fn()
      }
    },
    stubs: { 'v-container': true, 'v-row': true, 'v-col': true, 'v-textarea': true, 'app-btn': true }
  })
}

const key = () => ({ preventDefault: vi.fn() }) as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> }

describe('the console widget\'s line to send, with the Console settings', () => {
  it('sends on Enter, as before, when Enter sends is on or unset', () => {
    for (const settings of [undefined, { enterSends: true }]) {
      const wrapper = mountCommand(settings)
      const vm = wrapper.vm as unknown as { onEnterDown: (e: KeyboardEvent) => void, onEnterUp: () => void }
      const down = key()
      vm.onEnterDown(down)
      expect(down.preventDefault).toHaveBeenCalled()
      vm.onEnterUp()
      expect(wrapper.emitted('send')).toEqual([['G2']])
    }
  })

  it('adds a line on Enter, and sends nothing, when Enter sends is off', () => {
    const wrapper = mountCommand({ enterSends: false })
    const vm = wrapper.vm as unknown as { onEnterDown: (e: KeyboardEvent) => void, onEnterUp: () => void }
    const down = key()
    vm.onEnterDown(down)
    expect(down.preventDefault).not.toHaveBeenCalled()
    vm.onEnterUp()
    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('completes on Tab when Suggest is on, and leaves Tab alone when it is off', () => {
    const on = mountCommand({ suggest: true })
    const tab = key()
    ;(on.vm as unknown as { onTab: (e: KeyboardEvent) => void }).onTab(tab)
    expect(tab.preventDefault).toHaveBeenCalled()

    const off = mountCommand({ suggest: false })
    const other = key()
    ;(off.vm as unknown as { onTab: (e: KeyboardEvent) => void }).onTab(other)
    expect(other.preventDefault).not.toHaveBeenCalled()
  })
})

describe('the console widget\'s output, with the Console settings', () => {
  const entries = Array.from({ length: 300 }, (_, i) => ({ id: i, message: `line ${i}`, type: 'response', time: 1 }))

  function mountOutput (console: Record<string, unknown> | undefined, readonly = false) {
    return shallowMount(Console, {
      propsData: { items: entries, readonly },
      mocks: {
        $store: {
          state: { config: { uiSettings: { general: { flipConsoleLayout: false }, console } }, console: { consoleCommand: '' } },
          getters: {}
        }
      },
      computed: { klippyConnected: () => true },
      stubs: { 'console-command': true, 'console-item': true, DynamicScroller: true, DynamicScrollerItem: true, 'v-card': true }
    })
  }

  it('keeps the last lines the settings say, and the size they say', () => {
    const wrapper = mountOutput({ linesKept: 200, textSize: 'lg' })
    const vm = wrapper.vm as unknown as { shown: Array<{ message: string }>, textSize: string }
    expect(vm.shown).toHaveLength(200)
    expect(vm.shown[0].message).toBe('line 100')
    expect(vm.textSize).toBe('lg')
  })

  it('shows every line it is given when the settings have none, and leaves the update dialog\'s output alone', () => {
    const plain = mountOutput(undefined)
    expect((plain.vm as unknown as { shown: unknown[] }).shown).toHaveLength(300)
    const readonly = mountOutput({ linesKept: 200, textSize: 'lg' }, true)
    const vm = readonly.vm as unknown as { shown: unknown[], textSize: string }
    expect(vm.shown).toHaveLength(300)
    expect(vm.textSize).toBe('md')
  })
})
