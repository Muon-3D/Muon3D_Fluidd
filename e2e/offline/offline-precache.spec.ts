/**
 * KAN-5101 (Army demo, Thu 26 Nov: no internet). A laptop that has opened
 * Control once must work with the site unreachable: styled, with the 3D model.
 * Jack's field report, over Bluetooth with no internet: "the preview picture
 * glitches out and a lot of the styling hasn't loaded". The service worker had
 * precached only the app shell (KAN-525); every lazy chunk, stylesheet, image
 * and the M1 model were fetched on first use, so offline they were gone.
 *
 * The built app is served by this spec's own server, so "offline" is the site
 * really not answering (the server closes), while the mock printer on :7125
 * stays up as the printer does. Everything else on the internet is blocked
 * throughout. Run against a production build: see playwright.offline.config.ts.
 */
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import type { AddressInfo, Socket } from 'net'
import { test, expect, type Page, type Response } from '@playwright/test'
import { MOCK_PORT } from '../ports'
import { isOffline } from '../../vite.config.startup'

const DIST = path.resolve(fileURLToPath(new URL('../..', import.meta.url)), process.env.OFFLINE_DIST || 'dist')
const PRINTER = '/boxwood-367a'
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}
const GPU = process.platform === 'win32'

function walk (dir: string, base = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? walk(path.join(dir, e.name), base)
    : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')])
}

/** The built site on a port of its own, which can be switched off. */
async function serveSite () {
  const sockets = new Set<Socket>()
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(DIST, pathname)
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
    let body: Buffer | string = fs.readFileSync(file)
    // As e2e/fixtures.ts: Control finds its printer from config.json.
    if (pathname === '/config.json') {
      const config = JSON.parse(body.toString())
      config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
      config.endpoints = [`http://localhost:${MOCK_PORT}`]
      body = JSON.stringify(config)
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
    res.end(body)
  })
  server.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)) })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    off: () => new Promise<void>(resolve => { server.close(() => resolve()); sockets.forEach(s => s.destroy()) })
  }
}

/**
 * Same-origin files the page asked for that did not arrive. Not the site's
 * live answers, which no cache can give: /muon/lan-printers.json (the hosted
 * list of printers on the LAN) and /slicer/ (the slicer is its own deployment).
 */
const LIVE = /^\/(?:muon|slicer)\//
const isAsset = (url: string, origin: string) => url.startsWith(origin) && !LIVE.test(new URL(url).pathname)

function watchFailures (page: Page, origin: string) {
  const failed: string[] = []
  page.on('requestfailed', r => { // ERR_ABORTED is the page cancelling its own prefetch as it navigates on, not a file that was missing.
    if (isAsset(r.url(), origin) && r.failure()?.errorText !== 'net::ERR_ABORTED') failed.push(`${r.url()} ${r.failure()?.errorText}`)
  })
  page.on('response', (r: Response) => { if (isAsset(r.url(), origin) && r.status() >= 400) failed.push(`${r.url()} ${r.status()}`) })
  return failed
}

test('with the site unreachable, a visited Control is styled and draws the M1', async ({ page, context }) => {
  expect(fs.existsSync(path.join(DIST, 'sw.js')), `${DIST} is not a build: run npx vite build`).toBe(true)
  const site = await serveSite()
  // The internet is gone for the whole test; only the site (until it is switched off) and the printer answer.
  await context.route(url => !['127.0.0.1', 'localhost'].includes(url.hostname), route => route.abort('internetdisconnected'))

  // Online, once: the worker installs after the first paint, in idle time, and fetches the offline set.
  await page.goto(`${site.origin}${PRINTER}/`)
  await expect(page.locator('#muon-loader')).toHaveCount(0, { timeout: 60_000 })
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 30_000 }).toBe(true)

  // Every file of the offline set is in the worker's cache before the site goes.
  const wanted = walk(DIST).filter(isOffline)
  expect(wanted.length).toBeGreaterThan(100)
  const missing = await page.evaluate(async files => {
    const names = (await caches.keys()).filter(n => n.includes('precache'))
    const out: string[] = []
    for (const f of files) {
      let hit = false
      for (const n of names) if (await (await caches.open(n)).match(`/${f}`, { ignoreSearch: true })) hit = true
      if (!hit) out.push(f)
    }
    return out
  }, wanted)
  expect(missing, 'files the app needs that the service worker did not precache').toEqual([])

  await site.off()
  const failed = watchFailures(page, site.origin)
  const glbs: string[] = []
  page.on('response', r => { if (/\.glb$/.test(new URL(r.url()).pathname)) glbs.push(`${r.status()} ${r.fromServiceWorker()}`) })

  // Offline, every page the app has: loaded from the worker, styled, no file missing.
  for (const route of ['', '/jobs', '/control', '/history', '/settings']) {
    await page.goto(`${site.origin}${PRINTER}${route}`)
    await expect(page.locator('.v-application')).toBeVisible()
    await expect(page.locator('#muon-loader')).toHaveCount(0, { timeout: 60_000 })
    const look = await page.evaluate(async () => {
      await document.fonts.ready
      const app = getComputedStyle(document.querySelector('.v-application')!)
      return {
        background: app.backgroundColor,
        family: app.fontFamily,
        loadedFonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family),
        erroredFonts: [...document.fonts].filter(f => f.status === 'error').map(f => f.family)
      }
    })
    const name = route || 'overview'
    expect(look.background, `${name} has its theme`).not.toBe('rgba(0, 0, 0, 0)')
    expect(look.family, `${name} uses the typeface`).toMatch(/IBM Plex Sans|Inter|Krona/)
    expect(look.loadedFonts.length, `${name} fonts`).toBeGreaterThan(0)
    expect(look.erroredFonts).toEqual([])
  }

  // The 3D view: the live M1 is drawn, from the cached model.
  await page.goto(`${site.origin}${PRINTER}/`)
  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  if (GPU) {
    await expect(stage).toHaveAttribute('data-model', 'accurate', { timeout: 60_000 })
    expect(glbs.length).toBeGreaterThan(0)
    expect(glbs.every(g => g === '200 true')).toBe(true)
    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('[data-tid="m1-live"] canvas') as HTMLCanvasElement | null
      return !!canvas && canvas.width > 0 && canvas.height > 0
    })
    expect(painted).toBe(true)
  }
  expect(failed, 'same-origin requests that failed offline').toEqual([])
})
