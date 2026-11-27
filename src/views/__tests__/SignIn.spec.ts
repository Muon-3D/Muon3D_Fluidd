import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SignIn from '../SignIn.vue'
import SignInCard from '@/components/auth/SignInCard.vue'
import { AccountError } from '@/services/account/client'

const passwordSignIn = vi.hoisted(() => vi.fn())
const codeSignIn = vi.hoisted(() => vi.fn())
const passkeySignIn = vi.hoisted(() => vi.fn())
const forgotPassword = vi.hoisted(() => vi.fn(async () => {}))
const finishSignIn = vi.hoisted(() => vi.fn(async () => 'https://control.example.test/handoff?code=h1&next=%2Fauthorize'))
const signUp = vi.hoisted(() => vi.fn())
const passkeyCount = vi.hoisted(() => vi.fn(async () => 1))
const addPasskeyAfterSignIn = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-in', () => ({ passwordSignIn, codeSignIn, passkeySignIn, forgotPassword, finishSignIn, signUp, passkeyCount, addPasskeyAfterSignIn }))
vi.mock('@/services/account/api', () => ({ accountApi: { config: vi.fn(async () => ({ social: { google: true, apple: true } })) } }))
const supported = vi.hoisted(() => ({ yes: true }))
vi.mock('@/services/account/webauthn', () => ({
  passkeysSupported: () => supported.yes,
  conditionalPasskeysAvailable: async () => false,
  deviceLabel: () => 'Chrome on Windows',
  cancelledPasskey: (e: unknown) => e instanceof DOMException && e.name === 'NotAllowedError'
}))

const CONTINUE = '/authorize?client_id=library&state=s'
const opened: Array<{ destroy: () => void }> = []

function open (query: Record<string, string> = { continue: CONTINUE }) {
  const w = mount(SignIn, {
    mocks: { $route: { query } },
    stubs: { OpenInMuonControl: true }
  })
  opened.push(w)
  const card = w.findComponent(SignInCard)
  const go = vi.spyOn(card.vm as unknown as { go: (url: string) => void }, 'go').mockImplementation(() => {})
  return { w, go, card }
}

const tid = (w: ReturnType<typeof open>['w'], id: string) => w.find(`[data-tid="${id}"]`)
const settle = () => new Promise(resolve => setTimeout(resolve))

async function typeIn (w: ReturnType<typeof open>['w'], id: string, value: string) {
  await tid(w, id).setValue(value)
}

/** Email, Continue, password, Sign in. */
async function passwordSignInFlow (w: ReturnType<typeof open>['w']) {
  await typeIn(w, 'sign-in-email', 'jack@muon3d.com')
  await w.find('form').trigger('submit')
  await typeIn(w, 'sign-in-password', 'correct horse')
  await w.find('form').trigger('submit')
  await settle()
}

