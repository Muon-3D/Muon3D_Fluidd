import { createHash, randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'

const MOCK = `http://localhost:${MOCK_PORT}`
const CODE = Buffer.from('G28\nG1 X10\n')
const MODEL = Buffer.from('PK\x03\x04model archive bytes\x00\xff', 'binary')

test.use({ serviceWorkers: 'block' })

async function lan (page: Page, options = {}) {
  const id = randomUUID()
  const url = `${MOCK}/e2e/uploads/${id}`
  expect((await page.request.post(url, { data: options })).ok()).toBe(true)
  await page.addInitScript(({ id, port }) => {
    ;(window as any).__lanDirectoryReplies = []
    const NativeSocket = window.WebSocket
    window.WebSocket = class extends NativeSocket {
      constructor (url: string | URL, protocols?: string | string[]) {
        const target = new URL(String(url), location.href)
        if (target.port === String(port) && target.pathname === '/websocket') target.searchParams.set('e2e_upload_session', id)
        super(target, protocols)
        this.addEventListener('message', event => {
          const message = JSON.parse(String(event.data))
          if (Array.isArray(message.result?.files)) (window as any).__lanDirectoryReplies.push(message.result.files.map((file: any) => file.filename))
        })
      }
    }
    const open = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (...args: any[]) {
      ;(open as any).apply(this, args)
      if (String(args[1]).includes('/server/files/upload')) this.setRequestHeader('X-E2E-Upload-Session', id)
    } as typeof open
  }, { id, port: MOCK_PORT })
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  printer.state.results['server.info'] = { registered_directories: ['gcodes', 'calibration', 'defaults', 'config', 'logs', 'docs'] }
  const posts: string[] = []
  page.on('request', req => { if (req.method() === 'POST' && req.url().includes('/server/files/upload')) posts.push(req.url()) })
  return { printer, posts, state: async () => (await page.request.get(url)).json() }
}

async function folder (page: Page, surface: 'Jobs' | 'Files') {
  if (surface === 'Jobs') {
    await page.getByTestId('jobs-row').filter({ hasText: 'parts' }).dblclick()
    await expect(page.getByTestId('jobs-empty')).toBeVisible()
    return page.getByTestId('jobs-page')
  }
  const tile = page.getByTestId('files-config')
  await tile.getByText('parts', { exact: true }).click()
  await expect(tile.getByTestId('files-crumbs')).toContainText('parts')
  return tile
}

async function send (page: Page, surface: 'Jobs' | 'Files', how: 'button' | 'drop', name: string, bytes: Buffer) {
  if (how === 'button') {
    const chooser = page.waitForEvent('filechooser')
    if (surface === 'Jobs') await page.getByTestId('jobs-upload').click()
    else {
      await page.getByTestId('files-config').getByRole('button', { name: 'Add', exact: true }).click()
      await page.getByRole('menuitem', { name: /Upload Files/i }).click()
    }
    const picker = await chooser
    expect(await picker.element().getAttribute('accept')).toMatch(new RegExp(name.endsWith('.3mf') ? '\\.3mf' : '\\.gcode'))
    await picker.setFiles({ name, mimeType: 'application/octet-stream', buffer: bytes })
  } else {
    // Drop on a child of the Files surface, not just its outer wrapper.
    const target = surface === 'Files' ? page.getByTestId('files-config').getByTestId('files-crumbs') : page.getByTestId('jobs-page')
    await target.evaluate((el, { name, bytes }) => {
      const file = new File([new Uint8Array(bytes)], name)
      const data = { items: [], files: [file], types: ['Files'], dropEffect: 'none' }
      for (const type of ['dragenter', 'dragover', 'drop']) {
        const event = new DragEvent(type, { bubbles: true, cancelable: true })
        Object.defineProperty(event, 'dataTransfer', { value: data })
        el.dispatchEvent(event)
      }
    }, { name, bytes: [...bytes] })
  }
}

async function kept (page: Page) {
  const keep = page.getByTestId('job-ready-keep')
  if (await keep.isVisible()) await keep.click()
}

for (const surface of ['Jobs', 'Files'] as const) {
  for (const how of ['button', 'drop'] as const) {
    for (const ext of (surface === 'Jobs' ? ['gcode'] : ['gcode', '3mf'])) {
      test(`${surface} ${how}: ${ext} is stored and listed in the displayed non-root folder`, async ({ page, open }) => {
        const backend = await lan(page)
        await open(surface === 'Jobs' ? '/jobs' : '/configure')
        const tile = await folder(page, surface)
        const name = `stored-${how}.${ext}`
        const bytes = ext === '3mf' ? MODEL : CODE
        await send(page, surface, how, name, bytes)
        await expect(page.getByTestId('flash-message')).toContainText(`Uploaded ${name}`)
        await kept(page)
        const entry = surface === 'Jobs' ? tile.getByTestId('jobs-row').filter({ hasText: `Stored ${how}` }) : tile.getByText(name, { exact: true })
        await expect(entry).toBeVisible()
        const state = await backend.state()
        expect(backend.posts).toEqual([`${MOCK}/server/files/upload`])
        expect(state.files).toEqual([expect.objectContaining({ name, folder: 'parts', root: surface === 'Jobs' ? 'gcodes' : 'calibration', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })])
        expect(state.staged).toEqual([])
        expect(await page.getByTestId('job-ready-open-slice').count()).toBe(0)
      })
    }
  }
}

for (const how of ['button', 'drop'] as const) {
  test(`Jobs ${how}: 3MF is handed to Open in slicer, never POSTed to Moonraker`, async ({ page, open }) => {
    const backend = await lan(page)
    await page.route('**/slicer/embed.html*', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta name="muon3d-embed-hosts" content="self"><div id="received"></div><script>
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''); let welcomed = false;
      addEventListener('message', e => {
        if (welcomed || e.source !== parent || e.data.type !== 'welcome' || e.data.nonce !== nonce || !e.ports[0]) return;
        welcomed = true;
        e.ports[0].onmessage = m => { if (m.data.event === 'models.open') document.getElementById('received').textContent = JSON.stringify(m.data.data.files.map(f => ({ name: f.name, bytes: Array.from(new Uint8Array(f.bytes)) }))); };
      });
      setInterval(() => { if (!welcomed) parent.postMessage({ protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'lan-slicer', appVersion: '1', nonce, features: ['models.open'] }, location.origin); }, 100);
      </script>` }))
    await open('/jobs')
    await folder(page, 'Jobs')
    await send(page, 'Jobs', how, 'model.3mf', MODEL)
    await expect(page.getByTestId('job-ready')).toContainText('model.3mf')
    await page.getByTestId('job-ready-open-slice').click()
    await expect(page).toHaveURL(/\/slice$/)
    await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#received')).toHaveText(JSON.stringify([{ name: 'model.3mf', bytes: [...MODEL] }]))
    expect(backend.posts).toEqual([])
    expect((await backend.state()).attempts).toEqual([])
  })
}

test('Jobs: upload then Print starts that exact LAN file including its folder', async ({ page, open }) => {
  const backend = await lan(page)
  await open('/jobs')
  await folder(page, 'Jobs')
  await send(page, 'Jobs', 'button', 'print-this.gcode', CODE)
  await expect(page.getByTestId('job-ready-print')).toBeEnabled()
  await page.getByTestId('job-ready-print').click()
  const plate = page.getByTestId('confirm-plate')
  if (await plate.count()) await plate.click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => backend.printer.called('printer.print.start')).toEqual([{ filename: 'parts/print-this.gcode' }])
})

test('Jobs: 52 MiB LAN upload displays increasing real byte progress and publishes intact', async ({ page, open }, info) => {
  const backend = await lan(page, { delay: 0.008 })
  await open('/jobs')
  const tile = await folder(page, 'Jobs')
  const bytes = Buffer.alloc(52 * 1024 * 1024, 'G')
  const file = info.outputPath('lan-large.gcode')
  await writeFile(file, bytes)
  await page.getByTestId('jobs-upload-input').setInputFiles(file)
  const panel = page.getByTestId('upload-progress')
  const progress = panel.getByRole('progressbar')
  await expect(async () => {
    const value = Number(await progress.getAttribute('value'))
    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThan(90)
  }).toPass({ timeout: 15_000 })
  const first = Number(await progress.getAttribute('value'))
  await expect(panel.getByRole('status')).toContainText(/\d+%.*\/.+52/)
  await page.screenshot({ path: info.outputPath(`lan-progress-${info.project.name}.png`) })
  await expect(async () => {
    expect(Number(await progress.getAttribute('value'))).toBeGreaterThan(first)
  }).toPass({ timeout: 15_000 })
  await expect(page.getByTestId('flash-message')).toContainText('Uploaded lan-large.gcode')
  await expect(panel).toBeHidden()
  await kept(page)
  await expect(tile.getByTestId('jobs-row').filter({ hasText: 'Lan large' })).toBeVisible()
  expect((await backend.state()).files).toEqual([expect.objectContaining({ name: 'lan-large.gcode', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), completed: true })])
})

test('Jobs: a mid-transfer LAN cut leaves no file or temporary entry, including after list refresh', async ({ page, open }) => {
  const backend = await lan(page, { cut_after: 512 * 1024 })
  await open('/jobs')
  await folder(page, 'Jobs')
  await send(page, 'Jobs', 'button', 'unfinished.gcode', Buffer.alloc(1024 * 1024, 'G'))
  await expect(page.getByTestId('flash-message')).toContainText('Upload of unfinished.gcode failed')
  await expect(page.getByTestId('upload-progress')).toBeHidden()
  await expect(page.getByTestId('jobs-empty')).toBeVisible()
  const state = await backend.state()
  expect(state.files).toEqual([])
  expect(state.staged).toEqual([])
  expect(state.attempts[0]).toMatchObject({ name: 'unfinished.gcode', completed: false })
  expect(state.attempts[0].size).toBeGreaterThanOrEqual(512 * 1024)
  expect(state.attempts[0].size).toBeLessThan(1024 * 1024)
  const count = await page.evaluate(() => (window as any).__lanDirectoryReplies.length)
  await page.evaluate(async () => {
    const { SocketActions } = await import(/* @vite-ignore */ '/src/api/socketActions.ts')
    await SocketActions.serverFilesGetDirectory('gcodes', 'gcodes/parts')
  })
  await expect.poll(() => page.evaluate(() => (window as any).__lanDirectoryReplies.length)).toBeGreaterThan(count)
  expect(await page.evaluate(() => (window as any).__lanDirectoryReplies.at(-1))).toEqual([])
  await expect(page.getByTestId('jobs-empty')).toBeVisible()
  const files = await page.evaluate(async () => {
    const { default: store } = await import(/* @vite-ignore */ '/src/store/index.ts')
    return store.state.files.pathFiles['gcodes/parts'].files
  })
  expect(files).toEqual([])
})
