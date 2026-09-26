/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://muon-walnut-8987.local/" }
 */
import { describe, it } from 'vitest'
import { expectProbesItself, useFirstVisit } from './init-helpers'

describe('getApiConfig on a printer', () => {
  useFirstVisit()

  it('still probes the origin that served the page, and falls back after 5 s', async () => {
    await expectProbesItself('muon-walnut-8987.local')
  })
})
