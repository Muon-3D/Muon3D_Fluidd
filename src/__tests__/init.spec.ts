/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://app.muon3d.com/" }
 */
import { describe, expect, it } from 'vitest'
import publicConfig from '../../public/config.json'
import serverConfig from '../../server/config.json'
import { expectAnswersAtOnce, useFirstVisit } from './init-helpers'

describe('getApiConfig on app.muon3d.com', () => {
  useFirstVisit()

  it.each([
    ['public/config.json', publicConfig],
    ['server/config.json', serverConfig]
  ])('%s blacklists both console hosts', (_name, config) => {
    expect(config.blacklist).toContain('app.muon3d.com')
    expect(config.blacklist).toContain('control.muon3d.com')
  })

  it('answers at once, without probing itself for a printer', async () => {
    expect(document.location.hostname).toBe('app.muon3d.com')
    await expectAnswersAtOnce()
  })
})
