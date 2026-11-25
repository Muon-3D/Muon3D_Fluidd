/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-6283 (A): the choice of address, and the checks, behind connecting to a printer by its LAN address.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activateLocalPrinter } from '../activate'
import { lanFetch, localNetworkPermission } from '../discovery'
import {
  connectByAddress, directCandidates, directInstance, identityMatches, isPrivateAddress, lnaSupported, urlHost
} from '../direct-address'
import { byAddressSuffix, directAddressState } from '../direct-address-state'

vi.mock('../activate', () => ({ activateLocalPrinter: vi.fn() }))
vi.mock('../discovery', async (orig) => ({ ...(await orig<object>()), lanFetch: vi.fn(), localNetworkPermission: vi.fn() }))

const activate = vi.mocked(activateLocalPrinter)
const fetchLan = vi.mocked(lanFetch)
const permission = vi.mocked(localNetworkPermission)

const ID = 'ab12'.repeat(16)
const identity = (over: Record<string, unknown> = {}) => ({ ok: true, json: async () => ({ result: { name: 'Sloe b26d', endpoint_id: ID, ...over } }) }) as unknown as Response

function agent (ua: string) {
  vi.stubGlobal('navigator', { ...navigator, userAgent: ua })
}
function chrome (major: number) {
  agent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`)
}

beforeEach(() => {
  vi.unstubAllGlobals()
  activate.mockReset()
  fetchLan.mockReset()
  permission.mockReset()
  permission.mockResolvedValue('granted')
  directAddressState.host = null
  chrome(150)
})

describe('which addresses are private', () => {
  it.each(['10.0.0.5', '172.16.0.1', '172.31.255.254', '192.168.137.178', '169.254.10.20', 'fd12:3456::1', 'fc00::2', 'fe80::1'])('%s is', a => {
    expect(isPrivateAddress(a)).toBe(true)
  })
  it.each(['8.8.8.8', '172.32.0.1', '172.15.0.1', '192.169.1.1', '11.0.0.1', '1.2.3.4.5', '010.0.0.1', '256.1.1.1', '2001:db8::1', '2606:4700::1', 'muon3d.local', 'evil.example.com', '192.168.1.1/x', '', null, 42])('%s is not', a => {
    expect(isPrivateAddress(a)).toBe(false)
  })
  it('keeps only private addresses, never the printer hotspot, once each', () => {
    expect(directCandidates(['10.42.0.1', '8.8.8.8', 'muon3d.local', '192.168.1.20', '192.168.1.20', null, '10.0.0.7'])).toEqual(['192.168.1.20', '10.0.0.7'])
  })
  it('brackets an IPv6 literal in a URL', () => {
    expect(urlHost('fd00::1')).toBe('[fd00::1]')
    expect(directInstance('fd00::1', 'Sloe').socketUrl).toBe('ws://[fd00::1]/websocket')
  })
})

describe('Local Network Access support', () => {
  it('Chrome and Edge 142 and newer', () => {
    chrome(142)
    expect(lnaSupported()).toBe(true)
  })
  it('older Chrome, Firefox, Safari and iOS Chrome are not tried', () => {
    chrome(130)
    expect(lnaSupported()).toBe(false)
    for (const ua of [
      'Mozilla/5.0 (Windows NT 10.0; rv:150.0) Gecko/20100101 Firefox/150.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.0.0 Mobile/15E148 Safari/604.1'
    ]) {
      agent(ua)
      expect(lnaSupported()).toBe(false)
    }
  })
})

describe('the printer must answer as the one expected', () => {
  const want = { ids: ['p1', ID], names: ['Sloe b26d'] }
  it('by its id, whatever the case', () => {
    expect(identityMatches({ endpoint_id: ID.toUpperCase() }, want)).toBe(true)
  })
  it('an id that is not ours is another printer, even with the same name', () => {
    expect(identityMatches({ endpoint_id: 'cd34'.repeat(16), name: 'Sloe b26d' }, want)).toBe(false)
  })
  it('by name, only when it reports no id', () => {
    expect(identityMatches({ name: 'sloe b26d' }, want)).toBe(true)
    expect(identityMatches({ name: 'Walnut 1234' }, want)).toBe(false)
  })
  it('nothing usable is not a match', () => {
    expect(identityMatches(null, want)).toBe(false)
    expect(identityMatches({}, want)).toBe(false)
    expect(identityMatches({ endpoint_id: ID }, { ids: [null, undefined], names: [] })).toBe(false)
  })
})

describe('connectByAddress', () => {
  const o = { label: 'Sloe b26d', printerId: ID }

  it('a browser without Local Network Access: nothing is asked of the network', async () => {
    chrome(130)
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'unsupported' })
    expect(fetchLan).not.toHaveBeenCalled()
  })

  it('a public address, a name or a hotspot address is never dialled', async () => {
    expect(await connectByAddress({ ...o, addrs: ['8.8.8.8', 'evil.example.com', '10.42.0.1', '2606:4700::1'] })).toEqual({ ok: false, why: 'no-address' })
    expect(fetchLan).not.toHaveBeenCalled()
    expect(activate).not.toHaveBeenCalled()
  })

  it('permission already refused: blocked, and the browser is not asked again', async () => {
    permission.mockResolvedValue('denied')
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'blocked' })
    expect(fetchLan).not.toHaveBeenCalled()
  })

  it('the person is told about the browser question before it is asked, once', async () => {
    permission.mockResolvedValue('prompt')
    fetchLan.mockResolvedValue(identity())
    activate.mockResolvedValue(true)
    const told = vi.fn()
    await connectByAddress({ ...o, addrs: ['192.168.1.20'], onAsking: told })
    expect(told).toHaveBeenCalledOnce()
    expect(told.mock.invocationCallOrder[0]).toBeLessThan(fetchLan.mock.invocationCallOrder[0])
  })

  it('connects in place over http and ws, sends nothing of the account, and records the address', async () => {
    fetchLan.mockResolvedValue(identity())
    activate.mockResolvedValue(true)
    expect(await connectByAddress({ ...o, addrs: ['8.8.8.8', '192.168.1.20'] })).toEqual({ ok: true, host: '192.168.1.20' })
    const [url, init] = fetchLan.mock.calls[0]
    expect(url).toBe('http://192.168.1.20/server/muon/identity')
    expect(init).toMatchObject({ credentials: 'omit', redirect: 'error' })
    expect(activate).toHaveBeenCalledWith(
      expect.objectContaining({ apiUrl: 'http://192.168.1.20', socketUrl: 'ws://192.168.1.20/websocket', endpointId: ID }), ID
    )
    expect(byAddressSuffix('http://192.168.1.20')).toBe(' (by address, not encrypted)')
    expect(byAddressSuffix('http://192.168.1.21')).toBe('')
    expect(byAddressSuffix('http://sloe.local')).toBe('')
  })

  it('another printer at that address is never shown as this one', async () => {
    fetchLan.mockResolvedValue(identity({ endpoint_id: 'cd34'.repeat(16), name: 'Sloe b26d' }))
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'mismatch' })
    expect(activate).not.toHaveBeenCalled()
    expect(directAddressState.host).toBeNull()
  })

  it('an address that does not answer goes on to the next, then reports unreachable', async () => {
    fetchLan.mockRejectedValueOnce(new TypeError('no route')).mockResolvedValueOnce(identity())
    activate.mockResolvedValue(true)
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20', '10.0.0.7'] })).toEqual({ ok: true, host: '10.0.0.7' })
    fetchLan.mockReset()
    fetchLan.mockRejectedValue(new TypeError('no route'))
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'unreachable' })
  })

  it('a request that fails because the person said no is blocked', async () => {
    permission.mockResolvedValueOnce('prompt').mockResolvedValue('denied')
    fetchLan.mockRejectedValue(new TypeError('blocked'))
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'blocked' })
  })

  it('the printer would not open after it answered: failed, nothing recorded', async () => {
    fetchLan.mockResolvedValue(identity())
    activate.mockResolvedValue(false)
    expect(await connectByAddress({ ...o, addrs: ['192.168.1.20'] })).toEqual({ ok: false, why: 'failed' })
    expect(directAddressState.host).toBeNull()
  })
})
