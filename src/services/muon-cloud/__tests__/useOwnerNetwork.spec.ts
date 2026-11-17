import Vue from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectOwnerNetwork, resetOwnerNetwork, saveNetworkRules, useOwnerNetwork } from '../useOwnerNetwork'
import { announceAccount, SIGNED_OUT } from '../account-events'

const request = vi.fn()
const failure = (status: number, data?: unknown) => Object.assign(new Error(`status ${status}`), { response: { status, data } })
const SETTINGS = { network_from_ble: 'allow', network_from_direct: 'allow', network_from_relay: 'reauth', current_path: 'local' }

beforeEach(() => {
  request.mockReset()
  resetOwnerNetwork()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request }
})

describe('feature detection for the owner network routes', () => {
  it('forgets the old account before another account can see its settings', async () => {
    request.mockResolvedValue({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    const network = useOwnerNetwork().network
    expect(network.available).toBe(true)
    announceAccount({ signedIn: true, id: 'another-account', name: 'Someone else' })
    expect(network.available).toBe(false)
    expect(network.settings).toBeNull()
    announceAccount(SIGNED_OUT)
  })
  it('permits rule changes over the currently allowed relay', async () => {
    request.mockResolvedValue({ status: 200, data: { ...SETTINGS, network_from_relay: 'allow', current_path: 'relay' } })
    await detectOwnerNetwork()
    expect(useOwnerNetwork().network.rulesReadOnly).toBe(false)
  })

  it('ignores an answer from before a reset without disturbing the new request', async () => {
    let finish!: (value: unknown) => void
    request.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const old = detectOwnerNetwork()
    resetOwnerNetwork()
    request.mockResolvedValueOnce({ status: 200, data: { ...SETTINGS, current_path: 'ble' } })
    const fresh = detectOwnerNetwork()
    finish({ status: 200, data: SETTINGS })
    await Promise.all([old, fresh])
    expect(useOwnerNetwork().network.currentPath).toBe('ble')
    expect(useOwnerNetwork().network.available).toBe(true)
  })

  it('forgets cached settings when the bound HTTP adapter changes', async () => {
    const defaults = { adapter: () => {} }
    ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request, defaults }
    request.mockResolvedValue({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    const network = useOwnerNetwork().network
    expect(network.available).toBe(true)
    defaults.adapter = () => {}
    expect(network.available).toBe(false)
    expect(network.settings).toBeNull()
    await detectOwnerNetwork()
    expect(network.available).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('does not apply a late save to another printer connection', async () => {
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    let finish!: (value: unknown) => void
    request.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const saving = saveNetworkRules({ fromBle: 'deny' })
    const refused = expect(saving).rejects.toMatchObject({ kind: 'failed' })
    ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request: vi.fn() }
    finish({ status: 200, data: { ...SETTINGS, network_from_ble: 'deny' } })
    await refused
    expect(useOwnerNetwork().network.settings).toBeNull()
  })
  it('is available when GET settings answers', async () => {
    request.mockResolvedValue({ status: 200, data: SETTINGS })
    const { network } = useOwnerNetwork()
    expect(network.status).toBe('unknown')
    await detectOwnerNetwork()
    expect(network.available).toBe(true)
    expect(network.currentPath).toBe('local')
    expect(network.rulesReadOnly).toBe(false)
  })

  it('shows nothing new on a 404 (an older muon-link)', async () => {
    request.mockRejectedValue(failure(404, 'not found'))
    await detectOwnerNetwork()
    expect(useOwnerNetwork().network.available).toBe(false)
    expect(useOwnerNetwork().network.status).toBe('unavailable')
  })

  it('shows nothing new on 403 forbidden (not the owner)', async () => {
    request.mockRejectedValue(failure(403, { error: 'forbidden' }))
    await detectOwnerNetwork()
    expect(useOwnerNetwork().network.available).toBe(false)
  })

  it('shows nothing new when the printer cannot be reached at all', async () => {
    request.mockRejectedValue(new Error('offline'))
    await detectOwnerNetwork()
    expect(useOwnerNetwork().network.available).toBe(false)
  })

  it('asks once, however many cards ask', async () => {
    request.mockResolvedValue({ status: 200, data: SETTINGS })
    await Promise.all([detectOwnerNetwork(), detectOwnerNetwork()])
    await detectOwnerNetwork()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('a forced refresh keeps what is showing while it asks, and takes the new path', async () => {
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    request.mockResolvedValueOnce({ status: 200, data: { ...SETTINGS, current_path: 'relay' } })
    const refresh = detectOwnerNetwork(true)
    expect(useOwnerNetwork().network.status).toBe('available')
    await refresh
    expect(useOwnerNetwork().network.currentPath).toBe('relay')
  })

  it('a hiccup on a refresh keeps the last good answer', async () => {
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    request.mockRejectedValueOnce(failure(504, { error: 'aux_timeout' }))
    await detectOwnerNetwork(true)
    expect(useOwnerNetwork().network.available).toBe(true)
  })

  it('but a refresh that finds the owner gone hides it again', async () => {
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    request.mockRejectedValueOnce(failure(403, { error: 'forbidden' }))
    await detectOwnerNetwork(true)
    expect(useOwnerNetwork().network.available).toBe(false)
  })

  it('makes the rules read-only over the internet', async () => {
    for (const current_path of ['relay', 'direct_wan']) {
      resetOwnerNetwork()
      request.mockResolvedValue({ status: 200, data: { ...SETTINGS, current_path } })
      await detectOwnerNetwork()
      expect(useOwnerNetwork().network.rulesReadOnly).toBe(true)
    }
    for (const current_path of ['ble', 'local']) {
      resetOwnerNetwork()
      request.mockResolvedValue({ status: 200, data: { ...SETTINGS, current_path } })
      await detectOwnerNetwork()
      expect(useOwnerNetwork().network.rulesReadOnly).toBe(false)
    }
  })

  it('a saved rule replaces the shown rules; a refused save leaves them alone', async () => {
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await detectOwnerNetwork()
    request.mockResolvedValueOnce({ status: 200, data: { ...SETTINGS, network_from_ble: 'deny' } })
    await saveNetworkRules({ fromBle: 'deny' })
    expect(useOwnerNetwork().network.settings?.fromBle).toBe('deny')
    request.mockRejectedValueOnce(failure(403, { error: 'reauth_required' }))
    await expect(saveNetworkRules({ fromBle: 'allow' })).rejects.toMatchObject({ kind: 'reauth_required' })
    expect(useOwnerNetwork().network.settings?.fromBle).toBe('deny')
  })
})
