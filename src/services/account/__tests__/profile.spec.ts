import { describe, expect, it } from 'vitest'
import {
  ageText, cleanHandle, handleChangeableAt, handleProblem, handleStatusText, libraryUpdating, makerSince,
  missingForPublic, pageAddress, pageUrl, photoProblem, underReview, PROJECTION_WINDOW_MS
} from '../profile'
import type { CommunityIdentity, CommunityProfile } from '../community'

const identity = (over: Partial<CommunityIdentity> = {}): CommunityIdentity => ({
  declared_age: 30, declared_at: 1, can_community: true, can_public: true, identity_public: true, revision: 1, projection_pending: false, ...over
})
const profile = (over: Partial<CommunityProfile> = {}): CommunityProfile => ({
  handle: 'jack', public_name: 'Jack', identity_public: true, can_community: true, can_public: true, page_on: true, bio: null, ...over
})

describe('usernames', () => {
  it('drops a leading @ and spaces', () => expect(cleanHandle('  @Jack ')).toBe('Jack'))
  it.each([
    ['', 'Enter a username.'],
    ['ab', 'Use 3–24 letters, digits, dots or underscores.'],
    ['a'.repeat(25), 'Use 3–24 letters, digits, dots or underscores.'],
    ['no spaces', 'Use 3–24 letters, digits, dots or underscores.'],
    ['muon3d', 'That username is reserved.'],
    ['@Muon3D', 'That username is reserved.']
  ])('refuses %j', (raw, reason) => expect(handleProblem(raw)).toBe(reason))
  it.each(['jack', 'jack.smith', 'jack_smith', 'a1b', 'x'.repeat(24)])('accepts %j', raw => expect(handleProblem(raw)).toBeNull())
  it('says what the service answered', () => {
    expect(handleStatusText('available')).toBeNull()
    expect(handleStatusText('taken')).toBe('That username is taken.')
    expect(handleStatusText('reserved')).toBe('That username is reserved.')
    expect(handleStatusText('held')).toContain('held')
  })
  it('links by handle', () => {
    expect(pageAddress('jack')).toBe('library.muon3d.com/@jack')
    expect(pageUrl('jack.smith')).toBe('https://library.muon3d.com/@jack.smith')
  })
})

describe('the 30-day limit', () => {
  const now = Date.parse('2026-11-06T12:00:00Z')
  it('is free when never changed', () => expect(handleChangeableAt(null, now)).toBeNull())
  it('is free after 30 days', () => expect(handleChangeableAt('2026-10-01T12:00:00Z', now)).toBeNull())
  it('gives the day it opens again', () => {
    expect(handleChangeableAt('2026-11-01T12:00:00Z', now)).toBe(Date.parse('2026-12-01T12:00:00Z'))
  })
  it('ignores a date it cannot read', () => expect(handleChangeableAt('soon', now)).toBeNull())
})

describe('what stops a page going public', () => {
  it('nothing, when all five are there', () => expect(missingForPublic(identity(), profile())).toBeNull())
  it('says nothing before the Library has been read', () => expect(missingForPublic(null, null)).toBeNull())
  it('asks for the age first', () => expect(missingForPublic(identity({ declared_age: null, can_community: false, can_public: false }), null)).toMatch(/age/))
  it('says public pages are for adults', () => expect(missingForPublic(identity({ declared_age: 15, can_public: false }), profile())).toMatch(/18/))
  it('asks for a username', () => expect(missingForPublic(identity(), profile({ handle: null }))).toMatch(/username/))
  it('asks to choose Public', () => expect(missingForPublic(identity({ identity_public: false }), profile())).toMatch(/Public/))
  it('says the page is off, without turning it on', () => expect(missingForPublic(identity(), profile({ page_on: false }))).toMatch(/switched off/))
})

describe('the Library catching up', () => {
  const since = 1_000_000
  it('is not updating when nothing was changed', () => expect(libraryUpdating(null, profile(), since)).toBe(false))
  it('is updating while the Library has the old name', () => {
    expect(libraryUpdating({ name: 'Jack Smith', since }, profile({ public_name: 'Jack' }), since + 1000)).toBe(true)
  })
  it('stops when the Library reports the new name', () => {
    expect(libraryUpdating({ name: 'Jack Smith', since }, profile({ public_name: 'Jack Smith' }), since + 1000)).toBe(false)
  })
  it('is updating while privacy differs, and stops when it matches', () => {
    expect(libraryUpdating({ identityPublic: true, since }, profile({ identity_public: false }), since + 1000)).toBe(true)
    expect(libraryUpdating({ identityPublic: true, since }, profile({ identity_public: true }), since + 1000)).toBe(false)
  })
  it('gives up after 2 minutes', () => {
    expect(libraryUpdating({ name: 'New', since }, profile(), since + PROJECTION_WINDOW_MS - 1)).toBe(true)
    expect(libraryUpdating({ name: 'New', since }, profile(), since + PROJECTION_WINDOW_MS)).toBe(false)
  })
})

describe('small words', () => {
  it('reads review state from the service', () => {
    expect(underReview(null)).toEqual({ name: false, photo: false })
    expect(underReview(profile({ review: { photo: true } }))).toEqual({ name: false, photo: true })
  })
  it('never says the age itself', () => {
    expect(ageText(30)).toBe('Over 18')
    expect(ageText(15)).toBe('Under 18')
    expect(ageText(null)).toBeNull()
  })
  it('says the month somebody became a maker', () => expect(makerSince(Date.parse('2026-10-14T12:00:00Z') / 1000)).toBe('Oct 2026'))
  it('refuses a photo the service would', () => {
    expect(photoProblem({ type: 'image/gif', size: 10 })).toMatch(/JPEG, PNG or WebP/)
    expect(photoProblem({ type: 'image/png', size: 5 * 1024 * 1024 })).toMatch(/4 MB/)
    expect(photoProblem({ type: 'image/webp', size: 1000 })).toBeNull()
  })
})
