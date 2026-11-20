import { describe, expect, it } from 'vitest'
import { isOffline, offlineSet } from '../../../vite.config.startup'

// KAN-5101: what the service worker precaches so a visited Control works with no internet.
describe('the offline set', () => {
  it.each([
    'index.html',
    'assets/Overview-abc123.js',
    'assets/Overview-abc123.css',
    'assets/m1-accurate-Wbt2uMK4.glb',
    'assets/m1-idle-xyz.jpg',
    'assets/muon_link_web_bg-Df2oRmfL.wasm',
    'assets/viewer-DwiF8nj5.js',
    'draco/draco_decoder.wasm',
    'draco/draco_wasm_wrapper.js',
    'fonts/krona-one-latin-400-normal.woff2',
    'img/icons/android-chrome-192x192.png',
    'logo_voron.svg',
    'favicon.ico'
  ])('keeps %s', url => {
    expect(isOffline(url)).toBe(true)
  })

  it.each([
    'config.json',
    'release_info.json',
    'build-info.json',
    'sw.js',
    'licenses/muon-link-web/8d40fca/LICENSE',
    'monacoeditorwork/json.worker.bundle.js',
    'assets/setupMonaco-DC9Tm_Th.js',
    'assets/onigasm-kQxuTr47.wasm',
    'assets/codicon-DCmgc-ay.ttf',
    'assets/index-abc.js.map'
  ])('leaves out %s', url => {
    expect(isOffline(url)).toBe(false)
  })

  it('is the manifest transform', () => {
    const { manifest, warnings } = offlineSet()([{ url: 'index.html' }, { url: 'config.json' }, { url: 'assets/a.glb' }])
    expect(manifest.map(e => e.url)).toEqual(['index.html', 'assets/a.glb'])
    expect(warnings).toEqual([])
  })
})
