import type { Page, Route } from '@playwright/test'
import { answerConsole, CONSOLE, consoleState } from './console'

const answer = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' },
  body: JSON.stringify(body)
})

export async function switchingAccounts (page: Page, origin = CONSOLE) {
  const printer = (id: string, name: string) => ({ id, name, model: 'M1', state: 'ready', online: false, last_seen: 1, role: 'operator' })
  const alice = consoleState({ account: { id: 'alice', name: 'Alice', email: 'alice@example.test', created_at: 1 }, printers: [printer('alice-printer', 'Alice only')] })
  const bob = consoleState({ account: { id: 'bob', name: 'Bob', email: 'bob@example.test', created_at: 1 }, printers: [printer('bob-printer', 'Bob only')] })
  const seen: Array<{ path: string, token: string }> = []
  let hold: 'refresh' | 'printers' | null = null
  let release = () => {}
  let waiting = false
  let released = false
  await page.addInitScript(url => {
    localStorage.setItem('muon.cloud.url', url)
    if (sessionStorage.getItem('e2e.switch.seeded')) return
    sessionStorage.setItem('e2e.switch.seeded', '1')
    localStorage.setItem('muon.cloud.token', 'access-alice')
    localStorage.setItem('muon.cloud.refresh', 'refresh-alice')
  }, origin)
  await page.route(`${origin}/**`, async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    if (!path.startsWith('/v1/') && !['/authorize', '/token', '/logout'].includes(path)) return route.fallback()
    if (request.method() === 'OPTIONS') return answer(route, {})
    const token = (request.headers().authorization ?? '').replace('Bearer ', '')
    seen.push({ path, token })
    const account = token.includes('bob') ? bob : alice
    if (path === '/logout') return route.fulfill({ status: 303, headers: { location: '/' } })
    if (path === '/authorize') {
      if (request.resourceType() !== 'document') return answer(route, { error: 'login_required' }, 400)
      const callback = new URL(url.searchParams.get('redirect_uri')!)
      callback.searchParams.set('code', 'bob-code')
      callback.searchParams.set('state', url.searchParams.get('state')!)
      callback.searchParams.set('iss', origin)
      return route.fulfill({ contentType: 'text/html', body: `<h1>Console sign-in</h1><a href="${callback.href.replaceAll('&', '&amp;')}">Sign in as Bob</a>` })
    }
    if (path === '/token') {
      const form = new URLSearchParams(request.postData()!)
      if (form.get('grant_type') === 'refresh_token' && hold === 'refresh') {
        hold = null
        waiting = true
        await new Promise<void>(resolve => { release = resolve })
        await answer(route, { access_token: 'access-alice-late', refresh_token: 'refresh-alice-late' })
        released = true
        return
      }
      if (form.get('refresh_token')?.startsWith('refresh-alice')) return answer(route, { access_token: 'access-alice-rotated', refresh_token: 'refresh-alice-rotated' })
      return answer(route, { access_token: 'access-bob', refresh_token: 'refresh-bob', token_type: 'Bearer', expires_in: 3600 })
    }
    if (path === '/v1/auth/sign-in') return answer(route, { token: 'access-bob', account: bob.account })
    if (path === '/v1/auth/sign-out') return answer(route, { ok: true })
    if (token === 'access-alice' && path === '/v1/printers' && hold) {
      if (hold === 'refresh') return answer(route, { error: 'expired' }, 401)
      hold = null
      waiting = true
      await new Promise<void>(resolve => { release = resolve })
      await answerConsole(route, alice)
      released = true
      return
    }
    return answerConsole(route, account)
  })
  return { alice, bob, seen, hold: (kind: typeof hold) => { hold = kind }, waiting: () => waiting, release: () => release(), released: () => released }
}
