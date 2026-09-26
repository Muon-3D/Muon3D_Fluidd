import { describe, expect, it } from 'vitest'
import { pageLanguageFor } from '../language'
import type { SetupState } from '../types'
import newState from './fixtures/state.01-new.json'
import networkPhone from './fixtures/state.02-network-phone-driver.json'

const OFFERED = ['en', 'de', 'fr', 'es', 'it']

describe('pageLanguageFor (05 §9)', () => {
  const pending = newState as unknown as SetupState
  const done = networkPhone as unknown as SetupState

  it("speaks the owner's choice once the language step is done", () => {
    expect(done.steps.language).toMatchObject({ status: 'done', value: 'en' })
    expect(pageLanguageFor(done, OFFERED, ['de-DE'], 'fr')).toBe('en')
  })

  it("otherwise takes the browser's first offered language, matching on the primary tag", () => {
    expect(pageLanguageFor(pending, OFFERED, ['nl-NL', 'de-AT', 'en'], null)).toBe('de')
  })

  it('falls back to English when nothing offered matches, or before the printer answers', () => {
    expect(pageLanguageFor(pending, OFFERED, ['nl-NL', 'pl'], null)).toBe('en')
    expect(pageLanguageFor(null, [], ['de-DE'], null)).toBe('en')
  })

  it('follows the header switcher while the step is pending', () => {
    expect(pageLanguageFor(pending, OFFERED, ['de-DE'], 'it')).toBe('it')
    expect(pageLanguageFor(pending, OFFERED, ['de-DE'], 'xx')).toBe('de')
  })
})
