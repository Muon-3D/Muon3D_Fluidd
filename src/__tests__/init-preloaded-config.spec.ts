/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { takePreloadedHostConfig } from '@/init'
import type { HostConfig } from '@/store/config/types'

const config = { blacklist: [], endpoints: [], hosted: false, themePresets: [] } as HostConfig

afterEach(() => { window.__muonHostConfig = undefined })

describe('config.json is asked for straight away (KAN-2011)', () => {
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8')

  it('index.html requests config.json while parsing, before the entry script and any discovery call', () => {
    const early = html.indexOf('config.json')
    expect(early).toBeGreaterThan(-1)
    expect(early).toBeLessThan(html.indexOf('type="module"'))
    for (const lookup of ['lan-printers', 'nearby', 'muon.local', '/server/', '/printer/', 'websocket']) {
      const at = html.indexOf(lookup)
      if (at >= 0) expect(at, lookup).toBeGreaterThan(early)
    }
  })

  it('hands over the answer once', async () => {
    window.__muonHostConfig = Promise.resolve(config)
    expect(await takePreloadedHostConfig()).toEqual(config)
    expect(await takePreloadedHostConfig()).toBeNull()
  })

  it('falls back (null) when there was none, it failed, or it was not an object', async () => {
    expect(await takePreloadedHostConfig()).toBeNull()
    window.__muonHostConfig = Promise.reject(new Error('down'))
    expect(await takePreloadedHostConfig()).toBeNull()
    window.__muonHostConfig = Promise.resolve(null)
    expect(await takePreloadedHostConfig()).toBeNull()
    window.__muonHostConfig = Promise.resolve([] as unknown as HostConfig)
    expect(await takePreloadedHostConfig()).toBeNull()
  })
})
