import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { serveConsoleHere, type ConsoleState } from '../fakes/console'
import { VITE_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

const CONTROL = `http://localhost:${VITE_PORT}`
const SLICER = 'https://slicer.e2e.test'
const EMBED = `${SLICER}/slicer/embed.html`
const ADDRESS = '/boxwood-367a/slice?printer=sloe&plate=2#saved-work'
const REQUEST = { protocol: 'printer-bridge/1', type: 'account.signIn' }

test.use({ serviceWorkers: 'block' })

function embedHtml () {
  return `<!doctype html><html><head><meta name="muon3d-embed-hosts" content="${CONTROL}"></head>
<body><h1>Saved slicer work</h1><p id="account">Connecting account</p><button id="signin">Sign in with Control</button>
<script>
const control = ${JSON.stringify(CONTROL)}
const nonce = Math.random().toString(16).slice(2).padEnd(32, '0')
let welcomed = false
let port
addEventListener('message', event => {
  if (event.origin !== control || event.source !== parent || event.data.type !== 'welcome' || event.data.nonce !== nonce) return
  welcomed = true
  port = event.ports[0]
  port.onmessage = event => {
    const msg = event.data
    const status = msg.re === 1 ? msg.result : msg.event === 'account.status' ? msg.data : null
    if (status && typeof status.signedIn === 'boolean') document.getElementById('account').textContent = status.signedIn ? 'Signed in as ' + status.name : 'Signed out'
  }
  port.postMessage({ v: 1, id: 1, op: 'account.status', params: { printer: null } })
  port.postMessage({ v: 1, event: 'slicer.state', data: { dirty: true } })
})
function hello () {
  if (!welcomed) parent.postMessage({ protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'fake-slicer', appVersion: '1', nonce, features: ['account'] }, control)
}
hello()
const timer = setInterval(() => { if (welcomed) clearInterval(timer); else hello() }, 100)
document.getElementById('signin').onclick = () => {
  for (let i = 0; i < 3; i++) parent.postMessage(${JSON.stringify(REQUEST)}, control)
}
</script></body></html>`
}

async function setup (page: Page, account: ConsoleState) {
  await serveConsoleHere(page, account, CONTROL)
  await usePrinter(page, PRESETS.idleHomed())
  // Give this test the cross-origin build setting without changing the other Slice specs' same-origin build.
  await page.route('**/src/services/slicer-bridge/slicerUrl.ts*', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, body: (await response.text()).replaceAll('/slicer/embed.html', EMBED) })
  })
  let loads = 0
  let authorizations = 0
  await page.route(EMBED, route => {
    loads++
    return route.fulfill({ contentType: 'text/html', body: embedHtml() })
  })
  await page.route(`${CONTROL}/authorize**`, route => {
    if (route.request().resourceType() !== 'document') return route.fulfill({ status: 400, json: { error: 'login_required' } })
    authorizations++
    const url = new URL(route.request().url())
    const callback = new URL(url.searchParams.get('redirect_uri')!)
    callback.searchParams.set('code', 'e2e-code')
    callback.searchParams.set('state', url.searchParams.get('state')!)
    callback.searchParams.set('iss', CONTROL)
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html><h1>Console sign-in</h1><a href="${callback.href.replaceAll('&', '&amp;')}">Complete sign-in</a>` })
  })
  await page.route(`${CONTROL}/token`, route => route.fulfill({ json: { access_token: 'e2e-session', refresh_token: 'e2e-refresh', token_type: 'Bearer', expires_in: 3600 } }))
  await page.goto(ADDRESS)
  await ready(page)
  await expect(slicer(page).getByRole('heading', { name: 'Saved slicer work' })).toBeVisible({ timeout: 20_000 })
  return { loads: () => loads, authorizations: () => authorizations }
}

const slicer = (page: Page) => page.frameLocator('iframe[title="Muon3D Slicer"]')

test('signed-out embed signs in through the console and restores the exact Slice address once', async ({ page, account }) => {
  const state = await setup(page, account)
  await expect(slicer(page).getByText('Signed out', { exact: true })).toBeVisible()
  page.on('dialog', dialog => { throw new Error(`Unexpected dirty-work guard: ${dialog.type()}`) })
  await slicer(page).getByRole('button', { name: 'Sign in with Control' }).click()
  await expect(page.getByRole('heading', { name: 'Console sign-in' })).toBeVisible()
  expect(state.authorizations()).toBe(1)
  const pending = await page.evaluate(() => JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!))
  expect(pending.returnTo).toBe(ADDRESS)
  await page.getByRole('link', { name: 'Complete sign-in' }).click()
  await expect(page).toHaveURL(`${CONTROL}${ADDRESS}`)
  await expect(slicer(page).getByText('Signed in as Jack', { exact: true })).toBeVisible({ timeout: 20_000 })
  expect(state.loads()).toBe(2)
  expect(state.authorizations()).toBe(1)
  expect(await page.evaluate(() => sessionStorage.getItem('muon.slice.sign-in'))).toBeNull()
})

test('a matching request from a wrong-origin window is ignored', async ({ page, account }) => {
  const state = await setup(page, account)
  await expect(slicer(page).getByText('Signed out', { exact: true })).toBeVisible()
  // Keep the iframe's WindowProxy while navigating it to a different origin, so only the origin check can reject it.
  const wrongEmbed = 'https://other.e2e.test/embed.html'
  await page.route(wrongEmbed, route => route.fulfill({ contentType: 'text/html', body: embedHtml() }))
  await page.frames().find(frame => frame.url() === EMBED)!.goto(wrongEmbed)
  await slicer(page).getByRole('button', { name: 'Sign in with Control' }).click()
  await page.waitForTimeout(500)
  expect(state.authorizations()).toBe(0)
  await expect(page).toHaveURL(`${CONTROL}${ADDRESS}`)
})

test('the slicer origin in a different source window and malformed requests are ignored', async ({ page, account }) => {
  const state = await setup(page, account)
  await expect(slicer(page).getByText('Signed out', { exact: true })).toBeVisible()
  await page.route(`${SLICER}/other.html`, route => route.fulfill({ contentType: 'text/html', body: `<script>parent.postMessage(${JSON.stringify(REQUEST)}, ${JSON.stringify(CONTROL)})</script>` }))
  await page.evaluate(url => {
    const frame = document.createElement('iframe')
    frame.src = url
    frame.title = 'Not the slicer'
    document.body.append(frame)
  }, `${SLICER}/other.html`)
  await expect(page.frameLocator('iframe[title="Not the slicer"]').locator('body')).toBeAttached()
  const frame = page.frames().find(frame => frame.url() === EMBED)!
  for (const data of [null, {}, { ...REQUEST, extra: true }, { ...REQUEST, type: 'account.signOut' }, { ...REQUEST, protocol: 'other' }]) {
    await frame.evaluate(([data, control]) => parent.postMessage(data, control as string), [data, CONTROL])
  }
  await page.waitForTimeout(500)
  expect(state.authorizations()).toBe(0)
  await expect(page).toHaveURL(`${CONTROL}${ADDRESS}`)
})

test.describe('already signed in', () => {
  test.use({ signedIn: true })
  test('refreshes the account and reloads the embed once without a redirect or loop', async ({ page, account }) => {
    const state = await setup(page, account)
    await expect(slicer(page).getByText('Signed in as Jack', { exact: true })).toBeVisible()
    await slicer(page).getByRole('button', { name: 'Sign in with Control' }).click()
    await expect.poll(state.loads).toBe(2)
    await expect(slicer(page).getByText('Signed in as Jack', { exact: true })).toBeVisible()
    await slicer(page).getByRole('button', { name: 'Sign in with Control' }).click()
    await page.waitForTimeout(500)
    expect(state.loads()).toBe(2)
    expect(state.authorizations()).toBe(0)
    await expect(page).toHaveURL(`${CONTROL}${ADDRESS}`)
  })
})
