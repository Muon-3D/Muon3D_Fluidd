import { beforeEach, describe, expect, it } from 'vitest'
import {
  BLE_MAX_ATTEMPTS,
  backoffMs,
  bleRetryState,
  mayDialBluetooth,
  noteBluetoothFailure,
  retryBluetooth
} from '../retry'

const ID = 'boxwood'
const refused = { kind: 'refused', code: 0x040a, message: 'refused' }

/** Dials whenever allowed, as the 3 s poll does, and counts the dials. */
function simulate (error: unknown, seconds: number) {
  let dials = 0
  const times: number[] = []
  for (let s = 0; s < seconds; s += 3) {
    const t = 1_000_000 + s * 1000
    if (!mayDialBluetooth(ID, t)) continue
    dials++
    times.push(s)
    noteBluetoothFailure(ID, error, t)
  }
  return { dials, times }
}

beforeEach(() => retryBluetooth(ID))

describe('Bluetooth background retries (I-129)', () => {
  it('waits 2, 4, 8, 16, then 30 seconds', () => {
    expect([1, 2, 3, 4, 5, 6].map(backoffMs)).toEqual([2000, 4000, 8000, 16000, 30000, 30000])
  })

  it('backs off between tries instead of every 3 s', () => {
    const { times } = simulate(new Error('timed out'), 120)
    const gaps = times.slice(1).map((t, i) => t - times[i])
    expect(gaps[0]).toBeGreaterThanOrEqual(3)
    expect(gaps[gaps.length - 1]).toBeGreaterThan(gaps[0])
  })

  it('stops after 5 tries, with the error to show, and stays stopped', () => {
    const { dials } = simulate(new Error('timed out'), 3600)
    expect(dials).toBe(BLE_MAX_ATTEMPTS)
    expect(bleRetryState.stopped[ID]).toBe('timed out')
    expect(mayDialBluetooth(ID, 9e12)).toBe(false)
  })

  it('does not retry a definitive refusal at all', () => {
    const { dials } = simulate(refused, 600)
    expect(dials).toBe(1)
    expect(bleRetryState.stopped[ID]).toBe('refused')
  })

  it('Retry starts a fresh attempt', () => {
    simulate(new Error('x'), 3600)
    expect(mayDialBluetooth(ID, 9e12)).toBe(false)
    retryBluetooth(ID)
    expect(bleRetryState.stopped[ID]).toBeUndefined()
    expect(mayDialBluetooth(ID, 1)).toBe(true)
    expect(simulate(new Error('x'), 3600).dials).toBe(BLE_MAX_ATTEMPTS)
  })
})
