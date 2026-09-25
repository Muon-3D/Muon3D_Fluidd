import { describe, expect, it } from 'vitest'
import { isManagedConsolePath } from '../managedPath'

describe('managed console route classification', () => {
  it.each(['/', '/fleet', '/link', '/console', '/jobs', '/login', '/welcome', '/wifi'])('keeps the Fluidd shell on %s', (path) => {
    expect(isManagedConsolePath(path)).toBe(false)
  })

  it('shows first-run setup without the Fluidd shell', () => {
    expect(isManagedConsolePath('/setup')).toBe(true)
  })
})
