import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LandingCard from '../LandingCard.vue'

const open = (propsData: Record<string, unknown>, slots: Record<string, string> = {}) =>
  mount(LandingCard, { propsData, slots, stubs: { FrameIcon: true } })

describe('LandingCard', () => {
  it('is one titled region: icon square, title, one muted line, body and foot', () => {
    const wrapper = open({ title: 'Link a printer', sub: 'Type the code.', icon: 'link' }, { default: '<p>body</p>', foot: '<button>Go</button>' })
    const card = wrapper.find('[data-tid="landing-card"]')
    const title = wrapper.find('h1')
    expect(card.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(title.text()).toBe('Link a printer')
    expect(wrapper.find('[data-tid="landing-sub"]').text()).toBe('Type the code.')
    expect(wrapper.find('[data-tid="landing-icon"]').classes()).toContain('landing-card__icon--accent')
    expect(wrapper.find('.landing-card__body').text()).toBe('body')
    expect(wrapper.find('.landing-card__foot button').text()).toBe('Go')
  })

  it('leaves out what it was not given, and tints the icon by tone', () => {
    const wrapper = open({ title: 'Gone', icon: 'alert', tone: 'danger' })
    expect(wrapper.find('[data-tid="landing-sub"]').exists()).toBe(false)
    expect(wrapper.find('.landing-card__body').exists()).toBe(false)
    expect(wrapper.find('.landing-card__foot').exists()).toBe(false)
    expect(wrapper.find('[data-tid="landing-icon"]').classes()).toContain('landing-card__icon--danger')
  })

  it('gives each card its own title id', () => {
    const a = open({ title: 'A' })
    const b = open({ title: 'B' })
    expect(a.find('h1').attributes('id')).not.toBe(b.find('h1').attributes('id'))
  })
})
