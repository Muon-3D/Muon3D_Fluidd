import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Slice from '../Slice.vue'
import type { ConfirmRequest } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'

function mountSlice (confirm: (message: string) => Promise<boolean> = async () => true) {
  const store = {
    state: { config: { apiUrl: '' }, socket: { acceptingNotifications: false }, printer: { printer: {} } },
    getters: { 'socket/getConnectionState': false },
    subscribeAction: () => () => {}
  }
  return shallowMount(Slice, {
    mocks: {
      $store: store,
      $httpClient: { get: vi.fn(), post: vi.fn() },
      $vuetify: { theme: { dark: true }, breakpoint: { mobile: false } },
      $t: (key: string) => key,
      $tc: (key: string) => key,
      $confirm: confirm
    },
    stubs: { 'print-confirm-dialog': true, 'v-alert': true }
  })
}

const request = (signal = new AbortController().signal): ConfirmRequest => ({
  printer: { key: 'a'.repeat(64), name: 'Walnut', model: 'Muon3D M1', route: 'local', role: 'operator', online: true },
  paths: ['a.gcode'],
  mode: 'start',
  plateClear: 'not-needed',
  signal
})

describe('Slice', () => {
  it('frames the slicer\'s embed.html once its host listens', () => {
    const wrapper = mountSlice()
    const frame = wrapper.find('iframe').element as HTMLIFrameElement
    expect(frame.src).toBe(new URL('/slicer/embed.html', window.location.href).href)
    expect(frame.getAttribute('title')).toBe('Muon3D Slicer')
    expect((wrapper.vm as any).host).not.toBeNull()
    wrapper.destroy()
  })

  it('shows one dialog at a time and answers it with the person\'s choice', async () => {
    const wrapper = mountSlice()
    const vm = wrapper.vm as any
    const first = vm.confirm(request())
    expect(vm.dialogRequest).toEqual({ printer: 'Walnut', paths: ['a.gcode'], mode: 'start', plateClear: 'not-needed' })
    await expect(vm.confirm(request())).rejects.toMatchObject({ kind: 'busy' })
    vm.handleAnswer({ choice: 'print', plateClear: false })
    await expect(first).resolves.toEqual({ choice: 'print', plateClear: false })
    expect(vm.dialogRequest).toBeNull()
    wrapper.destroy()
  })

  it('closes the dialog when its request ends first (a switch, the frame\'s cancel): nothing starts', async () => {
    const wrapper = mountSlice()
    const vm = wrapper.vm as any
    const abort = new AbortController()
    const pending = vm.confirm(request(abort.signal))
    abort.abort()
    await expect(pending).rejects.toThrow('The request ended')
    expect(vm.dialogRequest).toBeNull()
    vm.handleAnswer({ choice: 'print', plateClear: false })
    wrapper.destroy()
  })

  it('asks before leaving only while the slicer has changes it has not saved', async () => {
    const confirm = vi.fn(async () => false)
    const wrapper = mountSlice(confirm)
    const vm = wrapper.vm as any
    const next = vi.fn()
    await vm.beforeRouteLeave({}, {}, next)
    expect(next).toHaveBeenLastCalledWith()
    vm.dirty = true
    await vm.beforeRouteLeave({}, {}, next)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenLastCalledWith(false)
    wrapper.destroy()
  })
})
