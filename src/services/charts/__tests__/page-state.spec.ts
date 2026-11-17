import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('the Charts range', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('starts at 10 min and keeps the one picked for the next visit', async () => {
    const first = await import('../page-state')
    expect(first.chartsPage.range).toBe(600)
    first.setChartsRange(60)
    expect(first.chartsPage.range).toBe(60)
    vi.resetModules()
    const again = await import('../page-state')
    expect(again.chartsPage.range).toBe(60)
  })

  it('ignores a saved range it does not offer', async () => {
    localStorage.setItem('muon3d.charts.range.v3', '42')
    const { chartsPage } = await import('../page-state')
    expect(chartsPage.range).toBe(600)
  })
})
