import { describe, expect, it, vi } from 'vitest'
import { listenForSlicerSignIn } from '../signIn'
import type { AccountIdentity } from '@/services/muon-cloud/account-events'

const OUT: AccountIdentity = { signedIn: false, id: null, name: null }
const IN: AccountIdentity = { signedIn: true, id: 'jack', name: 'Jack' }
const request = { protocol: 'printer-bridge/1', type: 'account.signIn' }

function setup (signedIn = false) {
  sessionStorage.clear()
  const frame = document.createElement('iframe')
  document.body.append(frame)
  let account = signedIn ? IN : OUT
  let announce: (status: AccountIdentity) => void = () => {}
  const stopAccount = vi.fn()
  const options = {
    target: window,
    frame,
    url: new URL('https://slicer.example/embed.html'),
    address: () => '/slice?printer=sloe#plate-2',
    accountStatus: vi.fn(),
    reload: vi.fn(),
    leaving: vi.fn(),
    storage: sessionStorage,
    identity: () => account,
    subscribe: (listener: typeof announce) => { announce = listener; return stopAccount },
    signIn: vi.fn<[string], Promise<void>>(async () => {})
  }
  const send = (data: unknown = request, origin = options.url.origin, source: MessageEventSource | null = frame.contentWindow) => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }))
  }
  return { options, send, stopAccount, adopt: () => { account = IN; announce(IN) }, cleanup: () => frame.remove() }
}

describe('slicer window sign-in', () => {
  it('redirects once with the complete current address and bypasses the dirty guard', async () => {
    const s = setup()
    const stop = listenForSlicerSignIn(s.options)
    s.send()
    s.send()
    await Promise.resolve()
    expect(s.options.signIn).toHaveBeenCalledTimes(1)
    expect(s.options.signIn).toHaveBeenCalledWith('/slice?printer=sloe#plate-2')
    expect(s.options.leaving).toHaveBeenCalledWith(true)
    expect(s.options.reload).not.toHaveBeenCalled()
    stop()
    s.cleanup()
  })

  it('ignores wrong origins, source windows, nulls and malformed or extra fields', async () => {
    const s = setup()
    const stop = listenForSlicerSignIn(s.options)
    s.send(request, 'https://other.example')
    s.send(request, s.options.url.origin, window)
    s.send(request, s.options.url.origin, null)
    for (const data of [null, [], '', {}, { ...request, extra: true }, { ...request, protocol: 'other' }, { ...request, type: 'account.signOut' }]) s.send(data)
    await Promise.resolve()
    expect(s.options.signIn).not.toHaveBeenCalled()
    expect(s.options.reload).not.toHaveBeenCalled()
    stop()
    s.cleanup()
  })

  it('announces the signed-in account before reloading, without a reload loop', () => {
    const s = setup(true)
    const stop = listenForSlicerSignIn(s.options)
    s.send()
    s.send()
    expect(s.options.accountStatus).toHaveBeenCalledWith(IN)
    expect(s.options.accountStatus.mock.invocationCallOrder[0]).toBeLessThan(s.options.reload.mock.invocationCallOrder[0])
    expect(s.options.reload).toHaveBeenCalledTimes(1)
    expect(s.options.signIn).not.toHaveBeenCalled()
    stop()
    s.cleanup()
  })

  it.each([false, true])('consumes the return marker, already signed in: %s', signedIn => {
    const s = setup(signedIn)
    sessionStorage.setItem('muon.slice.sign-in', s.options.address())
    const stop = listenForSlicerSignIn(s.options)
    expect(sessionStorage.getItem('muon.slice.sign-in')).toBeNull()
    expect(s.options.reload).not.toHaveBeenCalled()
    s.adopt()
    expect(s.options.reload).toHaveBeenCalledTimes(signedIn ? 0 : 1)
    s.adopt()
    expect(s.options.reload).toHaveBeenCalledTimes(signedIn ? 0 : 1)
    expect(s.options.signIn).not.toHaveBeenCalled()
    s.send()
    expect(s.options.reload).toHaveBeenCalledTimes(signedIn ? 0 : 1)
    stop()
    s.cleanup()
  })

  it('restores the guard after a failed redirect and permits retry', async () => {
    const s = setup()
    s.options.signIn.mockRejectedValueOnce(new Error('unavailable'))
    const stop = listenForSlicerSignIn(s.options)
    s.send()
    await vi.waitFor(() => expect(s.options.leaving).toHaveBeenLastCalledWith(false))
    expect(sessionStorage.getItem('muon.slice.sign-in')).toBeNull()
    s.send()
    await Promise.resolve()
    expect(s.options.signIn).toHaveBeenCalledTimes(2)
    stop()
    s.cleanup()
  })

  it('consumes a cancelled return without redirecting or reloading', async () => {
    const s = setup()
    sessionStorage.setItem('muon.slice.sign-in', s.options.address())
    const stop = listenForSlicerSignIn(s.options)
    await Promise.resolve()
    expect(sessionStorage.getItem('muon.slice.sign-in')).toBeNull()
    expect(s.options.signIn).not.toHaveBeenCalled()
    expect(s.options.reload).not.toHaveBeenCalled()
    stop()
    s.cleanup()
  })

  it('does not reload for a stale marker from a different address', () => {
    const s = setup()
    sessionStorage.setItem('muon.slice.sign-in', '/slice?other')
    const stop = listenForSlicerSignIn(s.options)
    s.adopt()
    expect(sessionStorage.getItem('muon.slice.sign-in')).toBeNull()
    expect(s.options.reload).not.toHaveBeenCalled()
    stop()
    s.cleanup()
  })

  it('unsubscribes on unmount, including a late session adoption', () => {
    const s = setup()
    sessionStorage.setItem('muon.slice.sign-in', s.options.address())
    const stop = listenForSlicerSignIn(s.options)
    stop()
    s.send()
    s.adopt()
    expect(s.stopAccount).toHaveBeenCalledTimes(1)
    expect(s.options.signIn).not.toHaveBeenCalled()
    expect(s.options.reload).not.toHaveBeenCalled()
    s.cleanup()
  })
})
