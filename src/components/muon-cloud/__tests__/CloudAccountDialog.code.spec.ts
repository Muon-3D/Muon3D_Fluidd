import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CloudAccountDialog from '../CloudAccountDialog.vue'

const signIn = vi.hoisted(() => vi.fn())
const signInWithCode = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-cloud/state', () => ({ signIn, signInWithCode, signUp: vi.fn() }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => false, startCentralSignIn: vi.fn() }))

const box = { template: '<div><slot /></div>' }
function open () {
  return shallowMount(CloudAccountDialog, {
    propsData: { value: true, initialMode: 'sign-in' },
    stubs: {
      'v-dialog': box,
      'v-card': box,
      'v-card-title': box,
      'v-card-subtitle': box,
      'v-card-text': box,
      'v-card-actions': box,
      'v-form': { template: '<form @submit="$emit(`submit`, $event)"><slot /></form>' },
      'v-text-field': {
        props: ['value', 'inputmode', 'autocomplete'],
        template: '<label><input :value="value" :inputmode="inputmode" :autocomplete="autocomplete" @input="$emit(`input`, $event.target.value)"></label>'
      },
      'v-alert': { template: '<div v-bind="$attrs"><slot /></div>' },
      'v-btn': { template: '<button v-bind="$attrs" v-on="$listeners"><slot /></button>' },
      AppBtn: { template: '<button v-on="$listeners"><slot /></button>' }
    }
  })
}
const settle = () => new Promise(resolve => setTimeout(resolve))

async function toCodeStep () {
  signIn.mockResolvedValueOnce('mfa-1')
  const w = open()
  await w.find('form').trigger('submit'); await settle()
  return w
}

describe('account dialog two-step sign-in (KAN-1397, KAN-1407)', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('shows a numeric one-time-code box once the password asked for the code', async () => {
    const w = await toCodeStep()
    const code = w.find('[data-tid="sign-in-code"]')
    expect(code.exists()).toBe(true)
    expect(code.find('input').attributes('inputmode')).toBe('numeric')
    expect(code.find('input').attributes('autocomplete')).toBe('one-time-code')
    expect(signInWithCode).not.toHaveBeenCalled()
  })

  it('sends the code with the token on submit (Enter) and signs in', async () => {
    signInWithCode.mockResolvedValueOnce(undefined)
    const w = await toCodeStep()
    await w.find('[data-tid="sign-in-code"] input').setValue('482913')
    await w.find('form').trigger('submit'); await settle()
    expect(signInWithCode).toHaveBeenCalledWith('mfa-1', '482913')
    expect(w.emitted('signed-in')).toHaveLength(1)
  })

  it('shows the console\'s error on a wrong code and keeps the box', async () => {
    signInWithCode.mockRejectedValueOnce(new Error('that code is not right'))
    const w = await toCodeStep()
    await w.find('[data-tid="sign-in-code"] input').setValue('000000')
    await w.find('form').trigger('submit'); await settle()
    expect(w.text()).toContain('that code is not right')
    expect(w.find('[data-tid="sign-in-code"]').exists()).toBe(true)
    expect(w.emitted('signed-in')).toBeUndefined()
  })

  it('goes back to the password step on "Start again"', async () => {
    const w = await toCodeStep()
    await w.find('[data-tid="sign-in-code-back"]').trigger('click')
    expect(w.find('[data-tid="sign-in-code"]').exists()).toBe(false)
  })
})
