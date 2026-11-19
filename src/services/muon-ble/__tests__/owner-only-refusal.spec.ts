import { afterEach, describe, expect, it } from 'vitest'
import { forgetGrantedRole, grantedRoleFor, readGrantedRole } from '../granted-role'
import { readPairingEntry } from '../entry'
import { policyRefusal, policyRefusedText } from '@/services/managed-transport/refusal'

// 19 Nov: a signed-in non-owner admitted to an Open printer was refused the pairing read as Owner-only, and Control gave up.
const ID = 'a1b2c3d4'.repeat(8)
const POLICY = 'muon-link policy refused this request: not on the remote allowlist; unlisted endpoints are Owner-only by default'
const refused = (status = 403, message = POLICY) => new Response(JSON.stringify({ error: message }), { status })
const NO_WAIT = { delaysMs: [0, 0] }

afterEach(() => forgetGrantedRole(ID))

describe('the words of the Owner-only refusal', () => {
  it('knows them in an HTTP body, a JSON-RPC error and an Aux answer', () => {
    expect(policyRefusedText(POLICY)).toBe(true)
    expect(policyRefusedText('only the owner is forwarded')).toBe(true)
    expect(policyRefusal({ code: 403, message: POLICY })).toBe(true)
    expect(policyRefusal({ response: { data: { error: POLICY } } })).toBe(true)
  })
  it('does not take any other refusal for it', () => {
    expect(policyRefusedText('Forbidden')).toBe(false)
    expect(policyRefusal({ code: 403, message: 'Forbidden' })).toBe(false)
  })
})

describe('a refused /muon-link/pairing read, once the printer has let this browser in', () => {
  it('grants the Operator role of an Open printer guest, no more', async () => {
    expect(await readGrantedRole(ID, async () => refused(), { ...NO_WAIT, admitted: true })).toBe('operator')
    expect(grantedRoleFor(ID)).toBe('operator')
  })
  it('grants nothing when the printer was not known to admit this browser', async () => {
    expect(await readGrantedRole(ID, async () => refused(), NO_WAIT)).toBeNull()
  })
  it('grants nothing for a refusal that is not the Owner-only policy (negative control)', async () => {
    expect(await readGrantedRole(ID, async () => refused(403, 'Forbidden'), { ...NO_WAIT, admitted: true })).toBeNull()
    expect(await readGrantedRole(ID, async () => refused(401, POLICY), { ...NO_WAIT, admitted: true })).toBeNull()
  })
  it('reads as an Open printer when pairing, which the caller still checks is carried by Bluetooth', async () => {
    const answer = (status: number, body: unknown) => ({ fetch: async () => ({ status, body: new TextEncoder().encode(JSON.stringify(body)) }) })
    expect(await readPairingEntry(answer(403, { error: POLICY }))).toBe('open')
    expect(await readPairingEntry(answer(403, { error: 'Forbidden' }))).toBe('protected')
    expect(await readPairingEntry(answer(401, { error: POLICY }))).toBe('protected')
  })
})
