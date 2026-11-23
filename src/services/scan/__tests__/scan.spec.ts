import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { emptyLine, foundAnything, newScanState, OFFLINE_WHY, progressLine, runScan, type ScanDeps } from '../scan'
import type { CloudNearbyPrinter } from '@/services/muon-cloud/discovery'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'

const SLOE = 'abcdefghijklmnopqrst.muonlan.net'
const ALDER = 'bcdefghijklmnopqrstu.muonlan.net'

function near (id: string, name: string, addrs: string[] = ['192.168.1.20']): CloudNearbyPrinter {
  return { printerId: id, name, model: 'M1', linked: true, localAddrs: addrs }
}

const heard = { deviceId: 'd1', localName: 'muon-hazel-1111', display: 'Hazel · 1111' } as NearbyPrinter

function deps (over: Partial<ScanDeps> = {}): ScanDeps {
  return {
    accountPrinters: async () => [],
    nearby: async () => [],
    reach: async () => false,
    bluetooth: null,
    bluetoothUnavailable: 'no bt',
    pageHost: 'control.muon3d.com',
    ...over
  }
}

describe('runScan', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('starts Bluetooth before any await, so the click is still the gesture', () => {
    const bluetooth = vi.fn(async () => heard)
    runScan(deps({ bluetooth })).catch(() => {})
    expect(bluetooth).toHaveBeenCalledTimes(1)
  })

  it('runs the cloud reads, the probes and Bluetooth at the same time', async () => {
    const started: string[] = []
    const never = () => new Promise<never>(() => {})
    const st = newScanState()
    runScan(deps({
      accountPrinters: async () => { started.push('account'); return [{ id: 'p1', name: 'Sloe', secure_name: SLOE }, { id: 'p2', name: 'Alder', secure_name: ALDER }] },
      nearby: async () => { started.push('nearby'); return [] },
      reach: name => { started.push(`probe ${name}`); return never() },
      bluetooth: () => { started.push('bluetooth'); return never() }
    }), st).catch(() => {})
    await vi.advanceTimersByTimeAsync(0)
    expect(started).toEqual(['bluetooth', 'account', 'nearby', `probe ${SLOE}`, `probe ${ALDER}`])
    expect(progressLine(st)).toBe('Scanning: checking your printers on this network… searching Bluetooth…')
  })

  it('mixes: one secure, one only beside this browser, one over Bluetooth', async () => {
    const st = await runScan(deps({
      accountPrinters: async () => [{ id: 'p1', name: 'Sloe', secure_name: SLOE }, { id: 'p2', name: 'Alder', secure_name: ALDER }],
      nearby: async () => [near('p1', 'Sloe b26d'), near('p2', 'Alder 6601'), near('p3', 'Walnut 8987', ['192.168.1.30'])],
      reach: async name => name === SLOE,
      bluetooth: async () => heard
    }))
    expect(st.phase).toBe('done')
    expect(st.secure.map(p => [p.name, p.url])).toEqual([['Sloe', `https://${SLOE}/`]])
    // Alder did not answer securely and Walnut has no secure name: both are offered by their own page, not secure.
    expect(st.local.map(p => [p.name, p.url])).toEqual([
      ['Alder 6601', 'http://muon-alder-6601.local/'],
      ['Walnut 8987', 'http://muon-walnut-8987.local/']
    ])
    expect(st.heard).toBe(heard)
    expect(foundAnything(st)).toBe(true)
  })

  it('a printer that answers securely is not also listed as .local', async () => {
    const st = await runScan(deps({
      accountPrinters: async () => [{ id: 'P1', name: 'Sloe', secure_name: SLOE }],
      nearby: async () => [near('p1', 'Sloe b26d')],
      reach: async () => true
    }))
    expect(st.secure).toHaveLength(1)
    expect(st.local).toEqual([])
  })

  it('probes only names under our zone', async () => {
    const reach = vi.fn(async () => true)
    const st = await runScan(deps({
      accountPrinters: async () => [
        { id: 'p1', name: 'Evil', secure_name: 'abcdefghijklmnopqrst.example.com' },
        { id: 'p2', name: 'Odd', secure_name: 'evil.com/#.muonlan.net' },
        { id: 'p3', name: 'None', secure_name: null }
      ],
      reach
    }))
    expect(reach).not.toHaveBeenCalled()
    expect(st.secure).toEqual([])
  })

  it('does not wait on a probe that never answers', async () => {
    const run = runScan(deps({
      accountPrinters: async () => [{ id: 'p1', name: 'Sloe', secure_name: SLOE }, { id: 'p2', name: 'Alder', secure_name: ALDER }],
      reach: name => name === SLOE ? Promise.resolve(true) : new Promise<never>(() => {}),
      timeoutMs: 2000
    }))
    await vi.advanceTimersByTimeAsync(2001)
    const st = await run
    expect(st.phase).toBe('done')
    expect(st.secure.map(p => p.name)).toEqual(['Sloe'])
  })

  it('a console that never answers is skipped with the reason, after the time limit', async () => {
    const hang = () => new Promise<never>(() => {})
    const run = runScan(deps({ accountPrinters: hang, nearby: hang, bluetooth: async () => heard, timeoutMs: 1000 }))
    await vi.advanceTimersByTimeAsync(1001)
    const st = await run
    expect(st.cloud).toBe('skipped')
    expect(st.cloudWhy).toBe(OFFLINE_WHY)
    expect(st.heard).toBe(heard)
  })

  it('offline: Bluetooth only, with why the cloud part was skipped', async () => {
    const down = async () => { throw new TypeError('Failed to fetch') }
    const st = await runScan(deps({ accountPrinters: down, nearby: down, bluetooth: async () => heard }))
    expect(st.cloud).toBe('skipped')
    expect(st.heard).toBe(heard)
    expect(st.secure).toEqual([])
  })

  it('one cloud read failing keeps the other', async () => {
    const st = await runScan(deps({
      accountPrinters: async () => { throw new Error('401') },
      nearby: async () => [near('p3', 'Walnut 8987')]
    }))
    expect(st.cloud).toBe('done')
    expect(st.local).toHaveLength(1)
  })

  it('says why Bluetooth was skipped', async () => {
    const st = await runScan(deps({ bluetooth: null, bluetoothUnavailable: 'This browser can\'t use Bluetooth.' }))
    expect(st.bluetooth).toBe('skipped')
    expect(st.bluetoothWhy).toBe('This browser can\'t use Bluetooth.')
  })

  it('a closed chooser is no result, and the empty line says what was tried', async () => {
    const st = await runScan(deps({ bluetooth: async () => null }))
    expect(st.heard).toBeNull()
    expect(foundAnything(st)).toBe(false)
    expect(emptyLine(st)).toBe("No printers found. Tried: your printers' secure addresses, the Muon3D list of printers on this network, Bluetooth.")
  })

  it('a renamed printer with no address from the console is not offered (no name to guess)', async () => {
    const st = await runScan(deps({ nearby: async () => [near('p9', 'Living Room', [])] }))
    expect(st.local).toEqual([])
  })
})
