/**
 * A printer reached by its secure name (https/wss://<label>.muonlan.net), whole: the page's requests to that origin
 * are answered by the mock printer, and its websocket is bridged to the mock's. Webcams come back as the spec says
 * (`server.webcams.list`), and a request for a camera path on the secure origin is answered with a picture and kept,
 * so a spec can say which origin a camera was loaded from.
 */
import type { Page } from '@playwright/test'
import NodeSocket from 'ws'
import { MOCK_PORT } from '../ports'
import { idle } from './lna'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAE0lEQVR4nGPQiAogCTGMahgUGgCvtHYhDo2f2wAAAABJRU5ErkJggg==', 'base64')

export interface SecurePrinterOptions {
  host: string;
  endpointId: string;
  name: string;
  webcams: unknown[];
  /** The LAN address the printer reports for itself (`machine.system_info` network), as a real printer does. */
  address?: string;
}

export async function securePrinter (page: Page, o: SecurePrinterOptions) {
  const cameraPaths: string[] = []
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  const host = o.host.replace(/\./g, '\.')
  await page.route(new RegExp(`^https://${host}/`), async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (url.pathname.startsWith('/webcam')) {
      cameraPaths.push(`${url.pathname}${url.search}`)
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG, headers: cors })
    }
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ json: { name: o.name, display: o.name, endpoint_id: o.endpointId }, headers: cors })
    }
    const response = await route.fetch({ url: `http://localhost:${MOCK_PORT}${url.pathname}${url.search}` })
    // The mock printer is mid-print; a printer that is printing shows its job, not its route, so it is idle here.
    if (/\/printer\/objects\//.test(url.pathname)) {
      const headers = { ...response.headers(), ...cors }
      delete (headers as Record<string, string>)['content-length']
      return route.fulfill({ response, headers, body: idle(await response.text()) })
    }
    return route.fulfill({ response, headers: { ...response.headers(), ...cors } })
  })
  await page.routeWebSocket(new RegExp(`^wss://${host}/websocket`), ws => {
    const target = new URL(ws.url())
    const server = new NodeSocket(`ws://localhost:${MOCK_PORT}${target.pathname}${target.search}`)
    const waiting: Array<string | Buffer> = []
    server.on('open', () => { for (const m of waiting.splice(0)) server.send(m) })
    const systemInfo = new Set<unknown>()
    server.on('message', (data, binary) => {
      if (binary) return ws.send(data as Buffer)
      let text = idle(data.toString())
      try {
        const msg = JSON.parse(text)
        if (o.address && systemInfo.has(msg.id) && msg.result?.system_info) {
          msg.result.system_info.network = { wlan0: { mac_address: '00:00:00:00:00:01', ip_addresses: [{ family: 'ipv4', address: o.address, is_link_local: false }] } }
          text = JSON.stringify(msg)
        }
      } catch { /* not JSON: passed on */ }
      ws.send(text)
    })
    server.on('close', () => { ws.close().catch(() => {}) })
    server.on('error', () => { ws.close().catch(() => {}) })
    ws.onMessage(message => {
      const text = String(message)
      try {
        const msg = JSON.parse(text)
        if (msg.method === 'machine.system_info') systemInfo.add(msg.id)
        if (msg.method === 'server.webcams.list') {
          ws.send(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { webcams: o.webcams } }))
          return
        }
      } catch { /* not JSON: passed on */ }
      if (server.readyState === NodeSocket.OPEN) server.send(message); else waiting.push(message)
    })
    ws.onClose(() => server.close())
  })
  return { cameraPaths }
}
