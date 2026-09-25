/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { describe, expect, it } from 'vitest'
import { expectAnswersAtOnce, useFirstVisit } from './init-helpers'

// The console's host after the KAN-414 cutover (KAN-404, ADR 0025).
describe('getApiConfig on control.muon3d.com', () => {
  useFirstVisit()

  it('answers at once, without probing itself for a printer', async () => {
    expect(document.location.hostname).toBe('control.muon3d.com')
    await expectAnswersAtOnce()
  })
})
