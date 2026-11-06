import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { getters } from '@/store/server/getters'
import MuonGatesMixin from '../muon-gates'

vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: vi.fn().mockResolvedValue({}) }) }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: { enabled: null }, refreshDevMode: vi.fn() }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))

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
})
