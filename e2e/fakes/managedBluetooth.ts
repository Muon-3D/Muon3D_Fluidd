import Vue from 'vue'
import store from '../../src/store'
import { appInit } from '../../src/init'
import { IrohPrinter, dialPrinter } from '../../src/services/muon-cloud/iroh'
import { useBluetoothFor, remoteRouteLabel, bluetoothDropped } from '../../src/services/muon-ble/link'
import { MUON_BLE_INFO, MUON_BLE_TX } from '../../src/services/muon-ble/webBluetooth'
import { cloudState } from '../../src/services/muon-cloud/state'
import { ManagedIrohPrinterTransport } from '../../src/services/managed-transport'
import { bindHttpClientToPrinterTransport } from '../../src/services/managed-session/httpTransportBinding'
import { connectedEndpointId } from '../../src/services/people-access/identity'
import { MANAGED_API_URL, MANAGED_SOCKET_URL } from '../../src/services/muon-cloud/origin'
import { chooseRouteMode } from '../../src/services/muon-cloud/route-choice'

export const ID = '3fa9c0de'.repeat(8)

/** Fake only the radio and WASM boundary; use Control's real driver and transport. */
export async function managedBluetooth (origin: string, options: { operator?: boolean } = {}) {
  const counts = { dials: 0, closes: 0, identities: 0, aux: 0, sockets: 0, policyRefusals: 0, rpc: [] as string[], refusedMethods: [] as string[] }
  const upload = { pause: false, stall: false, calls: 0, attempts: [] as Array<{ name: string, size: number, root: string, path: string, checksum: string, completed: boolean }> }
  const notices = new Set<(message: string) => void>()
  const policyMessage = 'muon-link policy refused this request: not on the remote allowlist; unlisted endpoints are Owner-only by default'
  const device: any = new EventTarget()
  device.id = 'e2e-printer'
  const tx: any = new EventTarget()
  tx.startNotifications = async () => {}
  tx.readValue = async () => new DataView(new ArrayBuffer(0))
  let radio = false
  let speaker: ReturnType<typeof setInterval> | undefined
  device.gatt = {
    get connected () { return radio },
    connect: async () => {
      radio = true
      // The printer speaks over the radio (QUIC keep-alive): only that makes "Via Bluetooth" true (KAN-2531).
      speaker ??= setInterval(() => {
        if (!radio) return
        tx.value = new DataView(new Uint8Array([0x4b]).buffer)
        tx.dispatchEvent(new Event('characteristicvaluechanged'))
      }, 1000)
      return device.gatt
    },
    disconnect: () => { radio = false; device.dispatchEvent(new Event('gattserverdisconnected')) },
    getPrimaryService: async () => ({
      getCharacteristic: async (uuid: string) => {
        if (uuid === MUON_BLE_TX) return tx
        if (uuid === MUON_BLE_INFO) {
          return {
            readValue: async () => {
              const bytes = new Uint8Array(38)
              bytes[0] = 1
              bytes[4] = 182
              for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt(ID.slice(i * 2, i * 2 + 2), 16)
              return new DataView(bytes.buffer)
            }
          }
        }
        return { properties: { writeWithoutResponse: true }, readValue: async () => new DataView(new ArrayBuffer(0)), writeValueWithoutResponse: async () => {} }
      }
    })
  }
  const wires: WebSocket[] = []
  const endpoint: any = {
    pinBluetooth () {},
    addLink: () => {
      let closed = false
      let wake: (() => void) | undefined
      return {
        connected: async () => ID,
        nextSegment: async () => { if (!closed) await new Promise<void>(resolve => { wake = resolve }); return undefined },
        onSegment () {},
        retryHandshake: () => true,
        isClosed: () => closed,
        onDisconnected: () => { closed = true; wake?.() },
        close: () => { closed = true; wake?.() }
      }
    },
    connect: async () => {
      counts.dials++
      let closed = false
      const session: any = {
        printerId: () => ID,
        close: () => { closed = true; counts.closes++; wires.forEach(w => w.close()) },
        fetchWithProgress: async (method: string, path: string, headers: string[], body: Uint8Array, progress?: (sent: number, total: number) => void) => {
          if (path !== '/server/files/upload') return session.fetch(method, path, headers, body)
          upload.calls++
          const h = new Headers()
          for (let n = 0; n < headers.length; n += 2) h.append(headers[n], headers[n + 1])
          const form = await new Response(body, { headers: h }).formData()
          const file = form.get('file') as File
          const attempt = { name: file.name, size: file.size, root: String(form.get('root')), path: String(form.get('path') ?? ''), checksum: String(form.get('checksum')), completed: false }
          upload.attempts.push(attempt)
          progress?.(0, body.length)
          for (let sent = 256 * 1024; sent < body.length; sent += 256 * 1024) {
            progress?.(sent, body.length)
            while ((upload.pause || upload.stall) && !closed) await new Promise(resolve => setTimeout(resolve, 25))
            if (closed) throw new Error('Bluetooth connection closed')
          }
          progress?.(body.length, body.length)
          attempt.completed = true
          const item = { path: [attempt.path, attempt.name].filter(Boolean).join('/'), root: attempt.root, size: attempt.size, modified: Date.now() / 1000 }
          for (const notify of notices) notify(JSON.stringify({ jsonrpc: '2.0', method: 'notify_filelist_changed', params: [{ action: 'create_file', item }] }))
          return { status: 201, headers: ['content-type', 'application/json'], body: new TextEncoder().encode(JSON.stringify({ result: { item, action: 'create_file' } })) }
        },
        fetch: async (method: string, path: string, headers: string[], body: Uint8Array) => {
          if (path.startsWith('/server/muon/identity')) {
            counts.identities++
            return { status: 403, headers: ['content-type', 'application/json'], body: new TextEncoder().encode(JSON.stringify({ error: policyMessage })) }
          }
          if (path.startsWith('/server/aux/update/status')) counts.aux++
          if (path.startsWith('/server/config') || path.startsWith('/machine/update/status')) {
            return { status: 403, headers: ['content-type', 'application/json'], body: new TextEncoder().encode(JSON.stringify({ error: policyMessage })) }
          }
          const response = await fetch(`${origin}${path}`, { method, body: method === 'GET' ? undefined : body, headers: Object.fromEntries(Array.from({ length: headers.length / 2 }, (_, i) => [headers[i * 2], headers[i * 2 + 1]])) })
          return { status: response.status, headers: ['content-type', response.headers.get('content-type') ?? 'application/json'], body: new Uint8Array(await response.arrayBuffer()) }
        },
        openWebSocket: async () => {
          counts.sockets++
          const wire = new WebSocket(origin.replace('http', 'ws') + '/websocket')
          wires.push(wire)
          const queue: Array<string | null> = []
          let wake: (() => void) | undefined
          const directories = new Map<number, string>()
          const notify = (message: string) => { queue.push(message); wake?.() }
          notices.add(notify)
          wire.onmessage = event => {
            const message = JSON.parse(event.data)
            const directory = directories.get(message.id)
            directories.delete(message.id)
            if (directory && Array.isArray(message.result?.files)) {
              for (const file of upload.attempts) {
                if (file.completed && [file.root, file.path].filter(Boolean).join('/') === directory && !message.result.files.some((entry: any) => entry.filename === file.name)) {
                  message.result.files.push({ filename: file.name, size: file.size, modified: Date.now() / 1000 })
                }
              }
            }
            notify(JSON.stringify(message))
          }
          wire.onclose = () => { notices.delete(notify); queue.push(null); wake?.() }
          await new Promise<void>(resolve => { wire.onopen = () => resolve() })
          return {
            send: async (text: string) => {
              const request = JSON.parse(text)
              counts.rpc.push(request.method)
              if (request.method === 'server.files.get_directory') directories.set(request.id, request.params.path)
              const uploaded = upload.attempts.find(file => file.completed && [file.path, file.name].filter(Boolean).join('/') === request.params?.filename)
              if (request.method === 'server.files.metadata' && uploaded) {
                notify(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { filename: request.params.filename, size: uploaded.size, modified: Date.now() / 1000 } }))
                return
              }
              if (['server.config', 'machine.update.status', 'printer.gcode.script'].includes(request.method)) {
                counts.policyRefusals++
                counts.refusedMethods.push(request.method)
                queue.push(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: 403, message: policyMessage } }))
                wake?.()
              } else wire.send(text)
            },
            close: async () => { wire.close() },
            next: async () => {
              while (!queue.length) await new Promise<void>(resolve => { wake = resolve })
              return queue.shift()!
            }
          }
        }
      }
      return session
    }
  }
  chooseRouteMode(ID, 'ble')
  useBluetoothFor(ID, device)
  const transport = new ManagedIrohPrinterTransport({
    authorizedSession: { contractVersion: 'managed-iroh/v1', sessionId: 'test', tenantId: 'test', printerId: ID, relayUrl: 'https://relay.invalid', expiresAt: '2099-01-01T00:00:00Z' },
    createEndpoint: async () => ({ openRelay: async () => new IrohPrinter(await dialPrinter(endpoint, ID)), close () {} })
  })
  await transport.fetch('/server/info')
  Vue.$socket.releaseTransportSocket(true)
  bindHttpClientToPrinterTransport(Vue.$httpClient, transport)
  cloudState.printers = [{ id: ID, name: 'Boxwood · 367A', model: 'M1', version: '1', linked_at: 1, last_seen: Date.now() / 1000, online: true, role: options.operator ? 'operator' : undefined }]
  cloudState.activePrinterId = ID
  await appInit({ apiUrl: MANAGED_API_URL, socketUrl: MANAGED_SOCKET_URL, name: 'Boxwood · 367A' }, store.state.config.hostConfig)
  Vue.$socket.adoptTransportSocket(await transport.openWebSocket('/websocket'), () => transport.openWebSocket('/websocket'))
  return {
    counts,
    upload,
    refuseIdentity: connectedEndpointId,
    refuseRpc: () => Vue.$socket.emit('machine.update.status'),
    query: () => transport.fetch('/server/info'),
    label: () => remoteRouteLabel(ID),
    dropped: () => bluetoothDropped(ID),
    connection: () => transport.status.connection
  }
}
