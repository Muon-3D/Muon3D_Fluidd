import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyState,
  clearDraft,
  loadDraft,
  newClientId,
  resetSetupState,
  saveDraft,
  setLocal,
  setupState
} from '../state'
import type { SetupState } from '../types'
import networkPhone from './fixtures/state.02-network-phone-driver.json'
import regionConfirm from './fixtures/state.04b-region-confirm.json'
import linkCode from './fixtures/state.06-remote-link-code.json'

const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

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

  it('keeps its id and every flag a captive-window reload must not lose', () => {
    setLocal({ droveSetup: true, changingWifi: true, joinRev: 7 })
    const stored = JSON.parse(sessionStorage.getItem('muon.setup.local') ?? '{}')
    expect(stored).toEqual({
      clientId: setupState.local.clientId,
      droveSetup: true,
      changingWifi: true,
      joinRev: 7
    })
  })
})

describe('taking a state', () => {
  beforeEach(() => {
    resetSetupState()
  })

  it('ignores a notification or write result older than the one held', () => {
    applyState(copy(linkCode))
    expect(applyState(copy(networkPhone))).toBe(false)
    expect(setupState.state?.rev).toBe(12)
  })

  it('takes a GET answer whatever its rev, as after a reset or on another printer', () => {
    applyState(copy(linkCode))
    expect(applyState(copy(networkPhone), { fromGet: true })).toBe(true)
    expect(setupState.state?.rev).toBe(4)
  })

  it('counts a finished join as a network write that arrived, though the step is still pending', () => {
    applyState(copy(networkPhone))
    setupState.lostWrite = { step: 'network', failed: false }

    // Picker market: joined, the step stays pending until the region is confirmed.
    applyState(copy(regionConfirm))

    expect(setupState.state?.steps.network.status).toBe('pending')
    expect(setupState.lostWrite).toBeNull()
  })

  it('says a network write did not arrive when nothing moved', () => {
    applyState(copy(networkPhone))
    setupState.lostWrite = { step: 'network', failed: false }

    applyState({ ...copy(networkPhone), rev: 5 })

    expect(setupState.lostWrite).toEqual({ step: 'network', failed: true })
  })

  it('forgets everything when Fluidd switches printer', () => {
    applyState(copy(linkCode))
    setupState.unavailable = true
    resetSetupState()
    expect(setupState.state).toBeNull()
    expect(setupState.unavailable).toBe(false)
    expect(applyState(copy(networkPhone))).toBe(true)
  })
})
