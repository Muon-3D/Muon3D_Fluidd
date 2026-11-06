import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JobPicture from '../JobPicture.vue'

const mountIt = (src: string) => mount(JobPicture, { propsData: { src }, stubs: { 'frame-icon': { template: '<svg class="frame-icon" />' } } })

describe('JobPicture', () => {
  it('shows the thumbnail when there is one', () => {
    const w = mountIt('/server/files/gcodes/.thumbs/a-300x300.png')
    expect(w.find('img').attributes('src')).toBe('/server/files/gcodes/.thumbs/a-300x300.png')
    expect(w.attributes('data-state')).toBe('image')
    w.destroy()
  })

  it('shows the placeholder, not an empty box, when the file has no thumbnail', () => {
    const w = mountIt('')
    expect(w.find('img').exists()).toBe(false)
    expect(w.attributes('data-state')).toBe('placeholder')
    w.destroy()
  })

  it('falls back to the placeholder when the thumbnail will not load', async () => {
    const w = mountIt('/gone.png')
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.attributes('data-state')).toBe('placeholder')
    w.destroy()
  })

  it('tries a new address afresh after one failed', async () => {
    const w = mountIt('/gone.png')
    await w.find('img').trigger('error')
    await w.setProps({ src: '/new.png' })
    expect(w.find('img').attributes('src')).toBe('/new.png')
    w.destroy()
  })
})
