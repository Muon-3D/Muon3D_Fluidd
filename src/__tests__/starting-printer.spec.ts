import { beforeAll, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import type { InstanceConfig } from '@/store/config/types'
import { Filters } from '@/plugins/filters'

// init.ts imports the store and the router, which are slow to load and not
// under test here.
vi.mock('@/store', () => ({ default: { state: {}, dispatch: vi.fn() } }))
vi.mock('@/router', () => ({ default: { currentRoute: { path: '/' }, push: vi.fn() } }))

const { startingPrinter } = await import('@/init')

const boxwoodPage = 'http://muon-boxwood-367a.local'

/** Boxwood at the address it had on the event's phone hotspot. */
const lastUsed: InstanceConfig = {
  name: 'Boxwood · 367A',
  apiUrl: 'http://192.168.43.164',
  socketUrl: 'ws://192.168.43.164/websocket',
  active: true
}

function answering (...apiUrls: string[]) {
  return vi.fn(async (apiUrl: string) => apiUrls.includes(apiUrl))
}

beforeAll(() => {
  Vue.$filters = Filters as never
})

describe('startingPrinter', () => {
  it('starts on the page\'s own printer when the one used last does not answer', async () => {
    // Measured on boxwood's own page, 2026-10-09: black for 22 s, then
    // "No moonraker connection" for 192.168.43.164.
    const answers = answering(boxwoodPage)
    await expect(startingPrinter(lastUsed, boxwoodPage, answers)).resolves.toEqual({
      apiUrl: boxwoodPage,
      socketUrl: 'ws://muon-boxwood-367a.local/websocket'
    })
  })

  it('keeps the printer used last when it answers', async () => {
    const answers = answering(lastUsed.apiUrl, boxwoodPage)
    await expect(startingPrinter(lastUsed, boxwoodPage, answers)).resolves.toBe(lastUsed)
  })

  it('keeps the printer used last when the page\'s own does not answer either', async () => {
    await expect(startingPrinter(lastUsed, boxwoodPage, answering())).resolves.toBe(lastUsed)
  })

  it('asks nothing when the printer used last is the page\'s own, or on a hosted page', async () => {
    const answers = answering()
    const own: InstanceConfig = { ...lastUsed, apiUrl: boxwoodPage, socketUrl: 'ws://muon-boxwood-367a.local/websocket' }
    await expect(startingPrinter(own, `${boxwoodPage}/`, answers)).resolves.toBe(own)
    await expect(startingPrinter(lastUsed, null, answers)).resolves.toBe(lastUsed)
    expect(answers).not.toHaveBeenCalled()
  })

  it('leaves a cloud printer to its own transport', async () => {
    const cloud: InstanceConfig = { ...lastUsed, apiUrl: 'https://muon-cloud.invalid', socketUrl: 'wss://muon-cloud.invalid/websocket' }
    const answers = answering(boxwoodPage)
    await expect(startingPrinter(cloud, boxwoodPage, answers)).resolves.toBe(cloud)
    expect(answers).not.toHaveBeenCalled()
  })
})
