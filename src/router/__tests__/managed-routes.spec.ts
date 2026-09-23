import { describe, expect, test } from 'vitest'
import router from '@/router'

describe('Muon3D account routes', () => {
  test.each([
    ['/fleet', 'Fleet'],
    ['/link', 'Link a printer']
  ])('%s resolves to %s and renders without a printer connection', (path, name) => {
    const route = router.resolve(path).route

    expect(route.name).toBe(name)
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
  })

  test.each(['/managed/sign-in', '/onboarding', '/link-printer'])('the retired placeholder %s is gone', (path) => {
    expect(router.resolve(path).route.name).not.toBe('Managed sign in')
    expect(router.resolve(path).route.matched.every(m => m.meta.printerIndependent !== true)).toBe(true)
  })
})
