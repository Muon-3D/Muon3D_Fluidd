import { afterEach, describe, expect, it, vi } from 'vitest'
import { APPROVAL_WORDS, connectWithApproval, noteAdmittedAtPanel, PANEL_NOTE_MS, onApprovalWatch, type ApprovalWatch } from '../approval'
import { notPairedMessage, PAIRING_COMING_SOON } from '../activate'

describe('waiting for approval (connectAs, muon-link#126)', () => {
  afterEach(() => {
    onApprovalWatch(null)
    vi.unstubAllEnvs()
  })

  it('is not supported when the endpoint has no connectAs: null, no watch', async () => {
    const seen = vi.fn()
    onApprovalWatch(seen)
    expect(await connectWithApproval({}, 'p1', 'Control')).toBeNull()
    expect(seen).not.toHaveBeenCalled()
  })

  it('keeps the coming-soon line for a browser the printer does not know when pairing is switched off', () => {
    vi.stubEnv('VUE_MUON_PANEL_CODE_PAIRING', '0')
    expect(notPairedMessage('unknown')).toContain(PAIRING_COMING_SOON)
  })

  it('asks as operator, passes the symbols on once, and ends admitted', async () => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    const connectAs = vi.fn(async (_id: string, _name: string, _role: string, onPending: (n: { code: string }) => void) => {
      onPending({ code: 'F6QTDH' })
      onPending({ code: 'F6QTDH' })
      return 'session'
    })
    expect(await connectWithApproval({ connectAs }, 'p1', 'Control')).toBe('session')
    expect(connectAs.mock.calls[0].slice(0, 3)).toEqual(['p1', 'Control', 'operator'])
    expect(await watch.pending).toBe('F6QTDH')
    expect(await watch.outcome).toBe('admitted')
  })

  it('an open printer that admits at once never shows a wait or an outcome (KAN-3583)', async () => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    expect(await connectWithApproval({ connectAs: async () => 'session' }, 'p1', 'Control')).toBe('session')
    const settled = vi.fn()
    watch.pending.then(settled)
    watch.outcome.then(settled)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(settled).not.toHaveBeenCalled()
  })

  it('a printer whose panel just accepted this browser confirms admission once, though it held nothing', async () => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    noteAdmittedAtPanel('p1')
    await connectWithApproval({ connectAs: async () => 'session' }, 'p1', 'Control')
    expect(await watch.outcome).toBe('admitted')
    onApprovalWatch(w => { watch = w })
    await connectWithApproval({ connectAs: async () => 'session' }, 'p1', 'Control')
    const settled = vi.fn()
    watch.outcome.then(settled)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(settled).not.toHaveBeenCalled()
  })

  it('a panel note no dial uses within two minutes is stale: the next dial says nothing', async () => {
    vi.useFakeTimers()
    try {
      let watch!: ApprovalWatch
      onApprovalWatch(w => { watch = w })
      noteAdmittedAtPanel('p2')
      vi.advanceTimersByTime(PANEL_NOTE_MS + 1)
      await connectWithApproval({ connectAs: async () => 'session' }, 'p2', 'Control')
      const settled = vi.fn()
      watch.outcome.then(settled)
      await vi.advanceTimersByTimeAsync(50)
      expect(settled).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it.each(['refused', 'timed_out', 'disabled', 'busy', 'cooldown'] as const)('maps a %s rejection', async reason => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    const error = Object.assign(new Error('x'), { kind: 'refused', reason })
    await expect(connectWithApproval({ connectAs: async () => { throw error } }, 'p1', 'Control')).rejects.toBe(error)
    expect(await watch.outcome).toBe(reason)
  })

  it('a refusal with no reason is refused; another error ends no wait', async () => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    await expect(connectWithApproval({ connectAs: async () => { throw Object.assign(new Error('x'), { kind: 'refused' }) } }, 'p', 'C')).rejects.toThrow()
    expect(await watch.outcome).toBe('refused')
    await expect(connectWithApproval({ connectAs: async () => { throw new Error('network') } }, 'p', 'C')).rejects.toThrow('network')
  })

  it('Cancel stops the wait', async () => {
    let watch!: ApprovalWatch
    onApprovalWatch(w => { watch = w })
    const pending = connectWithApproval({ connectAs: () => new Promise<string>(() => {}) }, 'p', 'C')
    watch.cancel()
    await expect(pending).rejects.toThrow('Cancelled')
  })

  it('has plain words for every way a wait can fail', () => {
    for (const key of ['refused', 'timed_out', 'disabled', 'busy', 'cooldown'] as const) {
      expect(APPROVAL_WORDS[key]).toMatch(/\S/)
    }
    expect(APPROVAL_WORDS.disabled).toContain('Ask its owner')
  })
})
