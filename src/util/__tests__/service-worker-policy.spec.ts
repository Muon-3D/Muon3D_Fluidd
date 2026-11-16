import { describe, expect, it, vi } from 'vitest'
import { serviceWorkerAllowed, serviceWorkerMustGo, unregisterServiceWorkers } from '../service-worker-policy'

const NAME = 'abcdefghijklmnopqrst.lan.muon3d.com'
const at = (protocol: string, hostname: string) => ({ protocol, hostname })

describe('service worker policy', () => {
  it('runs none on a printer: plain HTTP off loopback, and its own secure name', () => {
    expect(serviceWorkerAllowed(at('http:', '192.168.1.50'))).toBe(false)
    expect(serviceWorkerAllowed(at('http:', 'muon3d.local'))).toBe(false)
    expect(serviceWorkerAllowed(at('http:', '10.42.0.1'))).toBe(false)
    expect(serviceWorkerAllowed(at('https:', NAME))).toBe(false)
    expect(serviceWorkerAllowed(at('https:', `192-168-1-50.${NAME}`))).toBe(false)
  })

  it('keeps it on the hosted console and on localhost', () => {
    expect(serviceWorkerAllowed(at('https:', 'control.muon3d.com'))).toBe(true)
    expect(serviceWorkerAllowed(at('http:', 'localhost'))).toBe(true)
    expect(serviceWorkerAllowed(at('http:', '127.0.0.1'))).toBe(true)
  })

  it('removes an existing worker only on a printer secure origin', async () => {
    expect(serviceWorkerMustGo(at('https:', NAME))).toBe(true)
    expect(serviceWorkerMustGo(at('https:', 'control.muon3d.com'))).toBe(false)
    expect(serviceWorkerMustGo(at('http:', '192.168.1.50'))).toBe(false)
    const unregister = vi.fn(async () => true)
    await expect(unregisterServiceWorkers({ getRegistrations: async () => [{ unregister }, { unregister }] as any })).resolves.toBe(2)
    expect(unregister).toHaveBeenCalledTimes(2)
  })
})
