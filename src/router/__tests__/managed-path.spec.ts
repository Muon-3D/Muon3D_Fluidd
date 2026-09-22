import { describe, expect, it } from 'vitest'
import { isManagedConsolePath } from '../managedPath'

describe('managed console route classification', () => {
  it.each([
    '/managed/sign-in',
    '/onboarding',
    '/fleet',
    '/link-printer'
  ])('allows %s to render without a local Moonraker connection', (path) => {
    expect(isManagedConsolePath(path)).toBe(true)
  })

  it.each(['/', '/console', '/jobs', '/login'])('keeps %s on the local Fluidd connection path', (path) => {
    expect(isManagedConsolePath(path)).toBe(false)
  })
})
