import { afterEach, describe, expect, it, vi } from 'vitest'
import { dialPrinter } from '../iroh'
import { stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { EID, fakeEndpoint, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

afterEach(() => stopUsingBluetoothFor(EID))

function endpoint (connect: (id: string) => Promise<unknown>, ble = fakeEndpoint()) {
  return {
    ...ble.endpoint,
    endpointId: () => 'me',
    secretKey: () => new Uint8Array(32),
    connect: vi.fn(connect),
    close: async () => {}
  } as any
}

describe('dialPrinter', () => {
  it('brings the Bluetooth link up before dialling a printer the person opened over Bluetooth', async () => {
    const printer = fakePrinter()
    const ble = fakeEndpoint()
    const order: string[] = []
    ble.endpoint.addLink.mockImplementationOnce((...args: any[]) => {
      order.push('link')
      return fakeEndpoint().endpoint.addLink(...(args as [string, number]))
    })
    const ep = endpoint(async id => { order.push(`connect ${id.slice(0, 8)}`); return { printerId: () => id } }, ble)
    useBluetoothFor(EID, printer.device)
    await dialPrinter(ep, EID)
    expect(order).toEqual(['link', `connect ${EID.slice(0, 8)}`])
  })

  it('dials through the relay alone for any other printer', async () => {
    const ble = fakeEndpoint()
    const ep = endpoint(async id => ({ printerId: () => id }), ble)
    await dialPrinter(ep, EID)
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
    expect(ep.connect).toHaveBeenCalledWith(EID)
  })

  it('still tries the relay when the link fails, and says Bluetooth failed when both do', async () => {
    const printer = fakePrinter({ answers: false })
    const ep = endpoint(async () => { throw new Error('no route to the printer') })
    useBluetoothFor(EID, printer.device)
    // The link's HELLO times out after 10 s by default; the fake printer never answers.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const dialled = expect(dialPrinter(ep, EID)).rejects
        .toThrow(/Couldn't reach the printer over Bluetooth: The Bluetooth handshake timed out/)
      await vi.advanceTimersByTimeAsync(11_000)
      await dialled
      expect(ep.connect).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('gives the relay error when no Bluetooth was asked for', async () => {
    const ep = endpoint(async () => { throw new Error('no route to the printer') })
    await expect(dialPrinter(ep, EID)).rejects.toThrow('no route to the printer')
  })
})
