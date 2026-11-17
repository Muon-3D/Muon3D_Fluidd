/** @vitest-environment node */
import { beforeEach, expect, it, vi } from 'vitest'
import { IrohPrinter } from '../iroh'
import { chooseRouteMode } from '../route-choice'
import { bluetoothCarrying } from '@/services/muon-ble/link'
import { BLUETOOTH_UPLOAD_TOO_BIG, MAX_BLUETOOTH_UPLOAD_BYTES } from '@/services/muon-ble/upload'
import { ManagedIrohPrinterTransport } from '@/services/managed-transport'

vi.mock('@/services/muon-ble/link', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/muon-ble/link')>(),
  bluetoothCarrying: vi.fn(() => false)
}))

beforeEach(() => { vi.mocked(bluetoothCarrying).mockReset().mockReturnValue(false) })

it.each([
  { mode: 'ble', carrying: true }, { mode: 'ble', carrying: false },
  { mode: 'auto', carrying: true }, { mode: 'auto', carrying: false },
  { mode: 'lan', carrying: false }, { mode: 'cloud', carrying: false }
] as const)('gates the current path, not the route preference: %j', async ({ mode, carrying }) => {
  chooseRouteMode('printer', mode)
  vi.mocked(bluetoothCarrying).mockReturnValue(carrying)
  const fetchWithProgress = vi.fn(async () => ({ status: 201, headers: [], body: new Uint8Array() }))
  const printer = new IrohPrinter({ printerId: () => 'printer', fetchWithProgress } as any)
  const body = new FormData()
  body.append('file', new Blob([new Uint8Array(MAX_BLUETOOTH_UPLOAD_BYTES + 1)]))
  const work = printer.fetch('/server/files/upload', { method: 'POST', body })
  if (carrying) {
    await expect(work).rejects.toThrow(BLUETOOTH_UPLOAD_TOO_BIG)
    expect(fetchWithProgress).not.toHaveBeenCalled()
  } else {
    await expect(work).resolves.toHaveProperty('status', 201)
    expect(fetchWithProgress).toHaveBeenCalledOnce()
  }
})

it('rechecks the current route after encoding, before the first byte is sent', async () => {
  vi.mocked(bluetoothCarrying).mockReturnValueOnce(false).mockReturnValue(true)
  const fetchWithProgress = vi.fn()
  const printer = new IrohPrinter({ printerId: () => 'printer', fetchWithProgress } as any)
  await expect(printer.fetch('/server/files/upload?print=false', { method: 'POST', body: new Uint8Array(MAX_BLUETOOTH_UPLOAD_BYTES + 1) })).rejects.toThrow(BLUETOOTH_UPLOAD_TOO_BIG)
  expect(fetchWithProgress).not.toHaveBeenCalled()
})

it('a local size refusal leaves the shared managed connection available', async () => {
  vi.mocked(bluetoothCarrying).mockReturnValue(true)
  const close = vi.fn()
  const relay = new IrohPrinter({ printerId: () => 'printer', close } as any)
  const transport = new ManagedIrohPrinterTransport({
    authorizedSession: { contractVersion: 'managed-iroh/v1', sessionId: 'test', tenantId: 'test', printerId: 'printer', relayUrl: 'https://relay.invalid', expiresAt: '2099-01-01T00:00:00Z' },
    createEndpoint: async () => ({ openRelay: async () => relay, close: vi.fn() })
  })
  const body = new FormData()
  body.append('file', new Blob([new Uint8Array(MAX_BLUETOOTH_UPLOAD_BYTES + 1)]))
  await expect(transport.fetch('/server/files/upload', { method: 'POST', body })).rejects.toMatchObject({ kind: 'refused', message: BLUETOOTH_UPLOAD_TOO_BIG })
  expect(transport.status.connection).toBe('connected')
  expect(close).not.toHaveBeenCalled()
})
