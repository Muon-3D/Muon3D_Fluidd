/* eslint-disable lines-between-class-members */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */

/**
 * Taken from https://github.com/DimanVorosh/vue-json-rpc-websocket/blob/master/src/wsClient.js
 * and refactored.
 */
import _Vue from 'vue'
import { Globals } from '@/globals'
import { consola } from 'consola'
import { camelCase, mergeWith } from 'lodash-es'
import { httpClientActions } from '@/api/httpClientActions'
import type { Store } from 'vuex'
import type { RootState } from '@/store/types'
import {
  PRINTER_SOCKET_OPEN,
  type PrinterSocket
} from '@/services/managed-transport'
import axios from 'axios'

export class WebSocketClient {
  url = ''
  connection: PrinterSocket | null = null
  reconnectEnabled = false
  reconnectInterval = 1000
  allowedReconnectAttempts = 3
  reconnectCount = 0
  logPrefix = '[WEBSOCKET]'
  requests: Array<Request> = []
  store: any | null = null
  pingTimeout: any
  cache: CachedParams | null = null
  private readonly openedConnections = new WeakSet<object>()
  private transportReconnect: (() => Promise<PrinterSocket>) | null = null

  constructor (options: SocketPluginOptions) {
    this.url = options.url
    this.reconnectEnabled = options.reconnectEnabled || false
    this.reconnectInterval = options.reconnectInterval || 1000
    this.store = options.store ? options.store : null
  }

  pong () {
    // Valid response from the socket.
    clearTimeout(this.pingTimeout)

    // We have a connection again, so set the socket properties
    // appropriately.
    if (
      !this.store.state.socket.disconnecting && // We arent about to disonnect and..
      !this.store.state.files.download // We're not in the middle of a download.
    ) {
      this.store.commit('socket/setSocketOpen', true)
      this.store.dispatch('socket/onSocketConnecting', false)
    }

    this.pingTimeout = setTimeout(() => {
      if (
        !this.store.state.socket.disconnecting && // We arent about to disonnect and..
        !this.store.state.files.download // We're not in the middle of a download.
      ) {
        // In the event our socket stops responding, set the socket properties
        // appropriately.
        consola.debug(`${this.logPrefix} Connection timeout, pong failed`)
        if (this.store) this.store.commit('socket/setSocketOpen', false)
        if (this.store) this.store.dispatch('socket/onSocketConnecting', true)
      }
    }, Globals.SOCKET_PING_INTERVAL)
  }

  close () {
    if (this.connection) {
      this.cache = null
      this.connection.close()
      this.reconnectCount = 0
    }
  }

