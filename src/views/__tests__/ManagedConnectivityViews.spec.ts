import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { managedConsoleState } from '@/store/managed/contractMock'
import { setManagedSessionBoundary } from '@/store/managed/sessionBoundary'

describe('managed connectivity placeholder views', () => {
  beforeEach(() => {
    managedConsoleState.session = null
    managedConsoleState.error = null
    setManagedSessionBoundary(null)
  })

  it('labels the fleet view as a contract mock without exposing a printer inventory', async () => {
    const { default: ManagedFleet } = await import('../ManagedFleet.vue')
    const wrapper = mount(ManagedFleet)

    expect(wrapper.get('[data-testid="managed-preview-status"]').text()).toContain('Contract mock')
    expect(wrapper.text()).toContain('Managed printer inventory is unavailable')
    expect(wrapper.find('[data-testid="local-printer"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="managed-account-action"]').attributes('disabled')).toBeDefined()
  })

  it('does not import Fluidd local instances into the managed fleet', async () => {
    const { default: ManagedFleet } = await import('../ManagedFleet.vue')
    const wrapper = mount(ManagedFleet, {
      mocks: {
        $store: {
          getters: {
            'config/getInstances': [{
              name: 'Walnut',
              apiUrl: 'http://walnut.local',
              socketUrl: 'ws://walnut.local/websocket',
              active: true,
              discovered: true
            }]
          }
        }
      }
    })

    expect(wrapper.text()).not.toContain('Walnut')
    expect(wrapper.find('[data-testid="local-printer"]').exists()).toBe(false)
  })

  it('keeps onboarding explicit about its preview-only state', async () => {
    const { default: ManagedOnboarding } = await import('../ManagedOnboarding.vue')
    const wrapper = mount(ManagedOnboarding)

    expect(wrapper.text()).toContain('This label exists only in browser memory')
    expect(wrapper.text()).toContain('It does not create an account or modify a printer')
    expect(wrapper.get('[data-testid="onboarding-action"]').exists()).toBe(true)
  })

  it('keeps managed discovery and pairing unavailable', async () => {
    const { default: ManagedPrinterLink } = await import('../ManagedPrinterLink.vue')
    const wrapper = mount(ManagedPrinterLink)

    expect(wrapper.text()).toContain('No discovery request, pairing request, approval flow, or printer connection is started')
    expect(wrapper.get('[data-testid="printer-link-action"]').attributes('disabled')).toBeDefined()
  })
})
