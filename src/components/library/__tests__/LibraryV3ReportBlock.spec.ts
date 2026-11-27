import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryPrintPage from '../v2/LibraryPrintPage.vue'
import type { ShelfCard } from '@/services/library/shelves'
import { LibraryError } from '@/services/library/api'
import { setLibraryClient } from '@/services/library/store'

const card: ShelfCard = {
  key: 'pub:p1',
  kind: 'publication',
  id: 'p1',
  slug: 'pocket-robot',
  title: 'Pocket robot',
  picture: null,
  creator: 'Wren Atelier',
  handle: 'wren',
  makes: 0,
  remixes: 0,
  saves: 0,
  facts: '',
  m1: false,
  tags: [],
  remixOf: null,
  makeOf: null,
  createdAt: null,
  href: ''
}

const fetcher = () => vi.fn(async (url: string) => {
  if (url.includes('/makes') || url.includes('/remixes')) return new Response(JSON.stringify({ items: [], next_cursor: null }))
  return new Response(JSON.stringify({ id: 'p1', title: 'Pocket robot', version: 1, files: [], slug: 'pocket-robot', tags: [], licence: 'CC-BY-4.0', creator: { handle: 'wren', display_name: 'Wren Atelier' }, counts: {}, created_at: new Date().toISOString() }))
})

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
  vi.unstubAllGlobals()
})

type Api = { reportPrint: ReturnType<typeof vi.fn>, blockMaker: ReturnType<typeof vi.fn> }

async function page (props: Record<string, unknown> = { signedIn: true }, over: Partial<Api> = {}, owner = false, provide: Record<string, unknown> = {}) {
  const api: Api = { reportPrint: vi.fn(async () => ({ received: true })), blockMaker: vi.fn(async () => ({ ok: true })), ...over }
  setLibraryClient({
    ...api,
    modelContext: vi.fn(async () => ({ owner, state: 'live', pinned_version: 1, versions: [], runs: [] })),
    savesOf: vi.fn(async () => ({ saves: [] }))
  } as never)
  vi.stubGlobal('fetch', fetcher())
  const wrapper = mount(LibraryPrintPage, { provide, stubs: { 'frame-icon': true }, propsData: { card, printerName: 'Boxwood', printerFits: true, ...props }, mocks: { $store: { state: { printer: { printer: { save_variables: { variables: {} } } } } } } })
  wrappers.push(wrapper)
  await flush()
  return { w: wrapper, api }
}

type W = Awaited<ReturnType<typeof page>>['w']
const tid = (w: W, id: string) => w.find(`[data-tid="${id}"]`)

async function openReport (w: W) {
  await tid(w, 'library-print-report').trigger('click')
  await flush()
}

async function fill (w: W, reason: string, details = '') {
  await tid(w, 'library-report-reason').setValue(reason)
  await tid(w, 'library-report-email').setValue('me@example.com')
  if (details) await tid(w, 'library-report-details').setValue(details)
}

