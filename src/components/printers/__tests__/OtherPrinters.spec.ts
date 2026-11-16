import Vue from 'vue'
import Vuetify from 'vuetify'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import OtherPrinters from '../OtherPrinters.vue'

Vue.use(Vuetify)

const tile = {
  key: 'foreign:garden',
  name: 'Garden Printer',
  state: 'ready',
  tone: 'ok',
  label: 'Ready',
  detail: 'Ready',
  entry: {
    host: '192.168.1.26',
    foreign: { record: { id: 'garden', kind: 'octoprint', name: 'Garden Printer', host: '192.168.1.26', via: 'direct', formFactor: 'bed-slinger' }, status: null }
  }
} as never

let wrapper: ReturnType<typeof mount> | null = null
afterEach(() => {
  wrapper?.destroy()
  wrapper = null
  document.body.innerHTML = ''
})

describe('the other-brand printers list, with the real menu', () => {
  it('opens a printer from its row', async () => {
    const app = document.createElement('div')
    app.setAttribute('data-app', 'true')
    document.body.appendChild(app)
    wrapper = mount(OtherPrinters, { vuetify: new Vuetify(), attachTo: app, propsData: { tiles: [tile] }, stubs: { 'frame-icon': true } })
    await wrapper.find('article').trigger('click')
    expect(wrapper.emitted('open')![0]).toEqual([tile])
    expect(wrapper.text()).toContain('Garden Printer')
  })

  it('asks to forget only after the Options menu is opened and Forget is clicked, and does not open the printer', async () => {
    const app = document.createElement('div')
    app.setAttribute('data-app', 'true')
    document.body.appendChild(app)
    wrapper = mount(OtherPrinters, { vuetify: new Vuetify(), attachTo: app, propsData: { tiles: [tile] }, stubs: { 'frame-icon': true } })
    expect(wrapper.emitted('forget')).toBeUndefined()
    await wrapper.find('button[aria-label="Options for Garden Printer"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))
    const forget = [...document.querySelectorAll<HTMLElement>('.v-list-item')].find(e => e.textContent?.trim() === 'Forget')
    expect(forget).toBeDefined()
    expect(wrapper.emitted('forget')).toBeUndefined()
    forget!.click()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(wrapper.emitted('forget')![0]).toEqual([tile])
    expect(wrapper.emitted('open')).toBeUndefined()
  })
})
