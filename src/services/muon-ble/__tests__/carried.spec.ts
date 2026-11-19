import { afterEach, describe, expect, it, vi } from 'vitest'
import { carriedByBluetooth } from '../carried'
import { noteBluetoothFellBack, stopUsingBluetoothFor, useBluetoothFor } from '../link'
import { readGrantedRole, forgetGrantedRole, grantedRoleFor } from '../granted-role'
import { EID, fakePrinter } from './fakes'

afterEach(() => {
  stopUsingBluetoothFor(EID)
  forgetGrantedRole(EID)
  vi.unstubAllGlobals()
})

const refusedByPolicy = async (path: string) => {
  if (path.includes('pairing')) return new Response('only the owner is forwarded', { status: 403 })
  return new Response(JSON.stringify({ level: 0 }), { status: 200 })
}

describe('carriedByBluetooth: when a chosen Bluetooth route needs no waiting', () => {
  it('offline, a route that has not fallen back is carried at once', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    useBluetoothFor(EID, fakePrinter().device)
    const started = Date.now()
    expect(await carriedByBluetooth(EID)).toBe(true)
    expect(Date.now() - started).toBeLessThan(500)
  })

  it('offline but fallen back, it is not carried', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothFellBack(EID, 'relay')
    expect(await carriedByBluetooth(EID)).toBe(false)
  })

  it('online and fallen back to the relay (off the account): never admitted, never an Operator guest', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    useBluetoothFor(EID, fakePrinter().device)
    noteBluetoothFellBack(EID, 'relay')
    expect(await carriedByBluetooth(EID)).toBe(false)
    await readGrantedRole(EID, async path => refusedByPolicy(path), { delaysMs: [], admitted: () => carriedByBluetooth(EID) })
    expect(grantedRoleFor(EID)).toBeNull()
  })
})
