import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PlateClearNotice from '../PlateClearNotice.vue'

type Answer = { status: number, data: unknown }

function notice (post: (url: string) => Promise<Answer>) {
  return mount(PlateClearNotice, {
    mocks: { $confirm: vi.fn(async () => true), $httpClient: { post } }
  })
}

describe('PlateClearNotice', () => {
  it('shows the printer\'s answer for a confirm the person made', async () => {
    const w = notice(async () => ({ status: 200, data: { cleared: true } }))
    await (w.vm as unknown as { ask: () => Promise<void> }).ask()
    expect((w.vm as unknown as { done: boolean }).done).toBe(true)
  })

  it('a late answer, after the notice went away, changes nothing (KAN-7043)', async () => {
    let answer!: (a: Answer) => void
    const w = notice(() => new Promise<Answer>(resolve => { answer = resolve }))
    const vm = w.vm as unknown as { ask: () => Promise<void>, done: boolean, message: string, result: unknown }
    const asked = vm.ask()
    await vi.waitFor(() => expect(answer).toBeTypeOf('function'))
    w.destroy()
    answer({ status: 200, data: { cleared: true } })
    await asked
    expect(vm.done).toBe(false)
    expect(vm.message).toBe('')
    expect(vm.result).toBeNull()
  })
})
