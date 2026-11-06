import { afterEach, describe, expect, it, vi } from 'vitest'
import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Vue from 'vue'
import VueRouter from 'vue-router'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import store from '@/store'

const live = vi.hoisted(() => ({
  liveForeign: { records: [], status: {} },
  loadForeign: vi.fn(async () => {}),
  connectAll: vi.fn(async () => {}),
  forget: vi.fn(async () => {})
}))
vi.mock('@/services/foreign-printers/live', () => live)

const { default: Printers } = await import('../Printers.vue')

const record: ForeignPrinterRecord = {
  id: 'foreign-forget-test',
  kind: 'octoprint',
  name: 'Garden Printer',
  host: '192.168.1.26',
  via: 'direct',
  formFactor: 'bed-slinger',
  credentialsRef: null,
  addedAt: 0
}

afterEach(() => {
  live.forget.mockClear()
})

Vue.use(Vuetify)

describe('Printers foreign cards', () => {
  it('forgets a printer from the Other printers list after confirmation', async () => {
    const confirm = vi.fn(async () => true)
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({ mode: 'abstract', routes: [] })
    const tile = {
      key: `foreign:${record.id}`,
      name: record.name,
      label: 'Ready',
      tone: 'off',
      state: 'ready',
      detail: 'Ready',
      entry: { key: `foreign:${record.id}`, name: record.name, foreign: { record, status: null } }
    }
    const app = document.createElement('div')
    app.setAttribute('data-app', 'true')
    document.body.appendChild(app)
    const wrapper = mount(Printers, {
      localVue,
      router,
      vuetify: new Vuetify(),
      attachTo: app,
      computed: {
        page: () => ({ welcome: false, other: [tile], offline: [], groups: [], found: [], cloud: [], local: [], printingNow: [], counts: { printers: 1, printing: 0, ready: 0, needsYou: 0, offline: 0, found: 0 } }),
        isMobileViewport: () => false
      },
      mocks: { $confirm: confirm, $store: store },
      stubs: { 'router-link': true, 'frame-icon': true, 'deletion-notice': true }
    })

    // The real menu: open Options, click Forget. The page confirms, then forgets.
    await wrapper.find('button[aria-label="Options for Garden Printer"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))
    const forget = [...document.querySelectorAll<HTMLElement>('.v-list-item')].find(e => e.textContent?.trim() === 'Forget')
    expect(forget).toBeDefined()
    expect(confirm).not.toHaveBeenCalled()
    forget!.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(confirm).toHaveBeenCalled()
    expect(live.forget).toHaveBeenCalledWith(record.id)
    wrapper.destroy()
    document.body.innerHTML = ''
  })
})
