import { describe, expect, it } from 'vitest'
import router from '@/router'
import { isPrinterSlug, slugForCloudPrinter } from '../slug'

const ID = 'f1f6920f757634a1b2c3d4e5f60718293a4b5c6d7e8f9012345678901234ad65'

describe('an account printer slug (KAN-1279)', () => {
  it('is the printer name: "Boxwood · 367A" is boxwood-367a', () => {
    const slug = slugForCloudPrinter({ id: ID, name: 'Boxwood · 367A' })
    expect(slug).toBe('boxwood-367a')
    expect(isPrinterSlug(slug)).toBe(true)
  })

  it('resolves to a printer page, not the not-found page', () => {
    const slug = slugForCloudPrinter({ id: ID, name: 'Boxwood · 367A' })
    const route = router.resolve(`/${slug}`).route
    expect(route.params.printer).toBe(slug)
    expect(route.name).not.toBe('404')
    expect(route.matched.length).toBeGreaterThan(0)
  })

  it('a name with no 4-character tail still gets a slug the router accepts', () => {
    for (const name of ['Workshop', 'Walnut', '', '···']) {
      const slug = slugForCloudPrinter({ id: ID, name })
      expect(isPrinterSlug(slug)).toBe(true)
      expect(router.resolve(`/${slug}`).route.params.printer).toBe(slug)
    }
  })

  it('differs for two printers with the same name', () => {
    const a = slugForCloudPrinter({ id: ID, name: 'Walnut' })
    const b = slugForCloudPrinter({ id: 'aaaa' + ID.slice(4), name: 'Walnut' })
    expect(a).not.toBe(b)
  })
})
