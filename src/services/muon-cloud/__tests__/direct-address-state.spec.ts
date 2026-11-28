import { beforeEach, describe, expect, it } from 'vitest'
import { connectedByAddress, rememberByAddress } from '../direct-address-state'

describe('the address a printer was connected by, kept for a reload', () => {
  beforeEach(() => localStorage.clear())

  it('matches only the printer and address that were connected by address', () => {
    rememberByAddress('P1', '192.168.1.20')
    expect(connectedByAddress('p1', '192.168.1.20')).toBe(true)
    expect(connectedByAddress('p1', '192.168.1.99')).toBe(false)
    expect(connectedByAddress('p2', '192.168.1.20')).toBe(false)
    expect(connectedByAddress(undefined, '192.168.1.20')).toBe(false)
  })

  it('is cleared when the secure name connects', () => {
    rememberByAddress('p1', '192.168.1.20')
    rememberByAddress('p1', null)
    expect(connectedByAddress('p1', '192.168.1.20')).toBe(false)
  })
})
