import { describe, expect, it } from 'vitest'
import { hashEntryFor } from '../pathEntry'

const at = (pathname: string, search = '', hash = '') => ({ pathname, search, hash })

describe('an address that arrives as a path', () => {
  it.each([
    [at('/link', '?code=482913'), '/#/link?code=482913'],
    [at('/link/', '?code=482913'), '/#/link?code=482913'],
    [at('/link', '?code=482913', '#'), '/#/link?code=482913'],
    [at('/link', '?code=482913', '#/'), '/#/link?code=482913'],
    [at('/link'), '/#/link'],
    [at('/fluidd/link', '?code=482913'), '/fluidd/#/link?code=482913']
  ])('%o opens the hash route %s with the same query', (location, expected) => {
    expect(hashEntryFor(location)).toBe(expected)
  })

  it.each([
    // The old QR address: printers in the field and codes already shown.
    at('/', '', '#/link?code=482913'),
    // A hash route wins over the path it was served at.
    at('/link', '?code=482913', '#/fleet'),
    at('/', '?code=482913'),
    at('/unlink', '?code=482913'),
    at('/link/printer', '?code=482913'),
    at('/linked', '?code=482913'),
    at('/index.html')
  ])('%o is left alone', (location) => {
    expect(hashEntryFor(location)).toBeNull()
  })
})
