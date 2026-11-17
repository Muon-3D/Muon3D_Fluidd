import Vue from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import { SocketActions } from '@/api/socketActions'
import { scriptsInFlight } from '@/services/control/safe-move'

afterEach(() => { delete (Vue as any).$socket; scriptsInFlight.count = 0 })

it('counts every G-code script through printerGcodeScript until it is answered', async () => {
  let answer!: (v: unknown) => void
  ;(Vue as any).$socket = { emit: vi.fn(() => new Promise(resolve => { answer = resolve })) }
  SocketActions.printerGcodeScript('G28')
  expect(scriptsInFlight.count).toBe(1)
  answer({ result: 'ok' })
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(scriptsInFlight.count).toBe(0)
})

it('does not count a script that was never sent', () => {
  (Vue as any).$socket = { emit: vi.fn(() => undefined) } // socket not open
  SocketActions.printerGcodeScript('G28')
  expect(scriptsInFlight.count).toBe(0)
})

it('a dropped connection, a Klippy disconnect or a shutdown makes the head position stale', async () => {
  const { actions } = await import('@/store/socket/actions')
  const { headStatus } = await import('@/services/control/safe-move')
  const ctx = { dispatch: vi.fn(), commit: vi.fn() } as any
  const run = (name: string, ...args: unknown[]) => (actions as any)[name](ctx, ...args)
  for (const step of [
    () => run('onSocketClose', { wasClean: false }),
    () => run('onSocketClose', { wasClean: true }),
    () => run('notifyKlippyDisconnected'),
    () => run('notifyKlippyShutdown')
  ]) {
    headStatus.fresh = true
    ;(Vue as any).$socket = { emit: vi.fn() }
    await step()
    expect(headStatus.fresh).toBe(false)
  }
})
