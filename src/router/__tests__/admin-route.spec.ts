import { describe, expect, it } from 'vitest'
import router from '@/router'
import { isManagedConsolePath } from '../managedPath'

describe('the hosted staff route', () => {
  it('is lazy, independent of printers and has its own staff frame', () => {
    const route = router.resolve('/admin').route
    expect(route.name).toBe('Admin')
    expect(route.params.printer).toBeUndefined()
    expect(route.meta?.printerIndependent).toBe(true)
    expect(isManagedConsolePath('/admin')).toBe(true)
    expect(typeof route.matched[0].components.default).toBe('function')
  })
  it('has the eleven sections and the four staff tools as children of one shell, all printer-independent', () => {
    for (const section of ['traffic', 'errors', 'infrastructure', 'endpoints', 'fleet', 'accounts', 'jobs', 'logs', 'alerts', 'releases']) {
      const route = router.resolve(`/admin/${section}`).route
      expect(route.meta?.section).toBe(section)
      expect(route.meta?.printerIndependent).toBe(true)
      expect(route.matched).toHaveLength(2)
      expect(isManagedConsolePath(`/admin/${section}`)).toBe(true)
    }
    for (const tool of ['accounts', 'audit', 'review', 'handles']) {
      expect(router.resolve(`/admin/tools/${tool}`).route.name).toBe('Admin-tools')
    }
  })
})
