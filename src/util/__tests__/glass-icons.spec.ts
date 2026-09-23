import { describe, expect, it } from 'vitest'
import { applyGlassIcons, glassIconNames } from '../glass-icons'
import { glassIconNodes } from '../glass-icon-nodes'

describe('glass icons', () => {
  it('draws every icon it swaps in', () => {
    const undrawn = Object.values(glassIconNames).filter(name => !(name in glassIconNodes))

    expect(undrawn).toEqual([])
  })

  it('swaps the mapped icons to line icons and back, leaving the rest alone', () => {
    const values: Record<string, unknown> = { dash: 'M0 0h24v24H0z', estop: 'M1 1h22v22H1z', checkboxOn: 'M2 2h20v20H2z' }

    applyGlassIcons(values, true)

    expect(values.dash).toMatchObject({ props: { name: 'layout-grid' } })
    expect(values.estop).toMatchObject({ props: { name: 'octagon-alert' } })
    expect(values.checkboxOn).toBe('M2 2h20v20H2z')

    applyGlassIcons(values, false)

    expect(values).toEqual({ dash: 'M0 0h24v24H0z', estop: 'M1 1h22v22H1z', checkboxOn: 'M2 2h20v20H2z' })
  })
})
