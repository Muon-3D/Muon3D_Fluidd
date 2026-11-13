import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PermissionRefusalNotice from '../PermissionRefusalNotice.vue'
import { cloudState } from '@/services/muon-cloud/state'

const gate = vi.hoisted(() => ({ manage: null as boolean | null }))
vi.mock('@/mixins/muon-gates', async () => {
  const Vue = (await vi.importActual<typeof import('vue')>('vue')).default
  return { default: Vue.extend({ computed: { canManageAccess: () => gate.manage } }) }
})

const owner = { kind: 'permission' as const, knob: 'wifi_change', required: 'owner', allowed: ['owner'], message: '' }
const shared = { ...owner, required: 'owner_and_shared' }

const mountIt = (refusal: typeof owner | null) => shallowMount(PermissionRefusalNotice, {
  propsData: { refusal },
  stubs: { 'router-link': { template: '<a data-tid="permission-refusal-change"><slot /></a>' } }
})

afterEach(() => {
  cloudState.account = null
  gate.manage = null
})

describe('PermissionRefusalNotice (KAN-2457)', () => {
  it('only the printer itself allowed (owner_at_printer): offers only the printer’s screen, not Bluetooth or Muon3D', () => {
    const atPrinter = { ...owner, required: 'owner_at_printer', allowed: ['owner_at_printer'] }
    const w = mountIt(atPrinter)
    const instead = w.find('[data-tid="permission-refusal-instead"]').text()
    expect(instead).toContain("printer's screen")
    expect(instead).not.toMatch(/Bluetooth|Muon3D/)
    w.destroy()
    const other = mountIt(shared)
    expect(other.find('[data-tid="permission-refusal-instead"]').text()).toMatch(/Bluetooth/)
    other.destroy()
  })

  it('shows nothing without a refusal', () => {
    expect(mountIt(null).find('[data-tid="permission-refusal"]').exists()).toBe(false)
  })

  it('signed out: says who may, and offers Sign in only', () => {
    const w = mountIt(shared)
    expect(w.find('[data-tid="permission-refusal-text"]').text()).toContain("this browser isn't signed in")
    expect(w.find('[data-tid="permission-refusal-sign-in"]').exists()).toBe(true)
    expect(w.find('[data-tid="permission-refusal-change"]').exists()).toBe(false)
  })

  it('signed in and may manage access: offers Change who can do this, not Sign in', () => {
    cloudState.account = { email: 'a@b.c' } as never
    gate.manage = true
    const w = mountIt(owner)
    expect(w.find('[data-tid="permission-refusal-text"]').text()).toBe("Only this printer's owner can do this.")
    expect(w.find('[data-tid="permission-refusal-sign-in"]').exists()).toBe(false)
    expect(w.find('[data-tid="permission-refusal-change"]').exists()).toBe(true)
  })

  it('signed in and may not manage access: offers no action', () => {
    cloudState.account = { email: 'a@b.c' } as never
    gate.manage = false
    const w = mountIt(owner)
    expect(w.find('[data-tid="permission-refusal-sign-in"]').exists()).toBe(false)
    expect(w.find('[data-tid="permission-refusal-change"]').exists()).toBe(false)
  })
})
