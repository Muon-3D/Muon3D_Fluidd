import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { getters } from '@/store/server/getters'
import { resetGates } from '@/services/gates'
import { keep } from '@/services/gates/state'
import MuonGatesMixin from '../muon-gates'

vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: vi.fn().mockResolvedValue({}) }) }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: { enabled: null }, refreshDevMode: vi.fn() }))
const slug = vi.hoisted(() => ({ current: null as string | null }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => slug.current }))

function mountWith (components: string[], printerState = 'standby') {
  const Probe = Vue.extend({ mixins: [MuonGatesMixin as any], render: h => h('i') })
  const store = {
    getters: {
      'server/isMuonPrinter': (getters.isMuonPrinter as any)({ info: { components } }),
      'server/componentSupport': (c: string) => components.includes(c),
      'printer/getPrinterState': printerState
    }
  }
  return shallowMount(Probe, { mocks: { $store: store } }).vm as any
}

describe('MuonGatesMixin', () => {
  it('isMuonPrinter is true, false, or null before server.info', () => {
    expect(mountWith(['muon_access']).isMuonPrinter).toBe(true)
    expect(mountWith(['muon_protection']).isMuonPrinter).toBe(true)
    expect(mountWith(['file_manager']).isMuonPrinter).toBe(false)
    expect(mountWith([]).isMuonPrinter).toBeNull()
  })

  it('with no active printer nothing is unlocked and access is unknown', () => {
    const vm = mountWith(['muon_access'])
    expect(vm.devModeEnabled).toBe(false)
    expect(vm.canManageAccess).toBeNull()
  })

  it('exposes the printing state for a move-or-heat-while-printing gate', () => {
    expect(mountWith(['muon_access'], 'printing').printerPrinting).toBe(true)
    expect(mountWith(['muon_access'], 'standby').printerBusy).toBe(false)
  })

  describe('mayDo with an answer that is not known yet', () => {
    const asked = (perms: Record<string, string>, manage: boolean | null, shared: boolean | null) => {
      resetGates()
      slug.current = 'p1'
      keep('perms', 'p1', perms)
      keep('manage', 'p1', manage)
      keep('shared', 'p1', shared)
      const vm = mountWith(['muon_access'])
      return vm.mayDo('plate_clear') as boolean
    }
    // Read before the mount's own (async) lookups can change the answers.
    it('an owner whose access lookup is unknown still may', () => {
      expect(asked({ plate_clear: 'owner' }, null, null)).toBe(true)
      expect(asked({ plate_clear: 'owner_at_printer' }, null, null)).toBe(true)
    })
    it('a member whose shared lookup is unknown still may use an owner_and_shared setting', () => {
      expect(asked({ plate_clear: 'owner_and_shared' }, false, null)).toBe(true)
    })
    it('a definite no still hides', () => {
      expect(asked({ plate_clear: 'owner' }, false, false)).toBe(false)
      expect(asked({ plate_clear: 'owner_and_shared' }, false, false)).toBe(false)
      expect(asked({ plate_clear: 'owner' }, true, null)).toBe(true)
    })
  })
})
