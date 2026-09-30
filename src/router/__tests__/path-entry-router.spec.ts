import { describe, expect, it, vi } from 'vitest'
import router from '@/router'

// The page is served at the QR code's path form before the router module
// loads, as the console host serves it (KAN-401).
vi.hoisted(() => {
  window.history.replaceState(null, '', '/link?code=482913')
})

describe('the router, loaded at /link?code=', () => {
  it('moves the address to the hash route, with the code, before it reads the hash', () => {
    expect(window.location.pathname).toBe('/')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/link?code=482913')
  })

  it('starts on the link page with the code', () => {
    const route = router.resolve(window.location.hash.slice(1)).route

    expect(route.name).toBe('Link a printer')
    expect(route.query.code).toBe('482913')
  })
})
