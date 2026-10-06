import { describe, expect, it } from 'vitest'
import { CloudError, type Approval } from '../api'
import { fromApproval, fromJoinAnswer, fromJoinError, isWaiting, normalizeJoinCode } from '../join'

const APPROVAL: Approval = {
  id: 'ap1',
  kind: 'link_join',
  printer_id: 'p1',
  printer_name: 'Walnut',
  link_id: 'l1',
  role: 'operator',
  state: 'pending',
  created_at: 1,
  expires_at: 86_401,
  answered_at: null
}

describe('an invite link code', () => {
  it('is read as the console reads it: case, hyphens and spaces ignored, O as 0, I and L as 1', () => {
    expect(normalizeJoinCode('7kq2m-9xdpf')).toBe('7KQ2M9XDPF')
    expect(normalizeJoinCode(' 7KQ2M 9XDPF ')).toBe('7KQ2M9XDPF')
    expect(normalizeJoinCode('O1LI2345AB')).toBe('01112345AB')
  })

  it('is refused unless it is ten Crockford symbols', () => {
    for (const bad of [undefined, null, ['7KQ2M9XDPF'], '', '7KQ2M9XDP', '7KQ2M9XDPFF', '7KQ2M9XDPU', '7KQ2M9XD!F']) {
      expect(normalizeJoinCode(bad)).toBeNull()
    }
  })
})

describe('the states of a join', () => {
  it('joined at once', () => {
    expect(fromJoinAnswer({ state: 'joined', printer_id: 'p1', share: {} as any })).toEqual({ kind: 'joined', printerId: 'p1' })
  })

  it('waiting for the owner, then each of their answers', () => {
    const pending = fromJoinAnswer({ state: 'pending', printer_id: 'p1', approval: APPROVAL })
    expect(pending).toEqual({ kind: 'pending', printerId: 'p1', approvalId: 'ap1', printerName: 'Walnut', expiresAt: 86_401 })
    expect(isWaiting(pending)).toBe(true)
    expect(fromApproval({ ...APPROVAL, state: 'allowed' })).toEqual({ kind: 'joined', printerId: 'p1' })
    expect(fromApproval({ ...APPROVAL, state: 'refused' })).toEqual({ kind: 'refused', printerName: 'Walnut' })
    expect(fromApproval({ ...APPROVAL, state: 'expired' })).toEqual({ kind: 'expired', printerName: 'Walnut' })
    expect(isWaiting(fromApproval({ ...APPROVAL, state: 'refused' }))).toBe(false)
  })

  it('says each of the console\'s refusals in its own words', () => {
    const cases: Array<[number, string]> = [
      [403, 'unverified'], [404, 'unknown'], [409, 'owner'], [410, 'ended'], [429, 'busy'], [401, 'signed_out'], [500, 'failed']
    ]
    for (const [status, reason] of cases) {
      expect(fromJoinError(new CloudError('x', status))).toMatchObject({ kind: 'error', reason })
    }
    expect(fromJoinError(new CloudError('The Muon3D service answered 500.', 500)).kind === 'error' &&
      fromJoinError(new CloudError('The Muon3D service answered 500.', 500))).toMatchObject({ message: 'The Muon3D service answered 500.' })
    expect(fromJoinError(new Error('offline'))).toMatchObject({ reason: 'failed', message: 'offline' })
  })
})
