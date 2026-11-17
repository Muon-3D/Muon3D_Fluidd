import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadProgress from '../UploadProgress.vue'
import { Filters } from '@/plugins/filters'

function panel (uploads: unknown[]) {
  return mount(UploadProgress, { mocks: { $store: { state: { files: { uploads } } }, $filters: Filters } })
}

describe('UploadProgress', () => {
  it('has no panel without an upload or after cancellation', () => {
    for (const uploads of [[], [{ cancelled: true }]]) {
      const wrapper = panel(uploads)
      expect(wrapper.find('section').exists()).toBe(false)
      wrapper.destroy()
    }
  })

  it('shows the filename, real bytes and percentage, including an empty file', () => {
    for (const [loaded, size, percent] of [[512, 1024, 50], [0, 0, 0]]) {
      const wrapper = panel([{ filepath: 'parts/test.gcode', loaded, size, percent }])
      expect(wrapper.text()).toContain('parts/test.gcode')
      expect(wrapper.find('progress').attributes('value')).toBe(String(percent))
      expect(wrapper.find('[role=status]').text()).toContain(`${percent}%`)
      expect(wrapper.text()).toContain(Filters.getReadableFileSizeString(size))
      wrapper.destroy()
    }
  })

  it('does not call byte completion a saved file', () => {
    const wrapper = panel([{ filepath: 'test.gcode', loaded: 1024, size: 1024, percent: 100 }])
    expect(wrapper.text()).toContain('Verifying and saving…')
    wrapper.destroy()
  })
})
