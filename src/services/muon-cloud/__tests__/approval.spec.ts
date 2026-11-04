import { afterEach, describe, expect, it, vi } from 'vitest'
import { APPROVAL_WORDS, approvalSupported, watchForApproval } from '../approval'
import { notPairedMessage, PAIRING_COMING_SOON } from '../activate'

describe('waiting for approval, until muon-link-web carries it', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('is not supported: no watch, so no dialog is offered', () => {
    expect(watchForApproval('printer-1')).toBeNull()
    expect(approvalSupported()).toBe(false)
  })

  it('keeps today’s coming-soon line for a browser the printer does not know', () => {
    vi.stubEnv('DEV', false)
    expect(notPairedMessage('unknown')).toContain(PAIRING_COMING_SOON)
  })

  it('has plain words for every way a wait can fail', () => {
    for (const key of ['refused', 'timed_out', 'disabled', 'busy', 'cooldown'] as const) {
      expect(APPROVAL_WORDS[key]).toMatch(/\S/)
    }
    expect(APPROVAL_WORDS.disabled).toContain('Ask its owner')
  })
})
