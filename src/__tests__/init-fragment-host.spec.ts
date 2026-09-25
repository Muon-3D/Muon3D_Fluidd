/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://muon3d/" }
 */
import { describe, it } from 'vitest'
import { expectProbesItself, useFirstVisit } from './init-helpers'

// A host that is only part of a blacklisted name ("muon3d" in
// "app.muon3d.com") is not blacklisted: the match is on the whole host.
describe('getApiConfig on a host named after part of a blacklisted one', () => {
  useFirstVisit()

  it('still probes the origin that served the page', async () => {
    await expectProbesItself('muon3d')
  })
})
