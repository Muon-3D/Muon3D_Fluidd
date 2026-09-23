import { describe, expect, it } from 'vitest'
import { isManagedConsolePath } from '../managedPath'

describe('managed console route classification', () => {
  it.each(['/', '/fleet', '/link', '/console', '/jobs', '/login'])('keeps the Fluidd shell on %s', (path) => {
    expect(isManagedConsolePath(path)).toBe(false)
  })
})
