import Vue from 'vue'
import store from '../../src/store'
import { IrohPrinter, dialPrinter } from '../../src/services/muon-cloud/iroh'
import { useBluetoothFor, remoteRouteLabel, bluetoothDropped } from '../../src/services/muon-ble/link'
import { MUON_BLE_INFO, MUON_BLE_TX } from '../../src/services/muon-ble/webBluetooth'
import { cloudState } from '../../src/services/muon-cloud/state'
import { ManagedIrohPrinterTransport } from '../../src/services/managed-transport'
import { bindHttpClientToPrinterTransport } from '../../src/services/managed-session/httpTransportBinding'
import { connectedEndpointId } from '../../src/services/people-access/identity'
import { MANAGED_API_URL, MANAGED_SOCKET_URL } from '../../src/services/muon-cloud/origin'

export const ID = '3fa9c0de'.repeat(8)

/** Fake only the radio and WASM boundary; use Control's real driver and transport. */
export async function managedBluetooth (origin: string) {
  const counts = { dials: 0, closes: 0, identities: 0, aux: 0, sockets: 0, policyRefusals: 0 }
  const device: any = new EventTarget()
  device.id = 'e2e-printer'
  const tx: any = new EventTarget()
  tx.startNotifications = async () => {}
  tx.readValue = async () => new DataView(new ArrayBuffer(0))
  let radio = false
  device.gatt = {
    get connected () { return radio },
    connect: async () => { radio = true; return device.gatt },
    disconnect: () => { radio = false; device.dispatchEvent(new Event('gattserverdisconnected')) },
    getPrimaryService: async () => ({
      getCharacteristic: async (uuid: string) => {
        if (uuid === MUON_BLE_TX) return tx
        if (uuid === MUON_BLE_INFO) return { readValue: async () => {
          const bytes = new Uint8Array(38)
          bytes[0] = 1
          bytes[4] = 182
          for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt(ID.slice(i * 2, i * 2 + 2), 16)
          return new DataView(bytes.buffer)
        } }
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
        onSegment () {}, retryHandshake: () => true, isClosed: () => closed,
        onDisconnected: () => { closed = true; wake?.() },
        close: () => { closed = true; wake?.() }
      }
    },
    connect: async () => {
      counts.dials++
      return {
        printerId: () => ID,
        close: () => { counts.closes++; wires.forEach(w => w.close()) },
        fetch: async (method: string, path: string, headers: string[], body: Uint8Array) => {
          if (path.startsWith('/server/muon/identity')) {
            counts.identities++
            return { status: 403, headers: ['content-type', 'application/json'], body: new TextEncoder().encode(JSON.stringify({ error: 'muon-link policy refused this request: not on the remote allowlist' })) }
          }
          if (path.startsWith('/server/aux/update/status')) counts.aux++
          const response = await fetch(`${origin}${path}`, { method, body: method === 'GET' ? undefined : body, headers: Object.fromEntries(Array.from({ length: headers.length / 2 }, (_, i) => [headers[i * 2], headers[i * 2 + 1]])) })
          return { status: response.status, headers: ['content-type', response.headers.get('content-type') ?? 'application/json'], body: new Uint8Array(await response.arrayBuffer()) }
        },
        openWebSocket: async () => {
          counts.sockets++
          const wire = new WebSocket(origin.replace('http', 'ws') + '/websocket')
          wires.push(wire)
          const queue: Array<string | null> = []
          let wake: (() => void) | undefined
          wire.onmessage = event => { queue.push(event.data); wake?.() }
          wire.onclose = () => { queue.push(null); wake?.() }
          await new Promise<void>(resolve => { wire.onopen = () => resolve() })
          return {
            send: async (text: string) => {
              const request = JSON.parse(text)
              if (request.method === 'printer.gcode.script') {
                counts.policyRefusals++
                queue.push(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: 403, message: 'muon-link policy refused this request' } }))
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
    }
  }
  useBluetoothFor(ID, device)
  const transport = new ManagedIrohPrinterTransport({
    authorizedSession: { contractVersion: 'managed-iroh/v1', sessionId: 'test', tenantId: 'test', printerId: ID, relayUrl: 'https://relay.invalid', expiresAt: '2099-01-01T00:00:00Z' },
    createEndpoint: async () => ({ openRelay: async () => new IrohPrinter(await dialPrinter(endpoint, ID)), close () {} })
  })
  await transport.fetch('/server/info')
  Vue.$socket.releaseTransportSocket(true)
  bindHttpClientToPrinterTransport(Vue.$httpClient, transport)
  cloudState.activePrinterId = ID
  store.commit('config/setInitApiConfig', { apiUrl: MANAGED_API_URL, socketUrl: MANAGED_SOCKET_URL, name: 'Boxwood · 367A' })
  Vue.$socket.adoptTransportSocket(await transport.openWebSocket('/websocket'), () => transport.openWebSocket('/websocket'))
  return {
    counts,
    refuseIdentity: connectedEndpointId,
    refuseRpc: () => Vue.$socket.emit('printer.gcode.script', { params: { script: 'G28' } }),
    query: () => transport.fetch('/server/info'),
    label: () => remoteRouteLabel(ID),
    dropped: () => bluetoothDropped(ID),
    connection: () => transport.status.connection
  }
}
