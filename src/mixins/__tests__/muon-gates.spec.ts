import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { devModeState } from '@/services/dev-mode/state'
import { ownerState } from '@/services/gates'
import { getters } from '@/store/server/getters'
import MuonGatesMixin from '../muon-gates'

vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: vi.fn() }) }))

function mountWith (components: string[], printerState = 'standby') {
  const Probe = Vue.extend({ mixins: [MuonGatesMixin as any], render: h => h('i') })
  const store = {
    getters: {
      'server/isMuonPrinter': (getters.isMuonPrinter as any)({ info: { components } }),
      'printer/getPrinterState': printerState
    }
  }
  return shallowMount(Probe, { mocks: { $store: store } }).vm as any
}

beforeEach(() => {
  devModeState.enabled = null
  ownerState.isOwner = null
})

describe('MuonGatesMixin', () => {
  it('isMuonPrinter follows the components', () => {
    expect(mountWith(['muon_access']).isMuonPrinter).toBe(true)
    expect(mountWith(['muon_protection']).isMuonPrinter).toBe(true)
    expect(mountWith(['file_manager']).isMuonPrinter).toBe(false)
  })

  it('devModeEnabled is true only when the printer said it is on', () => {
    devModeState.enabled = true
    expect(mountWith(['muon_access']).devModeEnabled).toBe(true)
    devModeState.enabled = false
    expect(mountWith(['muon_access']).devModeEnabled).toBe(false)
    devModeState.enabled = null
    expect(mountWith(['muon_access']).devModeEnabled).toBe(false)
  })

  it('isOwner is null on a non-Muon printer even if an earlier answer is held', () => {
    ownerState.isOwner = true
    expect(mountWith(['file_manager']).isOwner).toBeNull()
    expect(mountWith(['muon_access']).isOwner).toBe(true)
  })

  it('exposes the printing state for a move-or-heat-while-printing gate', () => {
    expect(mountWith(['muon_access'], 'printing').printerPrinting).toBe(true)
    expect(mountWith(['muon_access'], 'standby').printerBusy).toBe(false)
  })
})
