import Vue, { type VueConstructor } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Timelapse from '../Timelapse.vue'
import TimelapseStatusCard from '@/components/widgets/timelapse/TimelapseStatusCard.vue'
import { httpClientActions } from '@/api/httpClientActions'
import { printerPictures } from '@/services/files/thumbnails'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: { get: vi.fn() }
}))
vi.mock('@/api/socketActions', () => ({
  SocketActions: { serverFilesGetDirectory: vi.fn() }
}))

// The placeholder Fluidd is told while a printer is reached through Muon3D
// (services/muon-cloud/origin.ts), written out so a change there shows here.
const THROUGH_MUON3D = 'https://muon-cloud.invalid'
const LAN = 'http://192.168.137.73'

const VIDEO = { type: 'file', filename: 'timelapse_cube_20261016_1412.mp4', size: 4_000_000, modified: 1760620000 }
const VIDEO_PICTURE = { type: 'file', filename: 'timelapse_cube_20261016_1412.jpg', size: 40_000, modified: 1760620000 }

function store (apiUrl: string) {
  const getters: Record<string, unknown> = {
    'files/getDirectory': (root: string) => root === 'timelapse' ? [VIDEO, VIDEO_PICTURE] : undefined,
    'timelapse/getLastFrame': { count: 42, uniqueCount: 42, file: 'frame000042.jpg' },
    'timelapse/getSettings': undefined,
    'timelapse/getRenderStatus': undefined,
    'webcams/getWebcamById': () => undefined,
    'config/getCurrentInstance': { name: 'Boxwood' },
    'auth/getCurrentUser': null
  }
  return {
    state: {
      config: { apiUrl, uiSettings: { general: {} } },
      printer: { printer: { print_stats: { filename: 'cube.gcode' }, current_file: { print_start_time: 1760610000 } } }
    },
    getters: new Proxy(getters, { get: (g, k: string) => k in g ? g[k] : undefined }),
    dispatch: vi.fn()
  }
}

// Only the getters are asked, so the component is made but not drawn.
const mountOn = (component: unknown, apiUrl: string) => {
  const $store = store(apiUrl)
  const Made = (Vue.extend(component as never) as VueConstructor).extend({
    beforeCreate () { (this as unknown as { $store: unknown }).$store = $store }
  })
  return new Made() as unknown as Record<string, unknown>
}

const createObjectURL = URL.createObjectURL

afterEach(() => {
  printerPictures.urls = {}
  URL.createObjectURL = createObjectURL
  vi.mocked(httpClientActions.get).mockReset()
})

describe("Timelapse's pictures through Muon3D", () => {
  it("reads this print's frame and a video's picture through the HTTP client, not from the placeholder address", async () => {
    // 16 Oct 2026: the file pictures through Muon3D were links to an address
    // that doesn't exist; Timelapse's were the same.
    URL.createObjectURL = vi.fn(() => 'blob:picture')
    vi.mocked(httpClientActions.get).mockResolvedValue({ data: new Blob(['jpg']) } as never)
    const page = mountOn(Timelapse, THROUGH_MUON3D)
    const card = mountOn(TimelapseStatusCard, THROUGH_MUON3D)

    const shown = () => [page.frameUrl, (page.url as (n: string, m?: number) => string)(VIDEO_PICTURE.filename, VIDEO.modified), card.previewUrl]
    for (const url of shown()) expect(String(url)).not.toContain('muon-cloud.invalid')
    await vi.waitFor(() => expect(shown()).toEqual(['blob:picture', 'blob:picture', 'blob:picture']))

    const paths = vi.mocked(httpClientActions.get).mock.calls.map(c => String(c[0]))
    expect(paths.some(p => p.startsWith('/server/files/timelapse_frames/frame000042.jpg?'))).toBe(true)
    expect(paths.some(p => p.startsWith('/server/files/timelapse/timelapse_cube_20261016_1412.jpg?'))).toBe(true)
    // The page and the card show the same frame: read once.
    expect(paths.filter(p => p.includes('frame000042')).length).toBe(1)
  })

  it('still links them from a printer on this network', () => {
    const page = mountOn(Timelapse, LAN)
    expect(String(page.frameUrl)).toMatch(/^http:\/\/192\.168\.137\.73\/server\/files\/timelapse_frames\/frame000042\.jpg\?date=\d+$/)
    expect(httpClientActions.get).not.toHaveBeenCalled()
  })
})
