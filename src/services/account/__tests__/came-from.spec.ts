import { beforeEach, describe, expect, it } from 'vitest'
import { accountCameFrom, noteAccountEntry } from '../came-from'

const printerPage = { name: 'Settings', fullPath: '/boxwood-367a/settings#access', params: { printer: 'boxwood-367a' } }
const account = (section = '') => ({ name: 'Account (no printer)', fullPath: `/account${section}`, params: {} })

describe("Account's way back to the printer page it was opened from", () => {
  beforeEach(() => { accountCameFrom.path = null })

  it('remembers the printer page Account was opened from', () => {
    noteAccountEntry(account(), printerPage)
    expect(accountCameFrom.path).toBe('/boxwood-367a/settings#access')
  })

  it("keeps it while moving between Account's sections", () => {
    noteAccountEntry(account(), printerPage)
    noteAccountEntry(account('/printers'), account())
    expect(accountCameFrom.path).toBe('/boxwood-367a/settings#access')
  })

  it('forgets it when Account is opened from a page that is no printer\'s', () => {
    noteAccountEntry(account(), printerPage)
    noteAccountEntry(printerPage, account())
    noteAccountEntry(account(), { name: 'Printers', fullPath: '/', params: {} })
    expect(accountCameFrom.path).toBeNull()
  })

  it('ignores navigation that does not enter Account', () => {
    noteAccountEntry(printerPage, { name: 'Jobs', fullPath: '/boxwood-367a/jobs', params: { printer: 'boxwood-367a' } })
    expect(accountCameFrom.path).toBeNull()
  })
})