  async connect (url?: string) {
    if (url) this.url = url
    this.cache = null

    try {
      const response = await httpClientActions.accessOneshotTokenGet()

      const token = response.data.result

      // Good. Move on with setting up the socket.
      if (this.store) this.store.dispatch('socket/onSocketConnecting', true)
      this.bindConnection(new WebSocket(`${this.url}?token=${token}`))
    } catch (error: unknown) {
      // Bad. If this is a 401, then don't retry. Otherwise do.
      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401
      ) {
        this.reconnect()
      }
    }
  }

  /**
   * Bind a socket returned by an authorized printer transport. Event handlers
   * are installed before an already-open socket enters the normal open path.
   */
  adoptTransportSocket (
    connection: PrinterSocket,
    reconnect?: () => Promise<PrinterSocket>
  ) {
    this.bindConnection(connection, reconnect ?? null)
  }

  /** Ends an adopted session without allowing its close event to reconnect. */
  releaseTransportSocket (closeConnection = true) {
    const connection = this.connection
    this.connection = null
    this.transportReconnect = null
    this.cache = null
    this.reconnectCount = 0
    if (connection) {
      this.openedConnections.delete(connection as object)
      if (closeConnection) connection.close()
    }
  }

  private bindConnection (
    connection: PrinterSocket,
    reconnect: (() => Promise<PrinterSocket>) | null = null
  ) {
    this.connection = connection
    this.transportReconnect = reconnect
    connection.addEventListener('open', () => this.onConnectionOpen(connection))
    connection.addEventListener('close', event => this.onConnectionClose(connection, event as SocketCloseEvent))
    connection.addEventListener('error', event => this.onConnectionError(connection, event))
    connection.addEventListener('message', event => this.onConnectionMessage(connection, event as SocketMessageEvent))

    if (connection.readyState === PRINTER_SOCKET_OPEN) {
      this.onConnectionOpen(connection)
    }
  }

  private onConnectionOpen (connection: PrinterSocket) {
    if (this.connection !== connection || this.openedConnections.has(connection as object)) return

    this.openedConnections.add(connection as object)
    if (this.reconnectEnabled) this.reconnectCount = 1
    if (this.store) {
      this.store.dispatch('socket/onSocketConnecting', false)
      this.store.dispatch('socket/onSocketOpen', true)
    }
  }

  private onConnectionClose (connection: PrinterSocket, event: SocketCloseEvent) {
    if (this.connection !== connection) return

    consola.debug(`${this.logPrefix} Connection closed:`, event)
    clearTimeout(this.pingTimeout)
    if (this.store) this.store.dispatch('socket/onSocketClose', event)
    if (!event.wasClean) {
      if (this.transportReconnect) {
        this.reconnectTransport(this.transportReconnect)
      } else {
        this.reconnect()
      }
    }
  }

  private onConnectionError (connection: PrinterSocket, event: unknown) {
    if (this.connection !== connection) return

    consola.error(`${this.logPrefix} Connection error:`, event)
    if (this.store) this.store.dispatch('socket/onSocketError', event)
  }

  private onConnectionMessage (connection: PrinterSocket, message: SocketMessageEvent) {
    if (this.connection !== connection) return

    // Parse the data packet.
    const d: SocketResponse = JSON.parse(message.data)

    // Is this a socket notification, or an answer to a specific request?
    let request: Request | undefined
    const requestIndex = this.requests.findIndex(request => request.id === d.id)
    if (requestIndex > -1) {
      request = this.requests[requestIndex]
      this.requests.splice(requestIndex, 1)
    }

    // Remove a wait if defined.
    if (this.store && request && request.wait && request.wait.length) {
      this.store.commit('wait/setRemoveWait', request.wait)
    }

    if (d.error) {
      if (request) {
        Object.defineProperty(d.error, '__request__', { enumerable: false, value: request })
      }
      consola.debug(`${this.logPrefix} Response error:`, d.error)
      if (this.store) this.store.dispatch('socket/onSocketError', d.error)
      return
    }

    this.pong()

    if (request) {
      let result = (d.result) ? d.result : d.params
      if (typeof result === 'string') result = { result }

      Object.defineProperty(result, '__request__', { enumerable: false, value: request })
      consola.debug(`${this.logPrefix} Response:`, result)
      if (request.dispatch && this.store) this.store.dispatch(request.dispatch, result)
      if (request.commit && this.store) this.store.commit(request.commit, result)
    } else if (d.params && d.params[0]) {
      const [params, eventtime] = d.params

      if (d.method !== 'notify_status_update') {
        if (this.store) this.store.dispatch('socket/' + camelCase(d.method), params)
      } else {
        for (const key of ['motion_report']) {
          if (this.store && key in params) {
            this.store.dispatch('printer/onFastNotifyStatusUpdate', { key, payload: params[key] }, { root: true })
            delete params[key]
          }
        }

        const timestamp = eventtime ? eventtime * 1000 : Date.now()
        this.cache = (!this.cache)
          ? { timestamp, params }
          : { timestamp: this.cache.timestamp, params: mergeWith(this.cache.params, params, (dest, src) => Array.isArray(dest) ? src : undefined) }

        if (timestamp - this.cache.timestamp >= 1000) {
          if (this.store) this.store.dispatch('socket/' + camelCase(d.method), this.cache.params)
          this.cache = { timestamp, params: {} }
        }
      }
    } else {
      if (this.store) this.store.dispatch('socket/' + camelCase(d.method))
    }
  }

  private reconnectTransport (reconnect: () => Promise<PrinterSocket>) {
    if (this.reconnectCount <= this.allowedReconnectAttempts) {
      this.reconnectCount += 1
      this.connection = null
      setTimeout(async () => {
        if (this.transportReconnect !== reconnect) return
        try {
          const connection = await reconnect()
          if (this.transportReconnect === reconnect) {
            this.bindConnection(connection, reconnect)
          } else {
            connection.close()
          }
        } catch (_error) {
          if (this.transportReconnect === reconnect) this.reconnectTransport(reconnect)
        }
      }, this.reconnectInterval)
    } else if (this.store) {
      this.store.dispatch('socket/onSocketConnecting', false)
    }
  }

  reconnect () {
    if (this.reconnectCount <= this.allowedReconnectAttempts) {
      this.reconnectCount += 1
      this.connection = null
      consola.debug(`${this.logPrefix} Reconnecting in ${this.reconnectInterval}`)
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      if (this.store) this.store.dispatch('socket/onSocketConnecting', false)
    }
  }

  /**
   * Sends data TO the socket
   * @param method
   * @param params
   */
  emit (method: string, options?: NotifyOptions) {
    if (this.store.state.socket.disconnecting || this.store.state.socket.connecting) {
      consola.debug(`${this.logPrefix} Socket emit denied, in disconnecting state:`, method, options)

      return
    }

    if (this.connection?.readyState === PRINTER_SOCKET_OPEN) {
      // moonraker expects a unique id for us to reference back to when data is returned.
      const getRandomNumber = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }
      const id = getRandomNumber(10000, 99999)
      const packet: SocketRequest = {
        id,
        method,
        jsonrpc: '2.0'
      }
      const request: Request = {
        id,
        method
      }
      if (options && options.wait) {
        request.wait = options.wait
        if (this.store) this.store.dispatch('wait/addWait', options.wait)
      }
      if (options && options.params) {
        packet.params = options.params
        request.params = options.params
      }
      if (options && options.dispatch) request.dispatch = options.dispatch
      if (options && options.commit) request.commit = options.commit
      this.requests.push(request)
      this.connection.send(JSON.stringify(packet))
    } else {
      consola.debug(`${this.logPrefix} Not ready, or closed.`, method, options, this.connection?.readyState)
    }
  }
}

