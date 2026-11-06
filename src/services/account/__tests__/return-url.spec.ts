import { describe, expect, it } from 'vitest'
import { libraryReturnUrl } from '../model'

describe('Library account return URL', () => {
  it.each([
    'http://library.muon3d.com/account',
    'https://evil.example/account',
    'https://library.muon3d.com@evil.example/account',
    '//library.muon3d.com/account',
    'https://library.muon3d.com:444/account'
  ])('rejects %s', value => expect(libraryReturnUrl(value)).toBeNull())

  it.each([
    '//evil.com',
    '//evil.com/library',
    '/\\evil.com',
    '/library\\..\\x',
    '/\t/evil.com',
    '/\n/evil.com',
    '/ /evil.com',
    'javascript:alert(1)',
    'data:text/html,hi',
    'library?x',
    '\\/evil.com'
  ])('rejects the same-origin look-alike %j', value => expect(libraryReturnUrl(value)).toBeNull())

  it('accepts a path on this site starting with exactly one "/"', () => {
    expect(libraryReturnUrl('/library?x')).toBe('/library?x')
    expect(libraryReturnUrl('/library?view=discover&creator=jack')).toBe('/library?view=discover&creator=jack')
    expect(libraryReturnUrl('/')).toBe('/')
  })

  it('accepts production and staging Library URLs', () => {
    expect(libraryReturnUrl('https://library.muon3d.com/library?view=discover')).toBe('https://library.muon3d.com/library?view=discover')
    expect(libraryReturnUrl('https://library.muon3d.com/library?q=1')).toBe('https://library.muon3d.com/library?q=1')
    expect(libraryReturnUrl('https://staging.library.muon3d.com/')).toBe('https://staging.library.muon3d.com/')
  })
})
