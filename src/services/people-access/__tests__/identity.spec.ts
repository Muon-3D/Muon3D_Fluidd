import Vue from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { connectedEndpointId } from '../identity'

const original = Vue.$httpClient
afterEach(() => { Vue.$httpClient = original })

describe('identity unavailable', () => {
  it.each([{ result: {} }, {}, null])('an absent identity is unavailable: %j', async data => {
    Vue.$httpClient = { get: vi.fn().mockResolvedValue({ data }) } as never
    expect(await connectedEndpointId()).toBeNull()
  })

  it('returns the reported ID, normalized', async () => {
    Vue.$httpClient = { get: vi.fn().mockResolvedValue({ data: { result: { endpoint_id: 'ABC' } } }) } as never
    expect(await connectedEndpointId()).toBe('abc')
  })
  it.each([401, 403])('HTTP %s has a route-neutral unavailable result', async status => {
    const get = vi.fn().mockRejectedValue({ response: { status } })
    Vue.$httpClient = { get } as never
    expect(await connectedEndpointId()).toBeNull()
    expect(get).toHaveBeenCalledOnce()
  })
})
