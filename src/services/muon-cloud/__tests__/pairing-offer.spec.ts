import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import { CloudError } from '../api'
import { stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { EID, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

// As in switching.spec: activate.ts pulls in the store, Fluidd's init and the
// Iroh transport at import.
const init = vi.hoisted(() => ({ appInit: vi.fn(async () => ({ apiConnected: true })) }))
vi.mock('@/init', () => init)
vi.mock('@/store', () => ({ default: { state: { config: { hostConfig: {} } } } }))
const cloud = vi.hoisted(() => ({
  borrowCloudPrinter: vi.fn(),
  dropCloudConnection: vi.fn(),
  setActiveCloudPrinter: vi.fn(),
  printerName: vi.fn(() => 'Boxwood'),
  cloudState: { activePrinterId: null }
}))
vi.mock('../state', () => cloud)
vi.mock('../discovery', () => ({ pageReach: vi.fn(async () => 'reached'), isOwnHotspot: vi.fn(() => false) }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: vi.fn(() => () => {}) }))

const { activateCloudPrinter, activationState } = await import('../activate')

/** What the wasm client rejects with when the printer closes the connection with a NET-17 code. */
const refusal = (code: number) => Object.assign(new Error('the printer refused this key: unauthorised'), { kind: 'refused', code })

const transport = (fetch: () => Promise<unknown>) => ({ fetch: vi.fn(fetch), openWebSocket: vi.fn(async () => ({ close: vi.fn() })), close: vi.fn() })

beforeEach(() => {
  vi.clearAllMocks()
  ;(Vue as any).$socket = { close: vi.fn(), connect: vi.fn(), releaseTransportSocket: vi.fn(), adoptTransportSocket: vi.fn() }
  ;(Vue as any).$httpClient = {}
  activationState.pairing = null
  activationState.error = null
})
afterEach(() => stopUsingBluetoothFor(EID))

describe('offering to pair this browser (KAN-1253)', () => {
  it('offers it when the printer refuses this key as unauthorised over Bluetooth', async () => {
    useBluetoothFor(EID, fakePrinter().device)
    cloud.borrowCloudPrinter.mockResolvedValue(transport(async () => { throw refusal(0x040a) }))

    await expect(activateCloudPrinter(EID)).rejects.toThrow()

    expect(activationState.pairing).toBe(EID)
    expect(activationState.error).toMatch(/Control/)
    expect(activationState.error).toMatch(/pair/i)
  })

  it('does not offer it for a refusal that is not "unauthorised"', async () => {
    useBluetoothFor(EID, fakePrinter().device)
    cloud.borrowCloudPrinter.mockResolvedValue(transport(async () => { throw refusal(0x0403) }))

    await expect(activateCloudPrinter(EID)).rejects.toThrow()

    expect(activationState.pairing).toBeNull()
  })

  it.each([401, 403])('never offers it for the console saying %i', async status => {
    useBluetoothFor(EID, fakePrinter().device)
    cloud.borrowCloudPrinter.mockRejectedValue(new CloudError('Forbidden', status))

    await expect(activateCloudPrinter(EID)).rejects.toThrow()

    expect(activationState.pairing).toBeNull()
  })

  it('does not offer it when the person did not choose Bluetooth', async () => {
    // Not over Bluetooth, the same refusal comes from the first load.
    cloud.borrowCloudPrinter.mockResolvedValue(transport(async () => new Response('{}')))
    init.appInit.mockRejectedValueOnce(refusal(0x040a))

    await expect(activateCloudPrinter(EID)).rejects.toThrow()

    expect(activationState.pairing).toBeNull()
  })

  it('clears an old offer when the next open starts', async () => {
    activationState.pairing = EID
    cloud.borrowCloudPrinter.mockResolvedValue(transport(async () => new Response('{}')))

    await activateCloudPrinter(EID)

    expect(activationState.pairing).toBeNull()
  })
})
