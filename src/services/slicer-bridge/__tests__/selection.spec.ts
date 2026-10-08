/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import {
  bridgeModel,
  bridgePrinterFor,
  cloudRole,
  createIdentityCache,
  endpointKey,
  identityName,
  MUON_M1,
  originKey,
  samePrinter,
  type FluiddSelection
} from '../selection'
import { isPrinterKey, parseBridgePrinter } from '../vendor/printer-client/bridge/protocol'

const ID = 'AB'.repeat(32)
const KEY = 'ab'.repeat(32)

const lan = (patch: Partial<FluiddSelection> = {}): FluiddSelection => ({
  switching: false,
  cloud: null,
  apiUrl: 'http://192.0.2.10',
  displayName: 'Walnut',
  connected: true,
  ...patch
})

const cloud = (patch: Partial<NonNullable<FluiddSelection['cloud']>> = {}): FluiddSelection => ({
  switching: false,
  cloud: { id: ID, name: 'Oak', model: 'M1', online: true, role: 'operator', shared: false, ...patch },
  cloudName: 'Oak',
  apiUrl: '',
  displayName: '',
  connected: true
})

describe('the printer key', () => {
  it('is an EndpointId in lowercase hex, or the API origin', () => {
    expect(endpointKey(ID)).toBe(KEY)
    expect(endpointKey('xyz')).toBeNull()
    expect(endpointKey(undefined)).toBeNull()
    expect(originKey('http://192.0.2.10:7125/')).toBe('origin:http://192.0.2.10:7125')
    expect(originKey('ftp://printer')).toBeNull()
    expect(isPrinterKey(originKey('http://walnut.local'))).toBe(true)
  })
})

describe('the model and the role', () => {
  it('names any M1 as the slicer\'s profiles do', () => {
    expect(bridgeModel('M1')).toBe(MUON_M1)
    expect(bridgeModel('Muon3D M1')).toBe(MUON_M1)
    expect(bridgeModel('muon-m1')).toBe(MUON_M1)
    expect(bridgeModel('Prusa MK4')).toBe('Prusa MK4')
    expect(bridgeModel('M10')).toBe('M10')
    expect(bridgeModel('')).toBeNull()
  })

  it('takes the account\'s role: watch-only shares are Viewers, operate shares Operators, linked printers their Owner', () => {
    expect(cloudRole({ role: 'viewer', shared: true })).toBe('viewer')
    expect(cloudRole({ role: 'operator', shared: true })).toBe('operator')
    expect(cloudRole({ role: 'operator', shared: false })).toBe('owner')
    expect(cloudRole({ role: undefined })).toBe('owner')
  })
})

describe('the selected printer', () => {
  it('is a cloud printer by its EndpointId, with the account\'s role and the shared mark', () => {
    expect(bridgePrinterFor(cloud(), undefined)).toEqual({ key: KEY, name: 'Oak', model: MUON_M1, route: 'cloud', role: 'owner', online: true })
    expect(bridgePrinterFor(cloud({ role: 'viewer', shared: true }), undefined)).toMatchObject({ role: 'viewer', shared: true })
    expect(bridgePrinterFor({ ...cloud(), connected: false }, undefined)?.online).toBe(false)
    expect(bridgePrinterFor(cloud({ online: false }), undefined)?.online).toBe(false)
    expect(bridgePrinterFor(cloud({ id: 'not-an-endpoint' }), undefined)).toBeNull()
  })

  it('is a network printer by the EndpointId its identity reports, an M1 and an Operator', () => {
    expect(bridgePrinterFor(lan(), { answered: true, endpointId: KEY }))
      .toEqual({ key: KEY, name: 'Walnut', model: MUON_M1, route: 'local', role: 'operator', online: true })
  })

  it('takes its name from its identity, as the slicer\'s own copy does, else Fluidd\'s', () => {
    expect(bridgePrinterFor(lan({ displayName: 'muon-walnut' }), { answered: true, endpointId: KEY, name: 'Walnut' })?.name).toBe('Walnut')
    expect(bridgePrinterFor(lan({ displayName: 'muon-walnut' }), { answered: true, endpointId: KEY, name: null })?.name).toBe('muon-walnut')
    expect(identityName({ name: 'walnut', display: 'Walnut · 8987', source: 'derived' })).toBe('Walnut')
    expect(identityName({ name: 'my oak', display: 'My Oak · 8987', source: 'owner' })).toBe('my oak')
    expect(identityName({ name: 'walnut', display: 'Walnut · ' })).toBe('Walnut')
    expect(identityName({ name: 'walnut' })).toBe('walnut')
    expect(identityName({})).toBeNull()
  })

  it('is keyed by its API origin when it reports no EndpointId, with no model when it did not answer', () => {
    expect(bridgePrinterFor(lan(), { answered: false, endpointId: null }))
      .toMatchObject({ key: 'origin:http://192.0.2.10', model: null })
    expect(bridgePrinterFor(lan({ savedEndpointId: ID }), { answered: false, endpointId: null })?.key).toBe(KEY)
  })

  it('is none while its identity is asked, while Fluidd switches, or with no printer', () => {
    expect(bridgePrinterFor(lan(), undefined)).toBeNull()
    expect(bridgePrinterFor({ ...cloud(), switching: true }, undefined)).toBeNull()
    expect(bridgePrinterFor(lan({ apiUrl: '' }), { answered: true, endpointId: KEY })).toBeNull()
  })

  it('is a printer the slicer\'s validator takes', () => {
    for (const printer of [bridgePrinterFor(cloud({ role: 'viewer', shared: true }), undefined), bridgePrinterFor(lan(), { answered: false, endpointId: null })]) {
      expect(parseBridgePrinter(printer)).toEqual(printer)
    }
  })

  it('changes when anything the slicer is told of changes', () => {
    const a = bridgePrinterFor(cloud(), undefined)
    expect(samePrinter(a, bridgePrinterFor(cloud(), undefined))).toBe(true)
    expect(samePrinter(a, bridgePrinterFor({ ...cloud(), connected: false }, undefined))).toBe(false)
    expect(samePrinter(a, bridgePrinterFor(cloud({ role: 'viewer', shared: true }), undefined))).toBe(false)
    expect(samePrinter(a, null)).toBe(false)
    expect(samePrinter(null, null)).toBe(true)
  })
})

describe('the identity cache', () => {
  it('asks each address once, and reads the answer wrapped in result or not', async () => {
    const fetchJson = vi.fn(async (url: string) => url.includes('10') ? { result: { name: 'walnut', display: 'Walnut · 8987', endpoint_id: ID } } : { name: 'oak' })
    const cache = createIdentityCache(fetchJson)
    expect(cache.get('http://192.0.2.10')).toBeUndefined()
    const [a, b] = await Promise.all([cache.ask('http://192.0.2.10'), cache.ask('http://192.0.2.10')])
    expect(a).toEqual({ answered: true, endpointId: KEY, name: 'Walnut' })
    expect(b).toBe(a)
    expect(fetchJson).toHaveBeenCalledTimes(1)
    expect(fetchJson).toHaveBeenCalledWith('http://192.0.2.10/server/muon/identity')
    await expect(cache.ask('http://192.0.2.11/')).resolves.toEqual({ answered: true, endpointId: null, name: 'oak' })
  })

  it('takes a printer that does not answer as one with no identity', async () => {
    const cache = createIdentityCache(async () => { throw new Error('503') })
    await expect(cache.ask('http://192.0.2.10')).resolves.toEqual({ answered: false, endpointId: null, name: null })
    expect(cache.get('http://192.0.2.10')).toEqual({ answered: false, endpointId: null, name: null })
  })
})
