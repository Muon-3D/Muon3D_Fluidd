import { describe, expect, it } from 'vitest'
import { searchRows, type SearchSources } from '../searchRows'
import type { CloudPrinter } from '../api'
import type { LanPrinter } from '../discovery'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'

const WALNUT = '3fa9c0de'.repeat(8)
const BOXWOOD = '9b1e44a0'.repeat(8)

function heard (fields: Partial<NearbyPrinter> = {}): NearbyPrinter {
  return {
    deviceId: 'dev-walnut',
    device: {} as NearbyPrinter['device'],
    localName: 'walnut-8987',
    display: 'Walnut · 8987',
    endpointId: WALNUT,
    advert: null,
    heardAt: 1,
    ...fields
  }
}

function lan (name: string, host = '192.168.1.37'): LanPrinter {
  return { host, apiUrl: `http://${host}`, name, link: { phase: 'unlinked' } }
}

function owned (id: string, name: string, online: boolean): CloudPrinter {
  return { id, name, model: 'M1', version: '1', linked_at: 0, last_seen: 0, online, online_since: null }
}

function rows (sources: Partial<SearchSources>) {
  return searchRows({ found: [], cloud: [], nearby: [], account: [], email: null, ...sources })
}

describe('one list: this network and nearby', () => {
  it('lists a new printer heard nearby, with Set up', () => {
    const [row] = rows({ nearby: [heard({ advert: { unclaimed: true, busy: false, endpointPrefix: WALNUT.slice(0, 16) } })] })
    expect(row).toMatchObject({ name: 'Walnut · 8987', meta: 'New · nearby', host: null, action: 'set-up', canLink: false })
  })

  it('lists a printer heard without an advertisement as nearby, and tries it as new', () => {
    const [row] = rows({ nearby: [heard()] })
    expect(row).toMatchObject({ meta: 'nearby', action: 'set-up' })
  })

  it('says when another device holds the printer', () => {
    const [row] = rows({ nearby: [heard({ advert: { unclaimed: true, busy: true, endpointPrefix: WALNUT.slice(0, 16) } })] })
    expect(row.meta).toBe('New · nearby · busy with another device')
  })

  it('explains a set-up printer that is only nearby, rather than opening it', () => {
    const [row] = rows({ nearby: [heard({ advert: { unclaimed: false, busy: false, endpointPrefix: WALNUT.slice(0, 16) } })] })
    expect(row).toMatchObject({ meta: 'Set up · nearby', action: 'nearby-info' })
  })

  it('lists a printer on this network and nearby once, by name', () => {
    const list = rows({ found: [lan('Walnut · 8987')], nearby: [heard()] })
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ host: '192.168.1.37', action: 'open', meta: '192.168.1.37 · not linked · show its code · nearby' })
    expect(list[0].nearby?.deviceId).toBe('dev-walnut')
  })

  it('lists a printer the service sees and this page hears once, by EndpointId, even under another name', () => {
    const list = rows({
      cloud: [{ printerId: WALNUT, name: 'Workshop', model: 'M1', linked: false, localAddrs: ['192.168.1.37'] }],
      nearby: [heard()]
    })
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ name: 'Workshop', cloudId: WALNUT, action: 'open' })
    expect(list[0].meta).toMatch(/ · nearby$/)
  })

  it('matches by the advertised prefix when the whole EndpointId is not known yet', () => {
    const list = rows({
      cloud: [{ printerId: WALNUT, name: 'Workshop', model: 'M1', linked: false, localAddrs: ['192.168.1.37'] }],
      nearby: [heard({ endpointId: null, localName: 'x', advert: { unclaimed: false, busy: false, endpointPrefix: WALNUT.slice(0, 16) } })]
    })
    expect(list).toHaveLength(1)
  })

  it('does not merge different printers', () => {
    const list = rows({ found: [lan('Boxwood · 367a')], nearby: [heard()] })
    expect(list.map(r => r.name)).toEqual(['Boxwood · 367a', 'Walnut · 8987'])
  })
})

describe('a printer on the account, heard nearby', () => {
  it('opens through the relay while it is online, keeping its one Bluetooth slot free', () => {
    const [row] = rows({ nearby: [heard()], account: [owned(WALNUT, 'Walnut', true)] })
    expect(row).toMatchObject({ name: 'Walnut', meta: 'In your account · nearby', action: 'open-cloud', cloudId: WALNUT })
  })

  it('opens over Bluetooth when it has no Wi-Fi', () => {
    const [row] = rows({ nearby: [heard()], account: [owned(WALNUT, 'Walnut', false)] })
    expect(row.action).toBe('open-bluetooth')
  })

  it('opens over Bluetooth when the service sees it but this page has no address for it', () => {
    const [row] = rows({
      cloud: [{ printerId: WALNUT, name: 'Walnut', model: 'M1', linked: true, localAddrs: [] }],
      nearby: [heard()],
      account: [owned(WALNUT, 'Walnut', true)]
    })
    expect(row).toMatchObject({ host: null, action: 'open-bluetooth' })
  })

  it('leaves another account’s printer to its owner', () => {
    const [row] = rows({
      cloud: [{ printerId: BOXWOOD, name: 'Boxwood', model: 'M1', linked: true, localAddrs: [] }],
      nearby: [heard({ endpointId: BOXWOOD, localName: 'boxwood-367a', display: 'Boxwood · 367a' })]
    })
    expect(row).toMatchObject({ action: 'open', host: null })
  })
})

describe('without Bluetooth', () => {
  it('lists the network as before', () => {
    const list = rows({
      found: [lan('Walnut · 8987')],
      cloud: [
        { printerId: WALNUT, name: 'Walnut · 8987', model: 'M1', linked: true, localAddrs: ['10.42.0.1', '192.168.1.37'] },
        { printerId: BOXWOOD, name: 'Boxwood', model: 'M1', linked: false, localAddrs: ['10.42.0.1', '192.168.1.40'] }
      ],
      account: [owned(WALNUT, 'Walnut', true)]
    })
    expect(list.map(r => [r.key, r.host, r.meta, r.action])).toEqual([
      [WALNUT, '192.168.1.37', '192.168.1.37 · in your account', 'open'],
      [BOXWOOD, '192.168.1.40', '192.168.1.40 · not linked to an account', 'open']
    ])
  })
})
