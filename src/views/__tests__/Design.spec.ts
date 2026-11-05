import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Design from '../Design.vue'
import { CROSS_ORIGIN_SANDBOX } from '@/services/slicer-bridge/slicerUrl'
import { resetDesignProbe } from '@/services/design-bridge/designUrl'
import { resetLibrary } from '@/services/library/store'

const EMBED_HTML = '<!doctype html><html><head><meta name="muon3d-embed-hosts" content="\'self\'" /><title>Muon3D Design</title></head></html>'
const FLUIDD_HTML = '<!doctype html><html><head><title>Fluidd</title></head><body><div id="app"></div></body></html>'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

/** What this origin answers for /design/embed.html. */
function serve (status: number, body: string) {
  const fetch = vi.fn<[string, RequestInit?], Promise<Response>>(async () => new Response(body, { status, headers: { 'Content-Type': 'text/html' } }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountDesign (options: Record<string, unknown> = {}) {
  const push = vi.fn(() => Promise.resolve())
  const wrapper = shallowMount(Design, {
    mocks: {
      $vuetify: { theme: { dark: true }, breakpoint: { mobile: false } },
      $router: { push },
      $t: (key: string) => key
    },
    stubs: { 'v-alert': { template: '<div class="v-alert-stub"><slot /></div>' } },
    ...options,
    computed: { theme: () => 'dark', density: () => 'compact', ...(options.computed as object | undefined) }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, push }
}

const hello = (frame: HTMLIFrameElement, features: string[]) => window.dispatchEvent(new MessageEvent('message', {
  source: frame.contentWindow,
  origin: window.location.origin,
  data: { protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'muon3d-design', appVersion: '0.1.0', nonce: '0'.repeat(32), features }
}))

describe('Design', () => {
  beforeEach(() => resetDesignProbe())
  afterEach(() => {
    vi.unstubAllGlobals()
    resetDesignProbe()
  })

  it('says Design is not installed here when this origin has no Design, and frames nothing', async () => {
    const fetch = serve(200, FLUIDD_HTML)
    const { wrapper } = await mountDesign()
    expect(fetch).toHaveBeenCalledWith(new URL('/design/embed.html', window.location.href).href, expect.anything())
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('[data-tid="design-absent"]').text()).toBe('app.design.msg.no_design')
    expect(wrapper.find('[data-tid="design-opening"]').exists()).toBe(false)
    expect((wrapper.vm as any).host).toBeNull()
    wrapper.destroy()
  })

  it('frames Design\'s embed.html once it answers and its host listens, with no sandbox on this origin', async () => {
    serve(200, EMBED_HTML)
    const { wrapper } = await mountDesign()
    const frame = wrapper.find('iframe')
    expect(frame.exists()).toBe(true)
    expect(frame.attributes('title')).toBe('Muon3D Design')
    expect(frame.attributes('sandbox')).toBeUndefined()
    expect((frame.element as HTMLIFrameElement).src).toBe(new URL('/design/embed.html', window.location.href).href)
    expect(wrapper.find('[data-tid="design-opening"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('sandboxes Design on another origin', async () => {
    serve(404, '')
    const { wrapper } = await mountDesign({ computed: { url: () => new URL('https://design.example/embed.html') } })
    expect(wrapper.find('iframe').attributes('sandbox')).toBe(CROSS_ORIGIN_SANDBOX)
    wrapper.destroy()
  })

  it('grants Design the look and the account\'s Library, no printer, and tells it when the Library changes', async () => {
    serve(200, EMBED_HTML)
    const { wrapper, push } = await mountDesign({ attachTo: document.body })
    const vm = wrapper.vm as any
    const frame = wrapper.find('iframe').element as HTMLIFrameElement
    const welcomes: Array<{ capabilities: string[], look?: unknown }> = []
    vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(((message: { capabilities: string[] }) => { welcomes.push(message) }) as never)
    hello(frame, ['ui.look', 'library'])
    expect(welcomes).toHaveLength(1)
    expect(welcomes[0].capabilities).toEqual(['ui.look', 'library'])
    expect(welcomes[0].look).toBeDefined()

    const sent = vi.spyOn(vm.host.bridge, 'libraryStatus')
    resetLibrary('someone')
    await vm.$nextTick()
    expect(sent).toHaveBeenCalledWith(expect.objectContaining({ signedIn: true, enabled: false }))
    resetLibrary(null)
    expect(push).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('shows Design as a part of the page once its hello listed ui.look', async () => {
    serve(200, EMBED_HTML)
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 0 })
    const { wrapper } = await mountDesign({ attachTo: document.body })
    const frame = wrapper.find('iframe').element as HTMLIFrameElement
    vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation((() => {}) as never)
    hello(frame, ['ui.look', 'library'])
    await new Promise(resolve => setTimeout(resolve, 300))
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).partOfPage).toBe(true)
    expect((wrapper.vm as any).ready).toBe(true)
    expect(wrapper.find('[data-tid="design-opening"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
