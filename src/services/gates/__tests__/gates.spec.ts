import { beforeEach, describe, expect, it, vi } from 'vitest'

const caps = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: caps }) }))

const { hasMuonComponents, ownerState, refreshOwner, resetOwner } = await import('../index')
const { getters } = await import('@/store/server/getters')

beforeEach(() => {
  resetOwner()
  caps.mockReset()
})

describe('hasMuonComponents', () => {
  it('is true for muon_access or muon_protection', () => {
    expect(hasMuonComponents(['file_manager', 'muon_access'])).toBe(true)
    expect(hasMuonComponents(['muon_protection'])).toBe(true)
  })

  it('is false for a plain Moonraker, and for no list', () => {
    expect(hasMuonComponents(['file_manager', 'authorization', 'update_manager'])).toBe(false)
    expect(hasMuonComponents([])).toBe(false)
    expect(hasMuonComponents(undefined)).toBe(false)
  })
})

describe('server/isMuonPrinter getter', () => {
  const read = (components: string[]) => (getters.isMuonPrinter as any)({ info: { components } })

  it('reads the components server.info reported', () => {
    expect(read(['muon_access'])).toBe(true)
    expect(read(['file_manager'])).toBe(false)
  })
})

describe('refreshOwner', () => {
  it('is owner when the printer allows changing who can use it', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    await refreshOwner()
    expect(ownerState.isOwner).toBe(true)
  })

  it('is not owner when it only lets the client ask, or refuses', async () => {
    caps.mockResolvedValue({ protection: 'ask' })
    await refreshOwner()
    expect(ownerState.isOwner).toBe(false)
    caps.mockResolvedValue({ protection: 'refused' })
    await refreshOwner()
    expect(ownerState.isOwner).toBe(false)
  })

  it('stays unknown when the printer does not answer', async () => {
    caps.mockRejectedValue(new Error('404'))
    await refreshOwner()
    expect(ownerState.isOwner).toBeNull()
    expect(ownerState.checking).toBe(false)
  })
})