export const SocketPlugin = {
  install (Vue: typeof _Vue, options?: SocketPluginOptions) {
    if (options?.url == null || options.store == null) {
      throw new Error('options required')
    }

    const socket = new WebSocketClient(options)
    Vue.prototype.$socket = socket
    Vue.$socket = socket
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $socket: WebSocketClient;
  }

  interface VueConstructor {
    $socket: WebSocketClient;
  }
}

interface SocketPluginOptions {
  url: string;
  token?: string;
  reconnectEnabled?: boolean;
  reconnectInterval?: number;
  store: Store<RootState>;
}

export interface NotifyOptions {
  params?: any;
  dispatch?: string;
  commit?: string;
  wait?: string;
}

interface Request {
  id: number;
  method?: string;
  dispatch?: string;
  commit?: string;
  params?: any;
  wait?: string;
}

interface SocketRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface SocketResponse {
  jsonrpc: string; // always available
  method?: string; // generic responses
  params?: [any, number?]; // generic responses
  id?: number; // specific response
  result?: any; // specific response
  error?: string | SocketError; // specific response
}

interface SocketError {
  code: number;
  message: string;
}

interface CachedParams {
  timestamp: number;
  params: any;
}

interface SocketCloseEvent {
  wasClean: boolean;
}

interface SocketMessageEvent {
  data: string;
}
