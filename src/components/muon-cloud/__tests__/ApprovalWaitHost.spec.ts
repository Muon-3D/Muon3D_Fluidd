import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { activationState } from '@/services/muon-cloud/activate'

const activate = vi.hoisted(() => ({ activateCloudPrinter: vi.fn(async () => {}) }))
vi.mock('@/services/muon-cloud/activate', async importOriginal => ({ ...(await importOriginal<object>()), ...activate }))
vi.mock('@/services/muon-cloud/state', () => ({ printerName: (id: string) => id === 'walnut' ? 'Walnut 8987' : id }))

const { default: Host } = await import('../ApprovalWaitHost.vue')

const watch = () => ({ pending: new Promise<string>(() => {}), outcome: new Promise<never>(() => {}), cancel: vi.fn() })

afterEach(() => {
  activationState.approval = null
  activationState.approvalFor = null
  activate.activateCloudPrinter.mockClear()
})

describe('the wait for approval, on any page (I-170, KAN-1374)', () => {
  it('shows nothing until a printer holds this browser, then the dialog for that printer', async () => {
    const w = shallowMount(Host)
    expect(w.find('approval-wait-dialog-stub').exists()).toBe(false)
    activationState.approvalFor = 'walnut'
    activationState.approval = watch()
    await w.vm.$nextTick()
    const dialog = w.find('approval-wait-dialog-stub')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('printername')).toBe('Walnut 8987')
    w.destroy()
  })

  it('Try again dials the same printer again and clears the old wait', async () => {
    activationState.approvalFor = 'walnut'
    activationState.approval = watch()
    const w = shallowMount(Host)
    ;(w.vm as any).retry()
    expect(activationState.approval).toBeNull()
    expect(activate.activateCloudPrinter).toHaveBeenCalledWith('walnut')
    w.destroy()
  })
})
