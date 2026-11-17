import { beforeEach, describe, expect, it, vi } from 'vitest'

const caps = vi.hoisted(() => vi.fn())
const dev = vi.hoisted(() => ({ refresh: vi.fn(), state: { enabled: null as boolean | null } }))
vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: caps }) }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: dev.state, refreshDevMode: dev.refresh }))
vi.mock('@/services/printer-pages', async () => {
  const Vue = (await import('vue')).default
  const slug = Vue.observable({ v: 'A' as string | null })
  return { activeSlug: () => slug.v, __slug: slug }
})

const gates = await import('../index')
const { muonFromComponents, refreshCanManageAccess, refreshGateDevMode, resetGates, valueFor, gateState } = gates
const { getters } = await import('@/store/server/getters')
const { actions: socketActions } = await import('@/store/socket/actions')
const slug = ((await import('@/services/printer-pages')) as any).__slug as { v: string | null }

const deferred = <T>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}

beforeEach(() => {
  slug.v = 'A'
  resetGates()
  caps.mockReset()
  dev.refresh.mockReset()
  dev.refresh.mockResolvedValue(undefined)
  dev.state.enabled = null
})

describe('muonFromComponents', () => {
  it('is true for muon_access or muon_protection', () => {
    expect(muonFromComponents(['file_manager', 'muon_access'])).toBe(true)
    expect(muonFromComponents(['muon_protection'])).toBe(true)
  })

  it('is false only for a loaded list with neither', () => {
    expect(muonFromComponents(['file_manager', 'authorization', 'update_manager'])).toBe(false)
  })

  it('is unknown (null) for the empty list the store holds before server.info', () => {
    expect(muonFromComponents([])).toBeNull()
    expect(muonFromComponents(undefined)).toBeNull()
  })
})

describe('server/isMuonPrinter getter', () => {
  const read = (components: string[]) => (getters.isMuonPrinter as any)({ info: { components } })

  it('is three-state', () => {
    expect(read(['muon_access'])).toBe(true)
    expect(read(['file_manager'])).toBe(false)
    expect(read([])).toBeNull()
  })
})

describe('refreshCanManageAccess', () => {
  it('is yes when the printer allows managing access', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    await refreshCanManageAccess()
    expect(valueFor('manage', 'A')).toBe(true)
  })

  it('is no when it only lets the client ask, or refuses', async () => {
    caps.mockResolvedValue({ protection: 'ask' })
    await refreshCanManageAccess()
    expect(valueFor('manage', 'A')).toBe(false)
  })

  it.each([
    ['a 403', Object.assign(new Error('refused'), { status: 403 })],
    ['a 5xx', Object.assign(new Error('boom'), { status: 503 })],
    ['a timeout', new Error('timeout')]
  ])('stays unknown (never yes) on %s', async (_name, error) => {
    caps.mockRejectedValue(error)
    await refreshCanManageAccess()
    expect(valueFor('manage', 'A')).toBeNull()
    expect(gateState.checking.manage).toBe(false)
  })

  it('is one printer\'s answer: another printer reads unknown', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    await refreshCanManageAccess()
    expect(valueFor('manage', 'B')).toBeNull()
  })

  it('ignores a late reply after the printer was switched', async () => {
    const late = deferred<Record<string, string>>()
    caps.mockReturnValue(late.promise)
    const asking = refreshCanManageAccess()
    slug.v = 'B'
    resetGates()
    late.resolve({ protection: 'allowed' })
    await asking
    expect(valueFor('manage', 'A')).toBeNull()
    expect(valueFor('manage', 'B')).toBeNull()
  })

  it('ignores a late reply for a printer that is no longer active, even with no reset', async () => {
    const late = deferred<Record<string, string>>()
    caps.mockReturnValue(late.promise)
    const asking = refreshCanManageAccess()
    slug.v = 'B'
    late.resolve({ protection: 'allowed' })
    await asking
    expect(valueFor('manage', 'A')).toBeNull()
    expect(valueFor('manage', 'B')).toBeNull()
  })

  it('a reset clears what was known', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    await refreshCanManageAccess()
    resetGates()
    expect(valueFor('manage', 'A')).toBeNull()
  })
})

