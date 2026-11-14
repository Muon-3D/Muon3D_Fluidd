import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const gate = vi.hoisted(() => ({ muon: true as boolean | null, dev: false }))
vi.mock('@/mixins/muon-gates', async () => {
  const { Component, Vue: V } = await import('vue-property-decorator')
  return {
    default: Component(class extends V {
      get isMuonPrinter () { return gate.muon }
      get devModeEnabled () { return gate.dev }
    })
  }
})
const post = vi.hoisted(() => vi.fn())
vi.mock('@/api/socketActions', () => ({ SocketActions: { machineTimelapseSetSettings: post } }))

const { default: TimelapseSettings } = await import('../TimelapseSettings.vue')
const { defaultWritableSettings } = await import('@/store/timelapse/state')

const mounted: Array<{ destroy: () => void }> = []
afterEach(() => { mounted.splice(0).forEach(w => w.destroy()); post.mockReset() })

function show ({ muon = true as boolean | null, dev = false, settings = {} as Record<string, unknown>, blocked = [] as string[] } = {}) {
  gate.muon = muon
  gate.dev = dev
  const all = { ...defaultWritableSettings(), parkhead: true, parkpos: 'custom', blockedsettings: blocked, ...settings }
  const $store = {
    state: { socket: { open: true } },
    getters: {
      'timelapse/getSettings': all,
      'timelapse/isBlockedSetting': (key: string) => blocked.includes(key),
      'webcams/getWebcams': [{ name: 'Top', uid: 'top', enabled: true }],
      'printer/getBedSize': undefined
    }
  }
  const wrapper = mount(TimelapseSettings as any, {
    mocks: { $store, $tc: (key: string) => key },
    stubs: {
      'v-select': { props: ['value', 'disabled', 'items'], template: '<select :disabled="disabled" />' },
      'locked-row': { props: ['label', 'reasonText'], template: '<div class="locked" :data-label="label" />' }
    }
  })
  mounted.push(wrapper)
  const locks = () => wrapper.findAll('.locked').wrappers.map(w => w.attributes('data-label'))
  const has = (tid: string) => wrapper.find(`[data-tid="${tid}"]`).exists()
  return { wrapper, locks, has }
}

describe('Settings › Timelapse', () => {
  it('on a Muon printer: parks at the Muon default, and the parking and G-code details are locked', () => {
    const s = show()
    expect(s.wrapper.get('[data-tid="timelapse-parkpos-muon"]').text()).toBe('Muon default')
    expect(s.has('timelapse-parkpos')).toBe(false)
    expect(s.locks()).toEqual(['Custom park position, Z-hop and park speed', 'Retract and push back while parked', 'Delay compensation and verbose G-code'])
    expect(s.has('timelapse-zhop')).toBe(false)
    expect(s.has('timelapse-delay')).toBe(false)
  })

  it('with developer mode on, and on any other printer, those are plain rows', () => {
    for (const s of [show({ dev: true }), show({ muon: false })]) {
      expect(s.locks()).toEqual([])
      expect(s.has('timelapse-parkpos')).toBe(true)
      expect(s.has('timelapse-zhop')).toBe(true)
      expect(s.has('timelapse-delay')).toBe(true)
      expect(s.has('timelapse-verbose')).toBe(true)
    }
    expect(show({ muon: false }).wrapper.get('[data-tid="timelapse-developer"]').text()).toContain('Parking and G-code')
  })

  it('Every 5 s hides parking', () => {
    const each = show({ muon: false })
    expect(each.has('timelapse-parkhead-row')).toBe(true)
    const every = show({ muon: false, settings: { mode: 'hyperlapse', hyperlapse_cycle: 5 } })
    expect(every.wrapper.get('[data-tid="timelapse-mode"]').text()).toContain('Every 5 s')
    expect(every.has('timelapse-parkhead-row')).toBe(false)
    expect(every.has('timelapse-parkpos-row')).toBe(false)
    expect(every.has('timelapse-cycle')).toBe(true)
  })

  it('keeps what moonraker.conf sets visible but unchangeable', () => {
    const s = show({ blocked: ['camera', 'enabled'] })
    expect(s.wrapper.get('[data-tid="timelapse-camera"] select').attributes('disabled')).toBe('disabled')
    expect(s.wrapper.get('[data-tid="timelapse-setting-enabled"]').attributes('disabled')).toBe('disabled')
    expect(s.wrapper.text()).toContain('Set in moonraker.conf')
  })

  it('writes the length and quality choices as render settings', async () => {
    const s = show({ settings: { variable_fps: false, output_framerate: 30, constant_rate_factor: 23 } })
    const length = s.wrapper.get('[data-tid="timelapse-length"]')
    expect(length.find('[aria-checked="true"]').text()).toBe('Every frame at 30 fps')
    await length.findAll('button').at(1).trigger('click')
    expect(post).toHaveBeenLastCalledWith({ variable_fps: true, targetlength: 20 })
    const quality = s.wrapper.get('[data-tid="timelapse-quality"]')
    expect(quality.find('[aria-checked="true"]').text()).toBe('Balanced')
    await quality.findAll('button').at(2).trigger('click')
    expect(post).toHaveBeenLastCalledWith({ constant_rate_factor: 18 })
  })

  it('resets everything except what moonraker.conf sets', async () => {
    const s = show({ blocked: ['camera'] })
    await s.wrapper.get('[data-tid="timelapse-reset"]').trigger('click')
    const sent = post.mock.calls[0][0]
    expect(sent).not.toHaveProperty('camera')
    expect(sent).toHaveProperty('enabled')
  })
})
