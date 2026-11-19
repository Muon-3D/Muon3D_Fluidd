import { afterEach, describe, expect, it } from 'vitest'
import { forgetGrantedRole, grantedRoleFor, readGrantedRole } from '../granted-role'
import { readPairingEntry } from '../entry'
import { policyRefusal, policyRefusedText } from '@/services/managed-transport/refusal'

// 19 Nov: a signed-in non-owner admitted to an Open printer was refused the pairing read as Owner-only, and Control gave up.
const ID = 'a1b2c3d4'.repeat(8)
const POLICY = 'muon-link policy refused this request: not on the remote allowlist; unlisted endpoints are Owner-only by default'
const refused = (status = 403, message = POLICY) => new Response(JSON.stringify({ error: message }), { status })
const NO_WAIT = { delaysMs: [0, 0] }
const level = (n: number) => ({ result: { level: n, name: n ? 'protected' : 'open', protected_surfaces: [], excluded_surfaces: [] } })
/** A printer's HTTP answers by path; the pairing read is Owner-only policy, `protection` is whatever the test says. */
const printer = (protection: Response | (() => Response)) => async (path: string) =>
  path.startsWith('/muon-link/pairing') ? refused() : typeof protection === 'function' ? protection() : protection.clone()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const answer = (routes: Record<string, [number, unknown]>) => ({
  fetch: async (_m: string, path: string) => {
    const [status, body] = routes[path] ?? [404, {}]
    return { status, body: new TextEncoder().encode(JSON.stringify(body)) }
  }
})

afterEach(() => forgetGrantedRole(ID))

describe('the words of the Owner-only refusal', () => {
  it('knows them in an HTTP body, a JSON-RPC error and an Aux answer', () => {
    expect(policyRefusedText(POLICY)).toBe(true)
    expect(policyRefusedText('only the owner is forwarded')).toBe(true)
    expect(policyRefusedText('unlisted endpoints are Owner-only by default')).toBe(true)
    expect(policyRefusal({ code: 403, message: POLICY })).toBe(true)
    expect(policyRefusal({ response: { status: 403, data: { error: POLICY } } })).toBe(true)
  })
  it('does not take any other refusal for it', () => {
    expect(policyRefusedText('Forbidden')).toBe(false)
    expect(policyRefusedText('the owner-only toggle is off')).toBe(false)
    expect(policyRefusedText('this setting is owner-only')).toBe(false)
    expect(policyRefusal({ code: 403, message: 'Forbidden' })).toBe(false)
  })
  it('never takes a 401 for it, whatever the words', () => {
    expect(policyRefusal({ code: 401, message: POLICY })).toBe(false)
    expect(policyRefusal({ response: { status: 401, data: { error: POLICY } } })).toBe(false)
  })
})

describe('a refused /muon-link/pairing read, once the printer has let this browser in', () => {
  it('grants the Operator role when the printer says it is Open (protection level 0)', async () => {
    expect(await readGrantedRole(ID, printer(json(level(0))), { ...NO_WAIT, admitted: true })).toBe('operator')
    expect(grantedRoleFor(ID)).toBe('operator')
  })
  it('also accepts it when the admitted answer arrives late (carried over the radio a moment after)', async () => {
    expect(await readGrantedRole(ID, printer(json(level(0))), { ...NO_WAIT, admitted: async () => true })).toBe('operator')
  })
  it('does NOT make a Viewer an Operator: a Protected printer (level 1) refuses the same way (negative control)', async () => {
    expect(await readGrantedRole(ID, printer(json(level(1))), { ...NO_WAIT, admitted: true })).toBeNull()
    expect(grantedRoleFor(ID)).toBeNull()
  })
  it('grants nothing when the printer will not say whether it is Open (an older muon-link refuses protection too)', async () => {
    expect(await readGrantedRole(ID, printer(refused()), { ...NO_WAIT, admitted: true })).toBeNull()
    expect(await readGrantedRole(ID, printer(json({}, 404)), { ...NO_WAIT, admitted: true })).toBeNull()
    expect(await readGrantedRole(ID, printer(json({ level: '0' })), { ...NO_WAIT, admitted: true })).toBeNull()
  })
  it('never infers on a relay fallback or when not admitted, even on an Open printer', async () => {
    expect(await readGrantedRole(ID, printer(json(level(0))), NO_WAIT)).toBeNull()
    expect(await readGrantedRole(ID, printer(json(level(0))), { ...NO_WAIT, admitted: false })).toBeNull()
    expect(await readGrantedRole(ID, printer(json(level(0))), { ...NO_WAIT, admitted: async () => false })).toBeNull()
  })
  it('grants nothing for a refusal that is not the Owner-only policy (negative control)', async () => {
    const other = (status: number, message: string) => async (path: string) => path.startsWith('/muon-link/pairing') ? refused(status, message) : json(level(0))
    expect(await readGrantedRole(ID, other(403, 'Forbidden'), { ...NO_WAIT, admitted: true })).toBeNull()
    expect(await readGrantedRole(ID, other(401, POLICY), { ...NO_WAIT, admitted: true })).toBeNull()
  })
})

describe('reading how a printer lets a stranger in', () => {
  const routes = (level0: boolean, protection: [number, unknown] = [200, level(level0 ? 0 : 1)]) => ({ '/muon-link/pairing': [403, { error: POLICY }] as [number, unknown], '/server/muon/protection': protection })
  const carried = { carried: async () => true }
  it('reads an Open printer from the policy refusal only when admitted, carried and the printer says Open', async () => {
    expect(await readPairingEntry(answer(routes(true)), carried)).toBe('open')
  })
  it('never gives open to a stranger that is not admitted or not carried over Bluetooth', async () => {
    expect(await readPairingEntry(answer(routes(true)))).toBe('protected')
    expect(await readPairingEntry(answer(routes(true)), { carried: async () => false })).toBe('protected')
  })
  it('a Viewer on a Protected printer (level 1, or protection refused) is not open', async () => {
    expect(await readPairingEntry(answer(routes(false)), carried)).toBe('protected')
    expect(await readPairingEntry(answer(routes(true, [403, { error: POLICY }])), carried)).toBe('protected')
  })
  it('a refusal that is not the policy, or a 401, is protected', async () => {
    expect(await readPairingEntry(answer({ '/muon-link/pairing': [403, { error: 'Forbidden' }] }), carried)).toBe('protected')
    expect(await readPairingEntry(answer({ '/muon-link/pairing': [401, { error: POLICY }] }), carried)).toBe('protected')
  })
})