describe('refreshGateDevMode', () => {
  it('reads developer mode for this printer', async () => {
    dev.refresh.mockResolvedValue(true)
    await refreshGateDevMode()
    expect(valueFor('dev', 'A')).toBe(true)
    expect(valueFor('dev', 'B')).toBeNull()
  })

  it("does not read another printer's state when this one cannot be reached", async () => {
    dev.state.enabled = true // left over from printer A
    slug.v = 'B'
    dev.refresh.mockResolvedValue(null) // B did not answer: the global keeps its old value
    await refreshGateDevMode()
    expect(valueFor('dev', 'B')).toBeNull()
  })

  it('an in-flight reply from A, then a switch to B whose requests fail, leaves B unknown', async () => {
    const lateA = deferred<boolean | null>()
    dev.refresh.mockReturnValueOnce(lateA.promise)
    const askingA = refreshGateDevMode()
    slug.v = 'B'
    resetGates()
    dev.refresh.mockResolvedValueOnce(null) // B fails
    await refreshGateDevMode()
    dev.state.enabled = true // A's late reply lands in the shared state
    lateA.resolve(true)
    await askingA
    expect(valueFor('dev', 'A')).toBeNull()
    expect(valueFor('dev', 'B')).toBeNull()
  })

  it('leaves the shared devModeState alone while the gate refreshes', async () => {
    dev.state.enabled = true
    const pending = deferred<boolean | null>()
    dev.refresh.mockReturnValueOnce(pending.promise)
    const asking = refreshGateDevMode()
    expect(dev.state.enabled).toBe(true)
    pending.resolve(false)
    await asking
    expect(dev.state.enabled).toBe(true)
    expect(valueFor('dev', 'A')).toBe(false)
  })

  it('ignores a late answer after a switch', async () => {
    const late = deferred<boolean | null>()
    dev.refresh.mockReturnValueOnce(late.promise)
    const asking = refreshGateDevMode()
    slug.v = 'B'
    resetGates()
    late.resolve(true)
    await asking
    expect(valueFor('dev', 'A')).toBeNull()
    expect(valueFor('dev', 'B')).toBeNull()
  })

  it('asks the new printer when the slug changes mid-request without a reset', async () => {
    const lateA = deferred<boolean | null>()
    dev.refresh.mockReturnValueOnce(lateA.promise)
    dev.refresh.mockResolvedValue(true)
    const asking = refreshGateDevMode()
    slug.v = 'B'
    lateA.resolve(false)
    await asking
    await new Promise(resolve => setTimeout(resolve))
    expect(valueFor('dev', 'A')).toBeNull()
    expect(valueFor('dev', 'B')).toBe(true)
  })
})

describe('a slug change mid-request', () => {
  it('re-asks access for the new printer instead of staying unknown', async () => {
    const lateA = deferred<Record<string, string>>()
    caps.mockReturnValueOnce(lateA.promise)
    caps.mockResolvedValue({ protection: 'allowed' })
    const asking = refreshCanManageAccess()
    slug.v = 'B'
    lateA.resolve({ protection: 'ask' })
    await asking
    await new Promise(resolve => setTimeout(resolve))
    expect(valueFor('manage', 'A')).toBeNull()
    expect(valueFor('manage', 'B')).toBe(true)
  })
})

describe('central reset', () => {
  it('a socket close (clean or not) forgets every answer', async () => {
    for (const wasClean of [true, false]) {
      caps.mockResolvedValue({ protection: 'allowed' })
      await refreshCanManageAccess()
      expect(valueFor('manage', 'A')).toBe(true)
      const dispatch = vi.fn()
      await (socketActions.onSocketClose as any)({ dispatch, commit: vi.fn() }, { wasClean })
      expect(valueFor('manage', 'A')).toBeNull()
    }
  })
})
