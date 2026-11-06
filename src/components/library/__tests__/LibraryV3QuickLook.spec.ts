import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryQuickLook from '../v2/LibraryQuickLook.vue'
import { colourList, type ShelfCard } from '@/services/library/shelves'

const card = (over: Partial<ShelfCard> = {}): ShelfCard => ({
  key: 'pub:p1',
  kind: 'publication',
  id: 'p1',
  slug: 'spiral-vase',
  title: 'Spiral vase',
  picture: null,
  creator: 'Okoro',
  handle: 'okoro',
  makes: 3,
  remixes: 0,
  saves: 0,
  facts: '',
  m1: true,
  tags: [],
  remixOf: null,
  makeOf: null,
  createdAt: null,
  href: 'https://library.muon3d.com/p/spiral-vase',
  colours: ['#4fb3ad', '#e0675b'],
  ...over
})

/** The open printer's save_variables, as the panel, Overview and Control set them. */
const store = (variables: Record<string, unknown>) => ({ state: { printer: { printer: { save_variables: { variables } } } } })

let wrapper: ReturnType<typeof mount> | null = null
afterEach(() => {
  wrapper?.destroy()
  wrapper = null
  vi.unstubAllGlobals()
})

function look (props: Record<string, unknown>, variables: Record<string, unknown> = {}) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ title: 'Spiral vase', version: 1, files: [] }), { status: 200 })))
  wrapper = mount(LibraryQuickLook, { stubs: { 'frame-icon': true }, propsData: { card: card(), ...props }, mocks: { $store: store(variables) }, attachTo: document.body })
  return wrapper
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('Library v3 quick look: colours and what is loaded', () => {
  it('rings the colour the open printer has loaded, and says what it has', async () => {
    look({ printerName: 'Boxwood' }, { muon_material: 'PLA', muon_material_colour: '4FB3AD' })
    await flush()
    const dots = document.querySelectorAll('.mlook__dot')
    expect(dots).toHaveLength(2)
    expect(dots[0].classList.contains('mlook__dot--on')).toBe(true)
    expect(dots[1].classList.contains('mlook__dot--on')).toBe(false)
    expect(dots[0].getAttribute('aria-label')).toMatch(/loaded$/)
    expect(document.querySelector('[data-tid="library-quick-look-loaded"]')?.textContent).toMatch(/^Boxwood has .*PLA loaded$/)
  })

  it('says nothing about loaded filament with no printer open, or when nothing is known', async () => {
    look({ printerName: null }, { muon_material: 'PLA' })
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-loaded"]')).toBeNull()
    wrapper?.destroy()
    look({ printerName: 'Boxwood' }, {})
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-loaded"]')).toBeNull()
  })

  it('shows Fits <printer> only for an M1 print with a printer open', async () => {
    look({ printerName: 'Boxwood', card: card({ m1: false }) })
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-fits"]')).toBeNull()
  })
})

describe('Library v3: colour lists from the service', () => {
  it('keeps only #rrggbb, lowercase, at most eight', () => {
    expect(colourList(['#4FB3AD', 'teal', 'url(x)', '#12345', ...Array(10).fill('#000000')])).toEqual(['#4fb3ad', ...Array(7).fill('#000000')])
    expect(colourList(null)).toEqual([])
  })
})
