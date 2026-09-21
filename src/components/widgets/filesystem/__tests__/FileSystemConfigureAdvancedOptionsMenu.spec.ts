import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  getDevModeStatusDevModeGet: vi.fn(),
  getDevModeWaiverDevModeWaiverGet: vi.fn(),
  openDevModeConsentDevModeConsentPost: vi.fn(),
  getDevModeConsentDevModeConsentChallengeIdGet: vi.fn(),
  setDevModeDevModePost: vi.fn(),
  refreshDevModeConfigDevModeRefreshPost: vi.fn(),
  manualBackupDevModeBackupPost: vi.fn()
}))

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({ devMode: api })
}))

// The mock must be registered before the component captures useAuxApi().
// eslint-disable-next-line import/first
import FileSystemConfigureAdvancedOptionsMenu from '../FileSystemConfigureAdvancedOptionsMenu.vue'

function component () {
  const vm = new (FileSystemConfigureAdvancedOptionsMenu as any)()
  vm.canManage = true
  return vm
}

describe('developer mode guard policy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.setDevModeDevModePost.mockResolvedValue({ data: { enabled: true } })
    api.getDevModeStatusDevModeGet.mockResolvedValue({
      data: { enabled: false, core_cfg: '/oem/core.cfg', guard_armed: false }
    })
  })

  it('enables directly when the printer reports that the guard is disarmed', async () => {
    const vm = component()
    await vm.updateDevMode()

    await vm.devModeClick()

    expect(api.setDevModeDevModePost).toHaveBeenCalledWith({ enabled: true })
    expect(api.openDevModeConsentDevModeConsentPost).not.toHaveBeenCalled()
    expect(vm.confirmDialog).toBe(false)
  })

  it('keeps the guarded ceremony for an armed production image', async () => {
    const vm = component()
    vm.guardArmed = true
    api.getDevModeWaiverDevModeWaiverGet.mockResolvedValue({
      data: { version: 'armed-1', text: 'Production waiver' }
    })

    await vm.devModeClick()

    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()
    expect(api.getDevModeWaiverDevModeWaiverGet).toHaveBeenCalledOnce()
    expect(vm.confirmDialog).toBe(true)
  })
})
