import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PhotoFace from '../PhotoFace.vue'

describe('PhotoFace', () => {
  it('shows the photo when there is one, and the letter when there is not', () => {
    const withPhoto = mount(PhotoFace, { propsData: { photo: 'blob:x/1', letter: 'J' } })
    expect(withPhoto.find('img').attributes('src')).toBe('blob:x/1')
    expect(withPhoto.text()).toBe('')
    const without = mount(PhotoFace, { propsData: { photo: null, letter: 'J' } })
    expect(without.find('img').exists()).toBe(false)
    expect(without.text()).toBe('J')
  })

  it('falls back to the letter when the photo fails (a public photo that 404s), and tries a new photo', async () => {
    const w = mount(PhotoFace, { propsData: { photo: 'https://m/v1/public/avatars/a', letter: 'K' } })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toBe('K')
    await w.setProps({ photo: 'https://m/v1/public/avatars/b' })
    expect(w.find('img').attributes('src')).toBe('https://m/v1/public/avatars/b')
  })
})
