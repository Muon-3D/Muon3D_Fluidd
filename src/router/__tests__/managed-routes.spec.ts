import { describe, expect, test } from 'vitest'
import router from '@/router'

describe('managed MuonOS routes', () => {
  test.each([
    ['/fleet', 'Fleet'],
    ['/onboarding', 'Onboarding'],
    ['/link-printer', 'Link printer']
  ])('%s resolves to the managed %s surface', (path, name) => {
    const route = router.resolve(path).route

    expect(route.name).toBe(name)
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.requiresPrinterSession).toBe(true)
  })
})
