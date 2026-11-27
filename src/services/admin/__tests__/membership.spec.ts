import { describe, expect, it } from 'vitest'
import { staffMenuItems, staffRole } from '../membership'

describe('staffRole fails closed', () => {
  it.each([['admin', 'admin'], ['moderator', 'moderator']])('%s is %s', (value, role) => {
    expect(staffRole({ staff_role: value as never })).toBe(role)
  })
  it.each([[undefined], [true], [false], [null], ['owner'], ['staff'], ['Admin'], ['Staff'], [1], [{ role: 'admin' }], [['admin']]])('%j is nobody', (value) => {
    expect(staffRole({ staff_role: value as never })).toBeNull()
  })
  it('no account is nobody', () => {
    expect(staffRole(null)).toBeNull()
    expect(staffRole(undefined)).toBeNull()
  })
})

describe('staffMenuItems', () => {
  it('an admin gets Admin and Fleet, Grafana hidden', () => expect(staffMenuItems('admin')).toEqual(['admin', 'fleet']))
  it('a moderator gets Admin only', () => expect(staffMenuItems('moderator')).toEqual(['admin']))
  it('nobody gets nothing', () => expect(staffMenuItems(null)).toEqual([]))
})
