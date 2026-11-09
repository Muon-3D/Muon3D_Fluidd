import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NotFound from '../NotFound.vue'

describe('NotFound', () => {
  it('is the empty-state card, with a way back to the printers', () => {
    const wrapper = mount(NotFound, { stubs: { RouterLink: RouterLinkStub, FrameIcon: true } })
    expect(wrapper.find('h1').text()).toBe("That page isn't here")
    expect(wrapper.text()).toContain('Your printers are fine.')
    const back = wrapper.findComponent(RouterLinkStub)
    expect(back.props('to')).toBe('/')
    expect(back.text()).toBe('Back to printers')
  })
})
