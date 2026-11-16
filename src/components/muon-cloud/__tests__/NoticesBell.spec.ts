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

describe('notices bell on a printer', () => {
  const announcement = { id: 'arksine/moonlight/issue/7', type: 'announcement', title: 'Moonraker: test entry', description: 'Mocked', timestamp: 1, clear: true }
  let dispatched: Array<[string, unknown]> = []

  function onPrinter (values: Record<string, unknown>) {
    const getters: Record<string, unknown> = {
      'notifications/getNotifications': [],
      'printer/getPrinterWarnings': [],
      'printer/getKlipperWarnings': [],
      'printer/getMoonrakerFailedComponents': [],
      'printer/getMoonrakerWarnings': [],
      'printer/getKlippyReady': true,
      ...values
    }
    return shallowMount(NoticesBell, {
      propsData: { printer: true },
      mocks: {
        $store: {
          getters: new Proxy(getters, { get: (t, k: string) => t[k] }),
          state: {},
          dispatch: (type: string, payload: unknown) => { dispatched.push([type, payload]) }
        },
        $tc: (key: string, _n: unknown, v?: { appName?: string }) => `${key}${v?.appName ? ` ${v.appName}` : ''}`,
        $t: (key: string) => key,
        $filters: { formatRelativeTimeToNow: () => 'just now' }
      },
      stubs: {
        'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
        'frame-icon': true
      }
    })
  }

  beforeEach(() => { resetNotices(); calls = []; dispatched = []; setAccount(null); stubConsole() })
  afterEach(() => { vi.unstubAllGlobals(); setAccount(ME) })

  it('shows the bell signed out, with an announcement and a Klipper warning counted and listed', async () => {
    const w = onPrinter({
      'notifications/getNotifications': [announcement],
      'printer/getKlipperWarnings': [{ message: 'Option test_option is deprecated.' }]
    })
    await settle()
    expect(w.find('[data-tid="notices-bell"]').attributes('aria-label')).toBe('Notices, 2 unread')
    expect(w.find('[data-tid="notices"]').text()).toContain('Moonraker: test entry')
    expect(w.find('[data-tid="notice-warnings"]').text()).toContain('Option test_option is deprecated.')
    expect(calls).toHaveLength(0)
    w.destroy()
  })

  it('counts Klipper not being ready and shows it first', async () => {
    const w = onPrinter({ 'printer/getKlippyReady': false })
    await settle()
    expect(w.find('[data-tid="notice-klippy"]').exists()).toBe(true)
    expect(w.find('[data-tid="notices-bell"]').attributes('aria-label')).toBe('Notices, 1 unread')
    w.destroy()
  })

  it('snoozes an announcement through Moonraker and clears the rest from the store', async () => {
    const w = onPrinter({ 'notifications/getNotifications': [announcement] })
    await settle()
    await w.find('[data-tid="notice-snooze-3600"]').trigger('click')
    await w.find('[data-tid="notices-clear-all"]').trigger('click')
    expect(dispatched).toContainEqual(['announcements/dismiss', { entry_id: announcement.id, wake_time: 3600 }])
    expect(dispatched).toContainEqual(['notifications/clearAll', undefined])
    w.destroy()
  })
})
