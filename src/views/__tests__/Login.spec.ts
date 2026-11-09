import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Login from '../Login.vue'

vi.mock('@/init', () => ({ appInit: vi.fn(async () => ({ apiConnected: false, apiAuthenticated: false })) }))

type LoginFn = (payload?: unknown) => Promise<void>

function open (sources = ['moonraker'], login = vi.fn<Parameters<LoginFn>, ReturnType<LoginFn>>(async () => {})) {
  const dispatch = vi.fn(async (action: string, payload?: unknown) => {
    if (action === 'auth/getAuthInfo') return { defaultSource: sources[0], availableSources: sources }
    if (action === 'auth/login') return login(payload)
  })
  const box = { template: '<div v-bind="$attrs"><slot /></div>' }
  const w = shallowMount(Login, {
    mocks: {
      $t: (k: string) => k,
      $globals: { DOCS_AUTH_LOST_PASSWORD: 'https://docs/lost', DOCS_AUTH: 'https://docs/auth' },
      $store: {
        state: { config: { apiUrl: 'http://boxwood.local', hostConfig: {} } },
        getters: { 'config/getDisplayName': 'Boxwood', 'config/getCurrentInstance': {} },
        dispatch
      },
      $socket: { connect: vi.fn() }
    },
    stubs: {
      AuthCard: { props: ['title', 'sub'], template: '<section><h1>{{ title }}</h1><p>{{ sub }}</p><slot /><div class="alt"><slot name="alt" /></div></section>' },
      'router-link': { props: ['to'], template: '<a :href="to" v-bind="$attrs"><slot /></a>' },
      'v-form': { template: '<form v-bind="$attrs" @submit="$emit(`submit`, $event)"><slot /></form>' },
      'v-alert': box,
      'v-text-field': { props: ['value'], template: '<label v-bind="$attrs"><input :value="value" @input="$emit(`input`, $event.target.value)"></label>' },
      'v-select': box,
      AppBtn: { template: '<button v-bind="$attrs"><slot /></button>' }
    }
  })
  return { w, dispatch, login }
}

const tid = (w: ReturnType<typeof open>['w'], id: string) => w.find(`[data-tid="${id}"]`)
const settle = () => new Promise(resolve => setTimeout(resolve))

describe('the printer\'s own sign-in', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('is the same card as the account\'s, and says it is not a Muon3D account', () => {
    const { w } = open()
    expect(w.find('h1').text()).toBe('Sign in to Boxwood')
    expect(w.text()).toContain('This account belongs to the printer, not to your Muon3D account.')
    expect(tid(w, 'login-account').attributes('href')).toBe('/sign-in')
  })

  it('keeps the lost-password and help links', () => {
    const { w } = open()
    const links = w.findAll('.login-links a').wrappers.map(a => a.attributes('href'))
    expect(links).toEqual(['https://docs/lost', 'https://docs/auth'])
  })

  it('signs in with the source picked, and says so when it is wrong', async () => {
    const login = vi.fn<Parameters<LoginFn>, ReturnType<LoginFn>>(async () => { throw new Error('401') })
    const { w } = open(['moonraker', 'ldap'], login)
    await settle()
    expect(tid(w, 'login-source').exists()).toBe(true)
    await tid(w, 'login-username').find('input').setValue('jack')
    await tid(w, 'login-password').find('input').setValue('pw')
    await w.find('form').trigger('submit')
    await settle()
    expect(login).toHaveBeenCalledWith({ username: 'jack', password: 'pw', source: 'moonraker' })
    expect(tid(w, 'login-error').exists()).toBe(true)
  })

  it('shows no source picker when there is only one', async () => {
    const { w } = open()
    await settle()
    expect(tid(w, 'login-source').exists()).toBe(false)
  })
})
