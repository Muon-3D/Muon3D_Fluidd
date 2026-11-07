import { describe, expect, it } from 'vitest'
import { accessCards } from '../sections'

describe('which access card Settings shows', () => {
  it('a Muon printer with muon_access gets People and access, not the old key card', () => {
    expect(accessCards(true, ['authorization', 'muon_access'])).toEqual({ peopleAccess: true, auth: false, loading: false })
  })

  it('a Muon printer on an older MuonOS (no muon_access) keeps the API key card', () => {
    expect(accessCards(true, ['authorization', 'muon_protection'])).toEqual({ peopleAccess: false, auth: true, loading: false })
  })

  it('a non-Muon printer keeps the old card', () => {
    expect(accessCards(false, ['authorization'])).toEqual({ peopleAccess: false, auth: true, loading: false })
    expect(accessCards(false, [])).toEqual({ peopleAccess: false, auth: false, loading: false })
  })

  it('shows neither card, only loading, while Muon-ness is unknown', () => {
    expect(accessCards(null, ['authorization', 'muon_access'])).toEqual({ peopleAccess: false, auth: false, loading: true })
  })
})
