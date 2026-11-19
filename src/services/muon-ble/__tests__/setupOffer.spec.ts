import { describe, expect, it } from 'vitest'
import { afterSetupRefusal, setupOfferFor } from '../setupOffer'

const advert = (unclaimed: boolean) => ({ advert: { unclaimed } as any })

describe('setupOfferFor (KAN-4828)', () => {
  it('connects first when no advertisement was heard, as for a Chrome chooser pick', () => {
    expect(setupOfferFor({ advert: null })).toBe('connect')
  })
  it('sets up only a printer whose advertisement says unclaimed', () => {
    expect(setupOfferFor(advert(true))).toBe('set-up')
  })
  it('pairs a printer whose advertisement says it is set up', () => {
    expect(setupOfferFor(advert(false))).toBe('pair')
  })
})

describe('afterSetupRefusal', () => {
  it('pairs a chooser pick that turns out to be set up', () => {
    expect(afterSetupRefusal({ advert: null, endpointId: 'e1' }, 'set-up')).toBe('pair')
  })
  it('keeps the page for an advertised printer, an unknown id, or another failure', () => {
    expect(afterSetupRefusal({ ...advert(false), endpointId: 'e1' }, 'set-up')).toBe('show')
    expect(afterSetupRefusal({ advert: null, endpointId: null }, 'set-up')).toBe('show')
    expect(afterSetupRefusal({ advert: null, endpointId: 'e1' }, 'busy')).toBe('show')
  })
})
