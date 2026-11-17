import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JobPicture from '../JobPicture.vue'
import { clearRemoteThumbnails, remoteJobThumbnail, thumbnailKey, MAX_READING } from '@/services/jobs/thumbnail'

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

  it('drops its read from the queue when it is destroyed before its turn', async () => {
    const release: Array<() => void> = []
    const read = vi.fn(() => new Promise<Blob>(resolve => release.push(() => resolve(new Blob(['x'])))))
    for (let i = 0; i < MAX_READING + 1; i++) remoteJobThumbnail('p', `/q${i}.png`, 1, read)
    const w = mount(JobPicture, { propsData: { src: '', thumbKey: thumbnailKey('p', `/q${MAX_READING}.png`, 1) }, stubs: { 'frame-icon': true } })
    w.destroy()
    release.splice(0).forEach(r => r())
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(read).toHaveBeenCalledTimes(MAX_READING)
    release.splice(0).forEach(r => r())
  })
})

afterEach(() => clearRemoteThumbnails())
