import { describe, expect, it, test } from 'vitest'
import router from '@/router'
import { routeAfterInit } from '../afterInit'
import { isDeniedNavigation } from '@/swNavigation'
import { SECTIONS, sectionOf, visibleSections, type SectionContext } from '../printerSections'

describe('/design', () => {
  it.each([
    ['/boxwood-367a/design', 'Design'],
    ['/design', 'Design (no printer)']
  ])('%s is the lazy Design page, printer-independent, mode-free and kept across a printer switch', (path, name) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    expect(route.matched[0].meta.keepOnPrinterSwitch).toBe(true)
    expect(route.matched[0].meta.noMode).toBe(true)
    expect(route.matched[0].meta.fileDropRoot).toBeUndefined()
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it('is drawn as the printer\'s page, behind the printer\'s sign-in like Slice', () => {
    const design = router.resolve('/boxwood-367a/design').route.matched[0]
    const slice = router.resolve('/boxwood-367a/slice').route.matched[0]
    expect(design.meta.frame).toBe('printer')
    expect(design.beforeEnter).toBe(slice.beforeEnter)
  })

  test.each([
    ['/design', null],
    ['/boxwood-367a/design', '/walnut-8987/design']
  ])('after a printer switch, from %s: %s', (path, to) => {
    const walnut = { slug: 'walnut-8987', isActive: (slug: string) => slug === 'walnut-8987' }
    expect(routeAfterInit(router.resolve(path).route, walnut)).toBe(to)
  })

  test.each(['/design/', '/design/embed.html', '/design/assets/index.js'])('the service worker leaves %s to the network', (path) => {
    expect(isDeniedNavigation(path)).toBe(true)
  })

  test.each(['/design', '/design?x=1', '/boxwood-367a/design', '/designs'])('the service worker answers %s with Fluidd', (path) => {
    expect(isDeniedNavigation(path)).toBe(false)
  })
})

describe('the Design section', () => {
  const base: SectionContext = { slicer: true, camera: null, history: true, timelapse: false, diagnostics: true, foreign: false }

  it('sits beside Slice, with G D, only when Design is there', () => {
    const ids = (c: SectionContext) => visibleSections(c).map(s => s.id)
    expect(ids({ ...base, design: true })).toEqual(['overview', 'jobs', 'control', 'slice', 'design', 'maintenance', 'settings', 'console', 'files'])
    expect(ids(base)).not.toContain('design')
    expect(ids({ ...base, design: false })).not.toContain('design')
    expect(SECTIONS.find(s => s.id === 'design')?.key).toBe('d')
    expect(sectionOf('/design')?.id).toBe('design')
  })

  it('is not one of a foreign printer\'s sections', () => {
    expect(visibleSections({ ...base, design: true, foreign: true }).map(s => s.id)).not.toContain('design')
  })
})