describe('Library v3 print page: report in the app', () => {
  it('Report opens a dialog in the app instead of linking out', async () => {
    const { w } = await page()
    expect(tid(w, 'library-report-dialog').exists()).toBe(false)
    expect(tid(w, 'library-print-report').attributes('href')).toBeUndefined()
    await openReport(w)
    expect(tid(w, 'library-report-dialog').exists()).toBe(true)
  })

  it('needs a reason before anything is sent', async () => {
    const { w, api } = await page()
    await openReport(w)
    await tid(w, 'library-report-form').trigger('submit')
    await flush()
    expect(api.reportPrint).not.toHaveBeenCalled()
    expect(tid(w, 'library-report-error').text()).toContain('Choose a reason')
  })

  it('sends the reason, email and details the way the Library web does', async () => {
    const { w, api } = await page()
    await openReport(w)
    await fill(w, 'licence', 'This is copied from a paid design.')
    await tid(w, 'library-report-form').trigger('submit')
    await flush()
    expect(api.reportPrint).toHaveBeenCalledTimes(1)
    const body = api.reportPrint.mock.calls[0][0]
    expect(body).toMatchObject({ target: 'p1', target_kind: 'share', sender: 'me@example.com', reason: 'licence', text: 'This is copied from a paid design.' })
    expect(body.command).toMatch(/^[0-9a-f]{32}$/)
  })

  it('details are optional: the service wants 8 characters, so the reason stands in', async () => {
    const { w, api } = await page()
    await openReport(w)
    await fill(w, 'weapon')
    await tid(w, 'library-report-form').trigger('submit')
    await flush()
    expect(api.reportPrint.mock.calls[0][0].text).toBe('Reported as: Weapons.')
  })

  it('confirms what happens next, and a copyright claim says it is passed on', async () => {
    const { w } = await page()
    await openReport(w)
    await fill(w, 'safety')
    expect(tid(w, 'library-report-copyright-note').exists()).toBe(false)
    await tid(w, 'library-report-reason').setValue('copyright')
    expect(tid(w, 'library-report-copyright-note').text()).toContain('passed on')
    await tid(w, 'library-report-form').trigger('submit')
    await flush()
    const done = tid(w, 'library-report-done').text()
    expect(done).toContain('reviewed')
    expect(done).toContain('not told who reported')
    expect(done).toContain('copyright')
    expect(done).toContain('outcome')
    expect(tid(w, 'library-report-form').exists()).toBe(false)
  })

  it('shows a rate limit in plain words and keeps what was typed', async () => {
    const reportPrint = vi.fn(async () => { throw new LibraryError('contact_limit', 'Try again tomorrow.', 429) })
    const { w } = await page({ signedIn: true }, { reportPrint })
    await openReport(w)
    await fill(w, 'illegal', 'Plainly illegal to print.')
    await tid(w, 'library-report-form').trigger('submit')
    await flush()
    expect(tid(w, 'library-report-error').text()).toContain('Too many reports')
    expect((tid(w, 'library-report-details').element as HTMLTextAreaElement).value).toBe('Plainly illegal to print.')
  })

  it('signed out, Report and Block ask to sign in and send nothing', async () => {
    const signIn = vi.fn()
    const { w, api } = await page({ signedIn: false }, {}, false, { libraryCardContext: () => ({ volume: null, signIn }) })
    await tid(w, 'library-print-report').trigger('click')
    await tid(w, 'library-print-block').trigger('click')
    await flush()
    expect(signIn).toHaveBeenCalledTimes(2)
    expect(tid(w, 'library-report-dialog').exists()).toBe(false)
    expect(tid(w, 'library-block-confirm').exists()).toBe(false)
    expect(api.reportPrint).not.toHaveBeenCalled()
    expect(api.blockMaker).not.toHaveBeenCalled()
  })

  it('your own print has neither Report nor Block', async () => {
    const { w } = await page({ signedIn: true }, {}, true)
    expect(tid(w, 'library-print-report').exists()).toBe(false)
    expect(tid(w, 'library-print-block').exists()).toBe(false)
  })
})

describe('Library v3 print page: block the maker', () => {
  it('asks first; Cancel sends nothing', async () => {
    const { w, api } = await page()
    await tid(w, 'library-print-block').trigger('click')
    expect(tid(w, 'library-block-confirm').text()).toContain('Wren Atelier')
    await tid(w, 'library-block-cancel').trigger('click')
    await flush()
    expect(api.blockMaker).not.toHaveBeenCalled()
    expect(tid(w, 'library-block-confirm').exists()).toBe(false)
  })

  it('Block sends once for the print, and says what changed', async () => {
    const { w, api } = await page()
    await tid(w, 'library-print-block').trigger('click')
    await tid(w, 'library-block-go').trigger('click')
    await tid(w, 'library-block-go').trigger('click')
    await flush()
    expect(api.blockMaker).toHaveBeenCalledTimes(1)
    expect(api.blockMaker).toHaveBeenCalledWith('p1')
    const done = tid(w, 'library-block-done').text()
    expect(done).toContain('will not see')
    expect(done).toContain('remix')
  })

  it('says it plainly when you cannot block yourself', async () => {
    const blockMaker = vi.fn(async () => { throw new LibraryError('block_invalid', 'Name another account.', 400) })
    const { w } = await page({ signedIn: true }, { blockMaker })
    await tid(w, 'library-print-block').trigger('click')
    await tid(w, 'library-block-go').trigger('click')
    await flush()
    expect(tid(w, 'library-block-error').text()).toContain('cannot block yourself')
  })
})
