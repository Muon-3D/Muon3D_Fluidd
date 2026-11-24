import { afterEach, describe, expect, it, vi } from 'vitest'
import { yearSpoolEnabled } from '..'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the year and spool flag', () => {
  it('is off by default', () => {
    expect(yearSpoolEnabled()).toBe(false)
  })

  it.each(['', 'false', '1', 'yes', 'TRUE', ' true'])('is off for %j: only "true" turns it on', (value) => {
    vi.stubEnv('VITE_CONTROL_YEAR_SPOOL', value)
    expect(yearSpoolEnabled()).toBe(false)
  })

  it('is on for "true", from the build', () => {
    vi.stubEnv('VITE_CONTROL_YEAR_SPOOL', 'true')
    expect(yearSpoolEnabled()).toBe(true)
  })
})
