import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '../files'
import { httpClientActions } from '@/api/httpClientActions'
import { printerPictures } from '@/services/files/thumbnails'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: { get: vi.fn() }
}))

@Component({ template: '<div />' })
class Page extends Mixins(FilesMixin) {}

// The placeholder Fluidd is told while a printer is reached through Muon3D
// (services/muon-cloud/origin.ts), written out so a change there shows here.
const THROUGH_MUON3D = 'https://muon-cloud.invalid'

const CUBE = {
  modified: 1760000000,
  thumbnails: [
    { width: 32, height: 32, size: 900, relative_path: '.thumbs/cube-32x32.png' },
    { width: 300, height: 300, size: 24000, relative_path: '.thumbs/cube-300x300.png' }
  ]
}

const page = (apiUrl: string, name = 'Boxwood') => mount(Page, {
  mocks: {
    $store: {
      state: { config: { apiUrl } },
      getters: { 'auth/getCurrentUser': null, 'config/getCurrentInstance': { name } }
    }
  }
}).vm

const createObjectURL = URL.createObjectURL

afterEach(() => {
  printerPictures.urls = {}
  URL.createObjectURL = createObjectURL
  vi.mocked(httpClientActions.get).mockReset()
})

describe("a G-code file's picture", () => {
  it('is linked from the printer on this network, as before', () => {
    expect(page('http://192.168.137.73').getThumbUrl(CUBE as never, 'gcodes', 'Harry', true, CUBE.modified))
      .toBe('http://192.168.137.73/server/files/gcodes/Harry/.thumbs/cube-300x300.png?date=1760000000')
    expect(httpClientActions.get).not.toHaveBeenCalled()
  })

  it('is read through Muon3D, not linked to an address that does not exist', async () => {
    // 16 Oct 2026: no file had a picture on a printer opened through Muon3D,
    // because every <img> pointed at the placeholder origin.
    URL.createObjectURL = vi.fn(() => 'blob:cube')
    vi.mocked(httpClientActions.get).mockResolvedValue({ data: new Blob(['png']) } as never)
    const vm = page(THROUGH_MUON3D)

    const first = vm.getThumbUrl(CUBE as never, 'gcodes', 'Harry', true, CUBE.modified)
    expect(first).not.toContain('muon-cloud.invalid')
    expect(first).toBe('')
    await vi.waitFor(() => expect(vm.getThumbUrl(CUBE as never, 'gcodes', 'Harry', true, CUBE.modified)).toBe('blob:cube'))

    expect(vi.mocked(httpClientActions.get).mock.calls).toEqual([
      ['/server/files/gcodes/Harry/.thumbs/cube-300x300.png?date=1760000000', { responseType: 'blob' }]
    ])
    // Read once per file and printer, however often the page asks.
    vm.getThumbUrl(CUBE as never, 'gcodes', 'Harry', true, CUBE.modified)
    expect(httpClientActions.get).toHaveBeenCalledTimes(1)
  })

  it("is not another printer's picture of a file with the same name", async () => {
    URL.createObjectURL = vi.fn(() => `blob:${Math.random()}`)
    vi.mocked(httpClientActions.get).mockResolvedValue({ data: new Blob(['png']) } as never)
    page(THROUGH_MUON3D, 'Boxwood').getThumbUrl(CUBE as never, 'gcodes', '', true, CUBE.modified)
    page(THROUGH_MUON3D, 'Walnut').getThumbUrl(CUBE as never, 'gcodes', '', true, CUBE.modified)
    await vi.waitFor(() => expect(Object.keys(printerPictures.urls)).toHaveLength(2))
    expect(httpClientActions.get).toHaveBeenCalledTimes(2)
  })

  it('is none, not a broken picture, when the read fails', async () => {
    vi.mocked(httpClientActions.get).mockRejectedValue(new Error('Request failed with status code 403'))
    const vm = page(THROUGH_MUON3D)
    vm.getThumbUrl(CUBE as never, 'gcodes', '', true, CUBE.modified)
    await vi.waitFor(() => expect(Object.values(printerPictures.urls)).toEqual([null]))
    expect(vm.getThumbUrl(CUBE as never, 'gcodes', '', true, CUBE.modified)).toBe('')
  })
})
