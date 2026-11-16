import Vue from 'vue'
import Vuetify from 'vuetify'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FilesActions from '../FilesActions.vue'
import { filesView } from '@/services/files/view'

Vue.use(Vuetify)

describe('FilesActions', () => {
  it('offers Config files and Other files, with the page state on', async () => {
    filesView.pane = 'config'
    const wrapper = mount(FilesActions)
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.wrappers.map(r => r.text())).toEqual(['Config files', 'Other files'])
    expect(radios.at(0).attributes('aria-checked')).toBe('true')
    await radios.at(1).trigger('click')
    expect(filesView.pane).toBe('other')
    expect(wrapper.findAll('[role="radio"]').at(1).attributes('aria-checked')).toBe('true')
    wrapper.destroy()
  })
})
