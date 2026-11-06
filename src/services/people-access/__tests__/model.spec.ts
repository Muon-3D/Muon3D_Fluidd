import { describe, expect, it } from 'vitest'
import {
  ITEM_HOME,
  OWNER_ONLY_GROUPS,
  ROLE_TABLE,
  accessViewer,
  accountAccessPath,
  accountRowActions,
  printerAccessPath,
  printerGroups,
  roleRows,
  type GroupFacts
} from '../model'

const facts = (over: Partial<GroupFacts> = {}): GroupFacts => ({ cloud: true, canManage: true, waiting: 1, links: 1, olderTools: true, canAsk: false, ...over })

describe('the role table (J1, R1)', () => {
  it('has the five fixed rows, Viewer watching only and the owner alone on Wi-Fi, people and developer mode', () => {
    expect(ROLE_TABLE.map(r => [r.id, r.owner, r.operator, r.viewer])).toEqual([
      ['watch', true, true, true],
      ['print', true, true, false],
      ['control', true, true, false],
      ['printer', true, false, false],
      ['people', true, false, false]
    ])
    expect(roleRows('viewer').map(r => r.id)).toEqual(['watch'])
    expect(roleRows('operator').map(r => r.id)).toEqual(['watch', 'print', 'control'])
  })
})

describe('who is looking', () => {
  const owned = { kind: 'account', email: 'Jack@Example.test' }

  it('the printer makes the owner only for an admin-level caller signed in as its owner', () => {
    expect(accessViewer({ owner: owned, level: 'admin', role: 'operator' }, null, 'jack@example.test')).toBe('owner')
    // Admin level alone is the panel, a local caller or a paired client: not the owner.
    expect(accessViewer({ owner: owned, level: 'admin', role: 'operator' }, null, 'harry@example.test')).toBe('operator')
    expect(accessViewer({ owner: owned, level: 'admin', role: 'operator' }, null, null)).toBe('operator')
    expect(accessViewer({ owner: owned, level: 'member', role: 'viewer' }, null, 'jack@example.test')).toBe('viewer')
  })

  it('a printer with no owner is managed by whoever is at admin level there', () => {
    expect(accessViewer({ owner: { kind: 'none' }, level: 'admin', role: 'operator' }, null, null)).toBe('owner')
    expect(accessViewer({ owner: { kind: 'none' }, level: 'signed-out-guest', role: 'operator' }, null, null)).toBe('operator')
  })

  it('takes the console when the printer did not answer, or for a printer this account linked', () => {
    expect(accessViewer(null, { shared: false })).toBe('owner')
    expect(accessViewer({ owner: owned, level: 'member', role: 'operator' }, { shared: false }, 'jack@example.test')).toBe('owner')
    expect(accessViewer(null, { shared: true, role: 'operator' })).toBe('operator')
    expect(accessViewer(null, { shared: true, role: 'viewer' })).toBe('viewer')
  })

  it('never shows more than a source said: an unknown share role is Viewer, nothing known is null', () => {
    expect(accessViewer(null, { shared: true })).toBe('viewer')
    expect(accessViewer({}, null)).toBeNull()
    expect(accessViewer(null, null)).toBeNull()
  })
})

describe('which groups each role sees', () => {
  it('the owner sees every group, in the page order', () => {
    expect(printerGroups('owner', facts())).toEqual(['you', 'people', 'waiting', 'links', 'devices', 'entry', 'roles', 'olderTools', 'developer', 'unlink'])
  })

  it('hides empty Waiting and Invite links groups, and the cloud groups for a printer not in the account', () => {
    expect(printerGroups('owner', facts({ waiting: 0, links: 0 }))).not.toContain('waiting')
    expect(printerGroups('owner', facts({ waiting: 0, links: 0 }))).not.toContain('links')
    expect(printerGroups('owner', facts({ cloud: false }))).toEqual(['you', 'devices', 'entry', 'roles', 'olderTools', 'developer'])
    expect(printerGroups('owner', facts({ olderTools: false }))).not.toContain('olderTools')
  })

  it("hides the printer's own rules when it doesn't let this browser manage them (refused, failed or not asked)", () => {
    expect(printerGroups('owner', facts({ canManage: false }))).toEqual(['you', 'people', 'waiting', 'links', 'devices', 'unlink'])
  })

  it("offers asking the printer's screen to an owner the printer lets ask (protection: ask), and never to a member", () => {
    expect(printerGroups('owner', facts({ canManage: false, canAsk: true }))).toEqual(['you', 'people', 'waiting', 'links', 'devices', 'askAtPrinter', 'unlink'])
    expect(printerGroups('owner', facts({ canManage: true, canAsk: true }))).not.toContain('askAtPrinter')
    expect(printerGroups('operator', facts({ canManage: false, canAsk: true }))).not.toContain('askAtPrinter')
  })

  it('an operator sees the people read-only, what they can do, their devices and Leave', () => {
    expect(printerGroups('operator', facts())).toEqual(['you', 'peopleReadOnly', 'canDo', 'yourDevices', 'leave'])
  })

  it('a viewer sees no list of people', () => {
    expect(printerGroups('viewer', facts())).toEqual(['you', 'canDo', 'needToPrint', 'leave'])
  })

  it('no owner-only group ever reaches a member, whatever the facts', () => {
    for (const viewer of ['operator', 'viewer'] as const) {
      for (const cloud of [true, false]) {
        const groups = printerGroups(viewer, facts({ cloud, waiting: 5, links: 5 }))
        expect(groups.filter(g => OWNER_ONLY_GROUPS.includes(g))).toEqual([])
      }
    }
  })

  it('Leave needs the printer in the account; the owner never gets Leave', () => {
    expect(printerGroups('operator', facts({ cloud: false }))).not.toContain('leave')
    expect(printerGroups('owner', facts())).not.toContain('leave')
  })
})

describe('where each item lives', () => {
  it('each item has one home, and only Leave is offered in both places', () => {
    expect(Object.entries(ITEM_HOME).filter(([, home]) => home === 'both').map(([item]) => item)).toEqual(['leave'])
    expect(ITEM_HOME.people).toBe('printer')
    expect(ITEM_HOME.unlink).toBe('printer')
    expect(ITEM_HOME.yourDevices).toBe('account')
    expect(ITEM_HOME.appsAndAgents).toBe('account')
    expect(ITEM_HOME.yourPrinters).toBe('account')
  })

  it('links from the printer to Account are top-level, never under the printer', () => {
    expect(accountAccessPath('devices')).toBe('/account/devices')
    expect(accountAccessPath('apps')).toBe('/account/apps')
    expect(printerAccessPath('boxwood-367a')).toBe('/boxwood-367a/settings#access')
  })

  it("an owner's Account row offers People; a member's offers Open and Leave", () => {
    expect(accountRowActions('owner')).toEqual(['people'])
    expect(accountRowActions('operator')).toEqual(['open', 'leave'])
    expect(accountRowActions('viewer')).toEqual(['open', 'leave'])
  })
})
