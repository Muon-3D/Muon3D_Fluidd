import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NoticesBell from '../NoticesBell.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { resetNotices } from '@/services/muon-cloud/notices'

vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return {
    cloudState: Vue.observable({ account: { id: 'me', name: 'Me', email: 'me@example.test', created_at: 1 }, printers: [{ id: 'p1', name: 'Garage M1' }] }),
    printerName: (id: string) => (id === 'p1' ? 'Garage M1' : id.slice(0, 8))
  }
})

const settle = () => new Promise(resolve => setTimeout(resolve))
const ME = { id: 'me', name: 'Me', email: 'me@example.test', created_at: 1 }
function setAccount (a: typeof ME | null) { (cloudState as any).account = a }
const notice = (id: string, read_at: number | null, name = 'Ada') => ({
  id, kind: 'share', printer_id: 'p1', shared_by: name, sharer: { account_id: 'a1', display_name: name }, created_at: 100, read_at
})
let calls: Array<{ method: string, url: string }> = []
let list: any[] = []

function stubConsole () {
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: any) => {
    calls.push({ method: options.method, url: String(url) })
    if (options.method === 'POST' && String(url).includes('/read')) {
      const id = String(url).split('/').slice(-2)[0]
      const n = list.find(x => x.id === id)
      n.read_at = 200
      return new Response(JSON.stringify({ notice: n }), { status: 200 })
    }
    return new Response(JSON.stringify({ notices: list, unread: list.filter(n => n.read_at === null).length, next: null }), { status: 200 })
  }))
}

function open () {
  return shallowMount(NoticesBell, {
    stubs: {
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'frame-icon': true
    }
  })
}

describe('notices bell', () => {
  beforeEach(() => { resetNotices(); calls = []; list = []; vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }) })
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); setAccount(ME) })

  it('shows nothing when signed out and fetches nothing', async () => {
    setAccount(null)
    stubConsole()
    const w = open()
    await settle()
    expect(w.find('[data-tid="notices-bell"]').exists()).toBe(false)
    expect(calls).toHaveLength(0)
    w.destroy()
  })

  it('shows the unread count on the bell and lists the notices', async () => {
    list = [notice('n1', null), notice('n2', null, 'Grace'), notice('n3', 150)]
    stubConsole()
    const w = open()
    await settle()
    expect(w.find('[data-tid="notices-count"]').text()).toBe('2')
    expect(w.find('[data-tid="notices-bell"]').attributes('aria-label')).toBe('Notices, 2 unread')
    expect(w.findAll('[data-tid="notice"]')).toHaveLength(3)
    expect(w.text()).toContain('Ada shared Garage M1 with you')
    w.destroy()
  })

  it('marks a notice read when it is clicked and drops the count', async () => {
    list = [notice('n1', null)]
    stubConsole()
    const w = open()
    await settle()
    await w.find('[data-tid="notice"]').trigger('click')
    await settle()
    expect(calls.some(c => c.method === 'POST' && c.url.endsWith('/v1/me/notices/n1/read'))).toBe(true)
    expect(w.find('[data-tid="notices-count"]').exists()).toBe(false)
    w.destroy()
  })

  it('says No notices when there are none, and shows no badge', async () => {
    stubConsole()
    const w = open()
    await settle()
    expect(w.text()).toContain('No notices')
    expect(w.find('[data-tid="notices-count"]').exists()).toBe(false)
    w.destroy()
  })

  it('refetches on window focus and every five minutes, not more often', async () => {
    stubConsole()
    const w = open()
    await settle()
    const first = calls.length
    expect(first).toBe(1)
    vi.advanceTimersByTime(4 * 60 * 1000)
    expect(calls.length).toBe(first)
    vi.advanceTimersByTime(60 * 1000)
    await settle()
    expect(calls.length).toBe(first + 1)
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(calls.length).toBe(first + 2)
    w.destroy()
  })
})
