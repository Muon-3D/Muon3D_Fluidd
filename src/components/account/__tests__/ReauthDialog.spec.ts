import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReauthDialog from '../ReauthDialog.vue'

function open (hasPassword = true) {
  return mount(ReauthDialog, {
    propsData: { value: true, hasPassword, twoStep: true, hasPasskey: true },
    stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } }
  })
}

describe('confirmation on console ee19200', () => {
  it('keeps password and code available beside passkey confirmation', async () => {
    const w = open()
    expect(w.find('[data-tid="reauth-passkey"]').exists()).toBe(true)
    await w.find('[data-tid="reauth-password"]').setValue('test password')
    await w.find('[data-tid="reauth-code"]').setValue('ABCD 1234')
    await w.find('[data-tid="reauth-submit"]').trigger('click')
    expect(w.emitted('submit')?.[0]).toEqual([{ password: 'test password', code: 'ABCD1234' }])
    w.destroy()
  })
  it('offers confirmation to a passkey-only account', () => {
    const w = open(false)
    expect(w.find('[data-tid="reauth-passkey"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Sign out and sign in again')
    expect(w.find('[data-tid="reauth-password"]').exists()).toBe(false)
    w.destroy()
  })
  it('associates a refusal with both confirmation fields', () => {
    const w = mount(ReauthDialog, {
      propsData: { value: true, hasPassword: true, twoStep: true, error: 'That code is not right.' },
      stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } }
    })
    const alert = w.find('[role="alert"]')
    expect(alert.attributes('id')).toBeTruthy()
    expect(w.find('[data-tid="reauth-password"]').attributes('aria-describedby')).toBe(alert.attributes('id'))
    expect(w.find('[data-tid="reauth-code"]').attributes('aria-describedby')).toBe(alert.attributes('id'))
  })
  it('shows request rows exactly as given, in a list, with a note', () => {
    const long = `DELETE /v1/fleet/printers/${'a-very-long-path-segment/'.repeat(6)}  trailing  `
    const w = mount(ReauthDialog, {
      propsData: {
        value: true,
        hasPasskey: true,
        hasPassword: false,
        passkeyOnly: true,
        note: 'This lasts 60 seconds.',
        rows: [{ label: 'Request', value: long, mono: true }, { label: 'Role', value: 'admin' }]
      },
      stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } }
    })
    const rows = w.find('[data-tid="reauth-rows"]')
    expect(rows.element.tagName).toBe('DL')
    expect(rows.findAll('dt').wrappers.map(d => d.text())).toEqual(['Request', 'Role'])
    expect(rows.find('dd').element.textContent).toContain('  trailing  ')
    expect(rows.find('dd').classes()).toContain('is-mono')
    expect(w.find('[data-tid="reauth-note"]').text()).toBe('This lasts 60 seconds.')
    w.destroy()
  })
  it('draws no password fields when passkey only, and says it is waiting while the sheet is up', () => {
    const w = mount(ReauthDialog, {
      propsData: { value: true, hasPasskey: true, hasPassword: true, passkeyOnly: true, busy: true, passkeyBusy: true },
      stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } }
    })
    expect(w.find('[data-tid="reauth-password"]').exists()).toBe(false)
    expect(w.find('[data-tid="reauth-submit"]').exists()).toBe(false)
    expect(w.find('[data-tid="reauth-passkey"]').text()).toContain('Waiting for your passkey…')
    expect(w.find('[data-tid="reauth-passkey"]').attributes('aria-busy')).toBe('true')
    w.destroy()
  })
})
