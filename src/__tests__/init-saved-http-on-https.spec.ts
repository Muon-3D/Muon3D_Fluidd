/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { describe, expect, it } from 'vitest'
import { getApiConfig } from '@/init'
import { hostConfig, useFirstVisit } from './init-helpers'
import publicConfig from '../../public/config.json'

// I-134 left a gap: a saved plain-http printer was still connected on page load
// from the https site (mixed content, "Not secure"). It connects on a click.
describe('getApiConfig with a saved http printer on the https site', () => {
  useFirstVisit()

  const save = (apiUrl: string) => localStorage.setItem('appInstances', JSON.stringify([
    { name: 'Saved', apiUrl, socketUrl: `${apiUrl.replace(/^http/, 'ws')}/websocket`, active: true }
  ]))

  it('does not start on it', async () => {
    save('http://192.168.1.50')
    const config = await getApiConfig(hostConfig(publicConfig.blacklist))
    expect(config.apiUrl).toBe('')
  })

  it('still starts on a saved https printer', async () => {
    save('https://printer.example.test')
    const config = await getApiConfig(hostConfig(publicConfig.blacklist))
    expect(config.apiUrl).toBe('https://printer.example.test')
  })
})
