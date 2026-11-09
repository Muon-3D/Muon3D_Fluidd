import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cloud = vi.hoisted(() => ({ state: { account: null as null | { id: string }, ready: true } }))

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: cloud.state }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { name: 'CloudAccountDialog', render: (h: any) => h('div', { attrs: { 'data-tid': 'account-dialog' } }) } }))
vi.mock('@/components/muon-cloud/LinkPrinterDialog.vue', () => ({
  default: { name: 'LinkPrinterDialog', props: ['initialCode', 'value'], render (this: any, h: any) { return h('div', { attrs: { 'data-tid': 'link-dialog', 'data-code': this.initialCode } }) } }
}))

// eslint-disable-next-line import/first
import LinkLanding from '../LinkLanding.vue'

function open (code: string | undefined = '472913') {
  const push = vi.fn()
  const wrapper = mount(LinkLanding, {
    stubs: { FrameIcon: true, VOtpInput: { props: ['value'], render (this: any, h: any) { return h('input', { attrs: { 'data-tid': 'link-code', value: this.value } }) } } },
    mocks: { $route: { query: { code } }, $router: { push } }
  })
  return { wrapper, push }
}

const tid = (wrapper: ReturnType<typeof open>['wrapper'], id: string) => wrapper.find(`[data-tid="${id}"]`)

beforeEach(() => {
  cloud.state.account = { id: 'a1' }
  cloud.state.ready = true
})

describe('the link page', () => {
  it('is one card with the code from the link in the boxes, and links nothing until pressed', async () => {
    const { wrapper } = open()
    expect(wrapper.find('h1').text()).toBe('Link a printer')
    expect((wrapper.vm as any).draft).toBe('472913')
    expect(tid(wrapper, 'link-dialog').exists()).toBe(false)

    await tid(wrapper, 'link-button').trigger('click')
    expect(tid(wrapper, 'link-dialog').attributes('data-code')).toBe('472913')
  })

  it('keeps Link printer off until six digits are in', async () => {
    const { wrapper } = open('47')
    expect(tid(wrapper, 'link-button').attributes('disabled')).toBe('disabled')
    await tid(wrapper, 'link-button').trigger('click')
    expect(tid(wrapper, 'link-dialog').exists()).toBe(false)
  })

  it('finds a printer nearby with no code, in the existing dialog', async () => {
    const { wrapper } = open(undefined)
    await tid(wrapper, 'link-nearby').trigger('click')
    expect(tid(wrapper, 'link-dialog').attributes('data-code')).toBe('')
  })

  it('asks a signed-out person to sign in, and offers no code boxes', async () => {
    cloud.state.account = null
    const { wrapper } = open()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-tid="landing-sub"]').text()).toContain('472913')
    expect(tid(wrapper, 'link-code').exists()).toBe(false)
    expect(tid(wrapper, 'link-button').exists()).toBe(false)
    expect(tid(wrapper, 'account-dialog').exists()).toBe(true)
  })

  it('goes back to the printers when the link dialog closes', async () => {
    const { wrapper, push } = open()
    await tid(wrapper, 'link-button').trigger('click')
    ;(wrapper.vm as any).linkDialog = false
    await wrapper.vm.$nextTick()
    expect(push).toHaveBeenCalledWith('/')
  })
})
