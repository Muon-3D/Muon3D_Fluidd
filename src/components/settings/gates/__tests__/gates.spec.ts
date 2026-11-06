import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ownerState } from '@/services/gates'

const caps = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: caps }) }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))

const { default: LockedRow } = await import('../LockedRow.vue')
const { default: OwnerOnly } = await import('../OwnerOnly.vue')

const localVue = createLocalVue()
localVue.use(VueRouter)

const settle = () => new Promise(resolve => setTimeout(resolve))

beforeEach(() => {
  ownerState.isOwner = null
  ownerState.checking = false
  caps.mockReset()
  caps.mockResolvedValue({})
})

describe('LockedRow', () => {
  function row (props: Record<string, unknown> = {}) {
    const router = new VueRouter({ mode: 'abstract' })
    return mount(LockedRow as any, {
      localVue,
      router,
      propsData: { label: 'Edit macros', ...props },
      stubs: { FrameIcon: { props: ['name'], template: '<i :data-icon="name" />' } }
    })
  }

  it('shows the lock, the label and the default reason', () => {
    const w = row()
    expect(w.find('[data-icon="lock"]').exists()).toBe(true)
    expect(w.find('[data-tid="locked-row-label"]').text()).toBe('Edit macros')
    expect(w.find('[data-tid="locked-row-reason"]').text()).toBe('Needs developer mode')
  })

  it('shows a given reason', () => {
    expect(row({ reason: 'Needs a Muon printer' }).find('[data-tid="locked-row-reason"]').text()).toBe('Needs a Muon printer')
  })

  it('a tap goes to Settings > Developer mode', async () => {
    const w = row()
    await w.find('[data-tid="locked-row"]').trigger('click')
    expect(w.vm.$route.path).toBe('/settings')
    expect(w.vm.$route.hash).toBe('#developer')
  })
})

describe('OwnerOnly', () => {
  function gate (components: string[], props: Record<string, unknown> = {}) {
    return mount(OwnerOnly as any, {
      propsData: props,
      slots: { default: '<button data-tid="secret">Danger</button>' },
      mocks: {
        $store: {
          getters: {
            'server/isMuonPrinter': components.some(c => c.startsWith('muon_')),
            'server/componentSupport': (c: string) => components.includes(c),
            'printer/getPrinterState': 'standby'
          }
        }
      }
    })
  }

  it('shows its content to the owner', async () => {
    caps.mockResolvedValue({ protection: 'allowed' })
    const w = gate(['muon_access'])
    await settle()
    expect(w.find('[data-tid="secret"]').exists()).toBe(true)
  })

  it('renders nothing for a member (not greyed)', async () => {
    caps.mockResolvedValue({ protection: 'ask' })
    const w = gate(['muon_access'])
    await settle()
    expect(w.html()).toBe('')
    expect(w.find('[data-tid="secret"]').exists()).toBe(false)
  })

  it('renders nothing for a viewer', async () => {
    caps.mockResolvedValue({ protection: 'refused' })
    const w = gate(['muon_access'])
    await settle()
    expect(w.find('[data-tid="secret"]').exists()).toBe(false)
  })

  it('hides when ownership is unknown, by default', async () => {
    caps.mockRejectedValue(new Error('offline'))
    const w = gate(['muon_access'])
    await settle()
    expect(w.find('[data-tid="secret"]').exists()).toBe(false)
  })

  it('on a non-Muon printer it asks nothing and hides, or shows with unknown="show"', () => {
    expect(gate(['file_manager']).find('[data-tid="secret"]').exists()).toBe(false)
    expect(gate(['file_manager'], { unknown: 'show' }).find('[data-tid="secret"]').exists()).toBe(true)
    expect(caps).not.toHaveBeenCalled()
  })
})