describe('Sign in to MUON3D', () => {
  beforeEach(() => { localStorage.clear(); supported.yes = true })
  afterEach(() => { vi.clearAllMocks(); while (opened.length) opened.pop()!.destroy() })

  it('is one MUON3D card, continuing to the surface by name only from the fixed map', () => {
    const { w } = open()
    expect(tid(w, 'auth-title').text()).toBe('Sign in to MUON3D')
    expect(tid(w, 'sign-in-continuing').text()).toBe('Continuing to Library')
    const unknown = open({ continue: '/authorize?client_id=%3Cb%3Eevil&state=s' })
    expect(unknown.w.find('[data-tid="sign-in-continuing"]').exists()).toBe(false)
    expect(unknown.w.text()).toContain('One account for your printers')
  })

  it('draws passkey, then email, then four greyed providers, with no badge', () => {
    const { w } = open()
    const methods = w.findAll('.auth-method[data-method]').wrappers.map(m => m.attributes('data-method'))
    expect(methods).toEqual(['passkey', 'email'])
    expect(w.findAll('.cbtn--primary')).toHaveLength(1)
    expect(tid(w, 'sign-in-passkey').classes()).toContain('cbtn--primary')
    expect(w.find('[data-tid="sign-in-last-used"]').exists()).toBe(false)
    const greyed = w.findAll('.auth-providers button')
    expect(greyed.wrappers.map(b => b.text())).toEqual(['Google Coming soon', 'Apple Coming soon', 'GitHub Coming soon', 'Microsoft Coming soon'])
    for (const b of greyed.wrappers) {
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
    }
  })

  it('a greyed provider does nothing when clicked', async () => {
    const { w, go } = open()
    await tid(w, 'sign-in-provider-google').trigger('click')
    await tid(w, 'sign-in-provider-google').trigger('keydown.enter')
    expect(passkeySignIn).not.toHaveBeenCalled()
    expect(passwordSignIn).not.toHaveBeenCalled()
    expect(go).not.toHaveBeenCalled()
    expect(tid(w, 'sign-in-methods').exists()).toBe(true)
  })

  it('moves the last used method first and badges it, remembering only the method', async () => {
    passwordSignIn.mockResolvedValueOnce('page-session')
    const first = open()
    await passwordSignInFlow(first.w)
    expect(JSON.parse(localStorage.getItem('muon.signin.last') as string)).toEqual({ v: 1, method: 'email' })
    for (let i = 0; i < localStorage.length; i++) {
      expect(`${localStorage.key(i)}=${localStorage.getItem(localStorage.key(i) as string)}`).not.toContain('jack@muon3d.com')
    }
    const again = open()
    const methods = again.w.findAll('.auth-method[data-method]').wrappers.map(m => m.attributes('data-method'))
    expect(methods).toEqual(['email', 'passkey'])
    expect(tid(again.w, 'sign-in-last-used').text()).toBe('Last used')
    expect(tid(again.w, 'sign-in-continue').classes()).toContain('cbtn--primary')
    expect(tid(again.w, 'sign-in-passkey').classes()).not.toContain('cbtn--primary')
    expect(tid(again.w, 'auth-title').text()).toBe('Sign in to MUON3D')
  })

  it('treats storage that throws, or a value it does not know, as a first visit', () => {
    localStorage.setItem('muon.signin.last', '{"v":2,"method":"email"}')
    expect(open().w.find('[data-tid="sign-in-last-used"]').exists()).toBe(false)
    localStorage.setItem('muon.signin.last', 'not json')
    expect(open().w.find('[data-tid="sign-in-last-used"]').exists()).toBe(false)
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(open().w.find('[data-tid="sign-in-last-used"]').exists()).toBe(false)
    getItem.mockRestore()
  })

  it('asks for the two-step code after a right password, then hands off, keeping continue', async () => {
    passwordSignIn.mockRejectedValueOnce(new AccountError('Enter the code.', 403, { mfa_required: true, mfa_token: 'mfa-1' }))
    codeSignIn.mockResolvedValueOnce('page-session')
    const { w, go } = open()
    await passwordSignInFlow(w)
    expect(w.text()).toContain('Enter your code')
    expect(tid(w, 'sign-in-error').exists()).toBe(false)
    await typeIn(w, 'sign-in-code', '482 913')
    await w.find('form').trigger('submit')
    await settle()
    expect(codeSignIn).toHaveBeenCalledWith('mfa-1', '482 913')
    // The deep link rides through every mode change, unchanged.
    expect(finishSignIn).toHaveBeenCalledWith('page-session', CONTINUE, '/')
    expect(go).toHaveBeenCalledWith('https://control.example.test/handoff?code=h1&next=%2Fauthorize')
  })

  it('signs in with a passkey, says only a muted line when the person cancels it, and remembers passkey', async () => {
    passkeySignIn.mockRejectedValueOnce(new DOMException('cancelled', 'NotAllowedError'))
    const { w, go } = open()
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(tid(w, 'sign-in-error').exists()).toBe(false)
    expect(tid(w, 'sign-in-passkey-cancelled').text()).toBe('Passkey sign-in cancelled.')
    passkeySignIn.mockResolvedValueOnce('page-session')
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(go).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('muon.signin.last') as string)).toEqual({ v: 1, method: 'passkey' })
    // A passkey sign-in never asks for a passkey.
    expect(passkeyCount).not.toHaveBeenCalled()
  })

  it('names a passkey the console does not know, and lets it be pressed again', async () => {
    passkeySignIn.mockRejectedValueOnce(new AccountError('That passkey is not registered here.', 401, { error: 'that passkey is not registered here' }))
    const { w } = open()
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(tid(w, 'sign-in-error').text()).toContain('That passkey isn\'t set up for Muon3D.')
    expect(tid(w, 'sign-in-error').attributes('role')).toBe('alert')
    expect(tid(w, 'sign-in-passkey').attributes('disabled')).toBeUndefined()
  })

  it('prefers the console\'s error code when it sends one', async () => {
    passkeySignIn.mockRejectedValueOnce(new AccountError('Something unrelated.', 401, { error: 'something unrelated', code: 'passkey_not_registered' }))
    const { w } = open()
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(tid(w, 'sign-in-error').text()).toContain('That passkey isn\'t set up for Muon3D.')
  })

  it('offers no passkey where the browser has none: email first, with a line saying so', () => {
    supported.yes = false
    const { w } = open()
    expect(tid(w, 'sign-in-passkey').exists()).toBe(false)
    expect(tid(w, 'sign-in-continue').classes()).toContain('cbtn--primary')
    expect(tid(w, 'sign-in-no-passkeys').text()).toBe('This browser can\'t use passkeys.')
  })

  it('stays on the card with a field error for an address that is not one', async () => {
    const { w } = open()
    await typeIn(w, 'sign-in-email', 'nope')
    await w.find('form').trigger('submit')
    expect(tid(w, 'sign-in-email-error').text()).toBe('Enter your email address.')
    expect(tid(w, 'sign-in-password').exists()).toBe(false)
  })

  it('sends a reset link, says the same whether or not there is an account, and counts down to Send again', async () => {
    vi.useFakeTimers()
    try {
      const { w } = open({})
      await w.findComponent(SignInCard).vm.$nextTick()
      ;(w.findComponent(SignInCard).vm as any).setMode('forgot')
      await w.vm.$nextTick()
      await typeIn(w, 'sign-in-email', 'someone@example.com')
      await w.find('form').trigger('submit')
      await vi.advanceTimersByTimeAsync(0)
      expect(forgotPassword).toHaveBeenCalledWith('someone@example.com')
      expect(tid(w, 'sign-in-sent').text()).toContain('If there\'s an account for someone@example.com')
      expect(tid(w, 'sign-in-send-again').attributes('disabled')).toBeDefined()
      expect(tid(w, 'sign-in-send-again').text()).toBe('Send again in 1:00')
      await vi.advanceTimersByTimeAsync(60000)
      expect(tid(w, 'sign-in-send-again').attributes('disabled')).toBeUndefined()
      expect(tid(w, 'sign-in-send-again').text()).toBe('Send again')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the wrong-password words and empties the password', async () => {
    passwordSignIn.mockRejectedValueOnce(new AccountError('That email and password do not match.', 401, { error: 'that email and password do not match' }))
    const { w, go } = open()
    await passwordSignInFlow(w)
    expect(tid(w, 'sign-in-error').text()).toContain('That email and password don\'t match.')
    expect((tid(w, 'sign-in-password').element as HTMLInputElement).value).toBe('')
    expect(go).not.toHaveBeenCalled()
  })

  it('counts a 429 down from Retry-After and disables only the limited button', async () => {
    passwordSignIn.mockRejectedValueOnce(new AccountError('Too many attempts; try again in 30 seconds.', 429, {}, 42000))
    const { w } = open()
    await passwordSignInFlow(w)
    expect(tid(w, 'sign-in-error').text()).toContain('Try again in 42 seconds.')
    expect(tid(w, 'sign-in-error').text()).toContain('You can still sign in with a passkey.')
    expect(tid(w, 'sign-in-submit').attributes('disabled')).toBeDefined()
  })

  it.each(['', '12', '121', 'not a number', '13.5'])("blocks invalid signup age '%s' with an accessible error", async value => {
    const { w, card } = open()
    ;(card.vm as any).setMode('sign-up'); await w.vm.$nextTick()
    await typeIn(w, 'sign-in-email', 'new@example.com')
    await typeIn(w, 'sign-up-age', value)
    await w.find('form').trigger('submit'); await settle()
    expect(signUp).not.toHaveBeenCalled()
    expect(tid(w, 'sign-up-age-error').attributes('role')).toBe('alert')
  })

  it('announces a signup network refusal', async () => {
    signUp.mockRejectedValueOnce(new AccountError('The Muon3D service could not be reached.', 0))
    const { w, card } = open()
    ;(card.vm as any).setMode('sign-up'); await w.vm.$nextTick()
    await typeIn(w, 'sign-in-email', 'new@example.com')
    await typeIn(w, 'sign-up-age', '18')
    await w.find('form').trigger('submit'); await settle()
    expect(tid(w, 'sign-in-error').attributes('role')).toBe('alert')
    expect(tid(w, 'sign-in-error').text()).toContain('can\'t be reached')
  })

  describe('the passkey nudge', () => {
    it('shows after a password sign-in with no passkey, and Not now carries on and snoozes', async () => {
      passwordSignIn.mockResolvedValueOnce('page-session')
      passkeyCount.mockResolvedValueOnce(0)
      const { w, go } = open()
      await passwordSignInFlow(w)
      expect(tid(w, 'sign-in-nudge').exists()).toBe(true)
      expect(go).not.toHaveBeenCalled()
      await tid(w, 'sign-in-nudge-skip').trigger('click')
      await settle()
      expect(finishSignIn).toHaveBeenCalledWith('page-session', CONTINUE, '/')
      expect(go).toHaveBeenCalled()
      expect(JSON.parse(localStorage.getItem('muon.signin.passkeyNudge') as string).until).toBeGreaterThan(Date.now())
      // Next time: no nudge.
      passwordSignIn.mockResolvedValueOnce('page-session')
      passkeyCount.mockResolvedValueOnce(0)
      const again = open()
      await passwordSignInFlow(again.w)
      expect(tid(again.w, 'sign-in-nudge').exists()).toBe(false)
      expect(again.go).toHaveBeenCalled()
    })

    it('adds a passkey with the page session and hands off with the session the console re-keyed', async () => {
      vi.useFakeTimers()
      try {
        passwordSignIn.mockResolvedValueOnce('page-session')
        passkeyCount.mockResolvedValueOnce(0)
        addPasskeyAfterSignIn.mockResolvedValueOnce('rekeyed-session')
        const { w, go } = open()
        await w.findComponent(SignInCard).vm.$nextTick()
        await typeIn(w, 'sign-in-email', 'jack@muon3d.com')
        await w.find('form').trigger('submit')
        await typeIn(w, 'sign-in-password', 'correct horse')
        await w.find('form').trigger('submit')
        await vi.advanceTimersByTimeAsync(0)
        await tid(w, 'sign-in-nudge-add').trigger('click')
        await vi.advanceTimersByTimeAsync(1300)
        expect(addPasskeyAfterSignIn).toHaveBeenCalledWith('page-session', 'Chrome on Windows')
        expect(finishSignIn).toHaveBeenCalledWith('rekeyed-session', CONTINUE, '/')
        expect(go).toHaveBeenCalled()
        expect(JSON.parse(localStorage.getItem('muon.signin.last') as string).method).toBe('passkey')
      } finally {
        vi.useRealTimers()
      }
    })

    it('is skipped when the passkey count cannot be read, and for an unknown surface', async () => {
      passwordSignIn.mockResolvedValue('page-session')
      passkeyCount.mockResolvedValueOnce(null)
      const a = open()
      await passwordSignInFlow(a.w)
      expect(tid(a.w, 'sign-in-nudge').exists()).toBe(false)
      expect(a.go).toHaveBeenCalled()
      const b = open({ continue: '/authorize?client_id=someone-else&state=s' })
      await passwordSignInFlow(b.w)
      expect(passkeyCount).toHaveBeenCalledTimes(1)
      expect(b.go).toHaveBeenCalled()
    })
  })
})
