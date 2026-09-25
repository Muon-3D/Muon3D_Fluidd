import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraft, loadDraft, newClientId, saveDraft, setLocal, setupState } from '../state'

describe('setup page draft', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('restores the SSID, security and Enterprise identity after a reload', () => {
    saveDraft({ ssid: 'eduroam', security: 'enterprise', identity: 'ab123@uni.ac.uk' })
    expect(loadDraft()).toEqual({ ssid: 'eduroam', security: 'enterprise', identity: 'ab123@uni.ac.uk' })
  })

  it('never stores a password, even one passed in by mistake', () => {
    saveDraft({ ssid: 'HomeWiFi', security: 'wpa2', psk: 'correct horse', password: 'hunter22' } as never)
    const stored = sessionStorage.getItem('muon.setup.draft') ?? ''
    expect(stored).not.toContain('correct horse')
    expect(stored).not.toContain('hunter22')
    expect(loadDraft()).toEqual({ ssid: 'HomeWiFi', security: 'wpa2' })
  })

  it('is gone once cleared', () => {
    saveDraft({ ssid: 'HomeWiFi' })
    clearDraft()
    expect(loadDraft()).toEqual({})
  })
})

describe('this tab', () => {
  it('has a v4 UUID without needing a secure context', () => {
    expect(newClientId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(newClientId()).not.toBe(newClientId())
  })

  it('keeps its id and the flags a captive window reload must not lose', () => {
    setLocal({ droveSetup: true, awaitingNetworkResult: true, changingWifi: true })
    const stored = JSON.parse(sessionStorage.getItem('muon.setup.local') ?? '{}')
    expect(stored).toEqual({
      clientId: setupState.local.clientId,
      droveSetup: true,
      awaitingNetworkResult: true
    })
  })
})
