import { enableAutoDestroy, mount } from '@vue/test-utils'
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OwnerHotspotRemote from '../OwnerHotspotRemote.vue'
import { resetOwnerNetwork, detectOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import { HOTSPOT_POLL_MS } from '@/services/muon-cloud/ownerNetwork'
import { FakeOwnerPrinter } from './fakeOwnerPrinter'

const hotspot = vi.hoisted(() => ({ value: false }))
vi.mock('@/aux_api/useHotspotCheck', () => ({ useHotspotCheck: () => ({ onHotspot: hotspot }) }))

let printer: FakeOwnerPrinter
enableAutoDestroy(afterEach)

/** Let the pending requests answer and the page redraw, with the clock faked. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0)
}
const tid = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-tid=${id}]`)

async function open (path = 'local') {
  printer.path = path
  await detectOwnerNetwork()
  return mount(OwnerHotspotRemote)
}

async function ask (w: ReturnType<typeof mount>, fields: { ssid?: string, password?: string, generate?: boolean }) {
  if (fields.ssid !== undefined) await tid(w, 'owner-hotspot-ssid').setValue(fields.ssid)
  if (fields.generate) await tid(w, 'owner-hotspot-generate').setChecked(true)
  if (fields.password !== undefined) await tid(w, 'owner-hotspot-password').setValue(fields.password)
  await w.find('form').trigger('submit')
  await settle()
}

beforeEach(() => {
  vi.useFakeTimers()
  printer = new FakeOwnerPrinter()
  hotspot.value = false
  resetOwnerNetwork()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request: printer.request }
})
afterEach(() => { vi.useRealTimers() })

describe('owner hotspot change over the printer connection', () => {
  it('asks, says "Press the knob on the printer to approve", then reports the outcome', async () => {
    const w = await open()
    await ask(w, { ssid: 'Muon-Lab', password: 'correct horse' })
    expect(tid(w, 'owner-hotspot-warning').text()).toContain('Nothing changes until someone presses the knob')
    expect(printer.sent('POST', '/hotspot/change')).toHaveLength(0)

    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    expect(printer.sent('POST', '/hotspot/change')[0].data).toEqual({ ssid: 'Muon-Lab', password: 'correct horse' })
    expect(tid(w, 'owner-hotspot-waiting').text()).toContain('Press the knob on the printer to approve.')
    expect(w.html()).not.toContain('correct horse')

    // waiting first, then applied.
    await vi.advanceTimersByTimeAsync(HOTSPOT_POLL_MS)
    expect(tid(w, 'owner-hotspot-waiting').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(HOTSPOT_POLL_MS)
    expect(printer.sent('GET', '/hotspot/change/chg_0123456789abcdef').length).toBeGreaterThanOrEqual(2)
    expect(tid(w, 'owner-hotspot-waiting').exists()).toBe(false)
    expect(tid(w, 'owner-hotspot-outcome').text()).toBe('The hotspot has its new name and password.')
  })

  it.each([
    ['refused', 'Someone at the printer said no, so nothing changed.'],
    ['expired', 'Nobody approved it in time, so nothing changed. Ask again when someone is at the printer.'],
    ['failed', "The printer approved it but couldn't switch the hotspot over. Check it at the printer."]
  ])('says what %s means', async (state, words) => {
    printer.changeStates = [state]
    const w = await open()
    await ask(w, { generate: true })
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    await vi.advanceTimersByTimeAsync(HOTSPOT_POLL_MS)
    expect(tid(w, 'owner-hotspot-outcome').text()).toBe(words)
  })

  it('can ask the printer to make the password: sends generate, no password', async () => {
    const w = await open()
    await ask(w, { generate: true })
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    expect(printer.sent('POST', '/hotspot/change')[0].data).toEqual({ generate: true })
  })

  it('refuses a bad name or password before sending anything', async () => {
    const w = await open()
    await tid(w, 'owner-hotspot-ssid').setValue('Home')
    expect(tid(w, 'owner-hotspot-ssid-problem').text()).toContain('Muon-')
    expect(tid(w, 'owner-hotspot-ask').attributes('disabled')).toBeDefined()
    await tid(w, 'owner-hotspot-ssid').setValue('Muon-Lab')
    await tid(w, 'owner-hotspot-password').setValue('short')
    expect(tid(w, 'owner-hotspot-password-problem').text()).toContain('at least 8')
    expect(tid(w, 'owner-hotspot-ask').attributes('disabled')).toBeDefined()
    expect(printer.sent('POST', '/hotspot/change')).toHaveLength(0)
  })

  it('does nothing for an empty form', async () => {
    const w = await open()
    expect(tid(w, 'owner-hotspot-ask').attributes('disabled')).toBeDefined()
  })

  it('while on the hotspot it always warns that the page will disconnect', async () => {
    hotspot.value = true
    const w = await open('local')
    await ask(w, { ssid: 'Muon-Lab' })
    expect(w.find('.ohr__confirm--warn').exists()).toBe(true)
    expect(tid(w, 'owner-hotspot-warning').text()).toContain('will disconnect this page')
  })

  it('over the internet with reauth, shows "Sign in again required"', async () => {
    const w = await open('relay')
    await ask(w, { ssid: 'Muon-Lab' })
    printer.refuseAll = { status: 403, data: { error: 'reauth_required' } }
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    expect(tid(w, 'owner-hotspot-notice').text()).toBe('Sign in again required to change the hotspot over the internet.')
    expect(tid(w, 'owner-hotspot-ask').exists()).toBe(false)
  })

  it('with the path blocked, shows "Blocked in your network settings"', async () => {
    const w = await open('local')
    await ask(w, { ssid: 'Muon-Lab' })
    printer.refuseAll = { status: 403, data: { error: 'path_disabled' } }
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    expect(tid(w, 'owner-hotspot-notice').text()).toBe('Blocked in your network settings.')
  })

  it('shows the printer\'s own words when it refuses the change', async () => {
    const w = await open()
    await ask(w, { ssid: 'Muon-Lab' })
    printer.refuseAll = { status: 429, data: { detail: 'Too many confirmations are waiting at the printer.' } }
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    expect(tid(w, 'owner-hotspot-error').text()).toBe('Too many confirmations are waiting at the printer.')
  })

  it('keeps asking through a slow printer, and stops when the card goes away', async () => {
    printer.changeStates = ['waiting']
    const w = await open()
    await ask(w, { generate: true })
    await tid(w, 'owner-hotspot-proceed').trigger('click')
    await settle()
    printer.refuseAll = { status: 504, data: { error: 'aux_timeout' } }
    await vi.advanceTimersByTimeAsync(HOTSPOT_POLL_MS * 2)
    expect(tid(w, 'owner-hotspot-waiting').exists()).toBe(true)
    const before = printer.calls.length
    w.destroy()
    await vi.advanceTimersByTimeAsync(HOTSPOT_POLL_MS * 3)
    expect(printer.calls.length).toBe(before)
  })
})
