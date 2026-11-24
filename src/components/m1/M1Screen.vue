<template>
  <div
    class="m1-screen"
    :class="[`m1-screen--${phase}`, { 'm1-screen--camera': !!ring }]"
    data-tid="m1-screen"
    :data-phase="phase"
    :data-camera="ring ? 'on' : 'off'"
    :style="{ ...flight, ...ringStyle }"
    @click.self="close"
    @wheel="onWheel"
  >
    <div class="m1-screen__strip">
      <span class="m1-screen__live"><span class="m1-screen__dot" />Live</span>
      <span class="m1-screen__what">Using {{ printerName }}'s screen</span>
      <span
        v-if="liveSupported === false"
        class="m1-screen__livenote"
        data-tid="m1-screen-live-note"
      >Live screen needs a printer update.</span>
      <span class="m1-screen__hint">Esc or click outside to leave</span>
      <button
        type="button"
        class="m1-screen__done"
        data-tid="m1-screen-done"
        @click="close"
      >
        Exit
      </button>
    </div>
    <div class="m1-screen__bezel">
      <p
        v-if="served === false"
        class="m1-screen__empty"
        data-tid="m1-screen-empty"
      >
        Your printer needs an update to show its screen here
      </p>
      <p
        v-else-if="needsNetwork"
        class="m1-screen__empty"
        data-tid="m1-screen-needs-network"
      >
        Screen view needs a network connection
      </p>
      <p
        v-else-if="unreachable"
        class="m1-screen__empty"
        data-tid="m1-screen-unreachable"
      >
        The printer's screen can't be reached over this connection right now
      </p>
      <div
        v-else-if="loading"
        class="m1-screen__empty"
        data-tid="m1-screen-loading"
        role="status"
      >
        <p>Loading the printer's screen{{ loadPercent === null ? '' : ` (${loadPercent}%)` }}</p>
        <progress
          class="m1-screen__progress"
          data-tid="m1-screen-progress"
          max="100"
          :value="loadPercent === null ? undefined : loadPercent"
        />
      </div>
      <iframe
        v-else-if="served && html"
        ref="frame"
        :key="frameKey"
        class="m1-screen__frame"
        :srcdoc="html"
        sandbox="allow-scripts"
        title="The printer's screen"
        data-tid="m1-screen-frame"
        referrerpolicy="no-referrer"
      />
    </div>
    <button
      v-if="refusedLast"
      type="button"
      class="m1-screen__note"
      role="status"
      title="Dismiss"
      data-tid="m1-screen-refused"
      @click="refusedLast = false"
    >
      {{ refusedText }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { findFilamentMacro } from '@/services/quick-actions/model'
import type { Macro } from '@/store/macros/types'
import type { Verb } from '@/services/panel-embed/protocol'
import { PanelBridge } from '@/services/panel-embed/bridge'
import Vue from 'vue'
import { httpClientActions } from '@/api/httpClientActions'
import { cloudState } from '@/services/muon-cloud/state'
import { loadPanelBundle, PANEL_URL, type PanelBundle } from '@/services/panel-embed/bundle'
import { bluetoothCarrying } from '@/services/muon-ble/link'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { NOTIFY_ACTIONS, PANEL_NAVIGATE_PATH, PANEL_STATE_PATH, gcodeRefusal, refusalNote } from '@/services/panel-embed/allow'
import { KnobWheel } from '@/services/m1-3d/knob'

/** The zoom in from the model's screen, and back out to it, ms. */
const FLY_MS = 380
/** The bezel's drawn size, and the room the top strip takes, px. */
const BEZEL_PX = 340
const STRIP_PX = 64
/** How long a new frame gets to say hello before it is made again, ms. */
const HELLO_WAIT_MS = 8000

/**
 * The printer's screen, asked of the printer itself over the route Control uses for it (LAN, Bluetooth, relay), never of
 * this page's origin: hosted Control serves no /panel/. Kept by ETag, so a 304 costs no bundle.
 */
function panelBundle (key: string | null, hosted: boolean, onProgress: (loaded: number, total: number) => void): Promise<PanelBundle> {
  const id = cloudState.activePrinterId
  const remote = printerTransportBinding.remote
  return loadPanelBundle((url, request) => Vue.$httpClient.get(url, {
    // Bytes, so a gzip body from a route that does not undo it can be unzipped (the loader reads both).
    responseType: 'arraybuffer',
    transformResponse: [v => v],
    validateStatus: () => true,
    headers: request.headers,
    onDownloadProgress: e => request.onProgress(e.loaded, e.total ?? 0)
  }), key, onProgress, undefined, {
    // Over the radio nothing is fetched (KAN-6069).
    bluetooth: !!id && bluetoothCarrying(id),
    // A browser negotiates gzip itself on a direct route; Iroh and the relay pass headers through as given.
    compressed: remote,
    // Control served by the printer (not the hosted page): its own origin's /panel/ first, never its secure name's (KAN-6062).
    sameOrigin: !hosted && !remote ? `${window.location.origin}${PANEL_URL}` : null
  })
}

/** Each view's bridge, kept out of Vue's reach: Vue must not walk it or its port. */
const bridges = new WeakMap<object, PanelBridge>()

/**
 * The printer's own screen, used from Control (SCREEN-PLAN.md, Jack 6 Nov):
 * MuonUI's embed build at /panel/, framed on Control's own origin, with no
 * network of its own. Everything it asks goes through PanelBridge on
 * Control's connection, after the allowlist; anything meant to be done on the
 * printer itself is refused there and tagged "Confirm on the printer" in the
 * screen. The knob is the mouse wheel and a click, inside the frame.
 *
 * It opens by zooming in from where the screen is on the model, and Esc,
 * Done or a click outside fly it back out there. Without a /panel/ build it
 * says so, and nothing is framed or bridged.
 */
@Component
export default class M1Screen extends Mixins(ControlMixin) {
  /** Where the model's screen is on the stage, to fly in from and back out to. */
  @Prop({ type: Object, default: null })
  readonly from!: { x: number, y: number } | null

  @Prop({ type: Boolean, default: false })
  readonly reducedMotion!: boolean

  /**
   * The live viewer while the camera is flying in to the screen, null when it is not (reduced motion, or a model with no
   * screen): then the zoom is this overlay's own, over a dimmed stage. With the camera, the framed screen is the 3D model's
   * own, top-down, and the live screen sits exactly on its disc, with the model's knob beside it (Jack, 11 Nov).
   */
  @Prop({ type: Object, default: null })
  readonly viewer!: { screenCircle: () => { x: number, y: number, r: number } | null } | null

  /** The screen's disc as the camera will have it once it has flown in: centre and radius in the stage's pixels. */
  ring: { x: number, y: number, r: number } | null = null

  /** 'in' before the zoom starts, 'open', then 'out' while it flies back. */
  phase: 'in' | 'open' | 'out' = 'in'
  /** Bumped to make a new frame, so the screen boots again and says hello again. */
  frameKey = 0
  /** Over Bluetooth with no kept copy: the screen is not pulled over the radio. */
  needsNetwork = false
  helloTimer = 0
  helloTries = 0
  /** The socket connection the bridge was last handed over on. */
  handshakeConnectionId: number | null = null
  /** /panel/ is served here: null until known. */
  served: boolean | null = null
  /** The printer did not answer over this route: neither the screen nor "needs an update" can be said. */
  unreachable = false
  flyTimer = 0
  flight: Record<string, string> = {}
  stopActions: (() => void) | null = null
  refusedLast = false
  refusedText = ''
  /** The printer publishes its panel state (live screen): null until known, false on an older image (the screen stays independent). */
  liveSupported: boolean | null = null

  get printerName (): string {
    return (this.$store.getters['config/getDisplayName'] as string | undefined) || 'the printer'
  }

  /** The zoom's start (and end): the screen on the model, small, as an offset from the stage's middle. */
  flyFrom (): Record<string, string> {
    const el = this.$el as HTMLElement
    const ms = `${this.reducedMotion ? 0 : FLY_MS}ms`
    // Small stages (a phone) draw the bezel smaller, in the room under the strip with Done.
    const strip = el.querySelector('.m1-screen__strip') as HTMLElement | null
    const top = strip ? strip.offsetTop + strip.offsetHeight + 8 : STRIP_PX
    const fit = Math.min(1, (el.clientHeight - top - 12) / BEZEL_PX, (el.clientWidth - 24) / BEZEL_PX)
    const style: Record<string, string> = {
      '--fly-ms': ms,
      '--fit': `${Math.max(0.4, fit).toFixed(3)}`,
      '--drop': `${Math.max(0, Math.round((top - 12) / 2))}px`
    }
    if (!this.from) return style
    const dx = Math.round(this.from.x - el.clientWidth / 2)
    const dy = Math.round(this.from.y - el.clientHeight / 2)
    return { ...style, '--fly-x': `${dx}px`, '--fly-y': `${dy}px` }
  }

  get ringStyle (): Record<string, string> {
    const r = this.ring
    if (!r) return {}
    return { '--ring-x': `${Math.round(r.x)}px`, '--ring-y': `${Math.round(r.y)}px`, '--ring-d': `${Math.round(r.r * 2)}px`, '--ring-k': `${(r.r * 2 / 480).toFixed(4)}` }
  }

  readonly knobWheel = new KnobWheel()

  /** A scroll on the strip or the stage around the screen turns the model's knob (the picture only); the embedded screen's own scroll is its own. */
  onWheel (e: WheelEvent) {
    if (!this.ring) return
    e.preventDefault()
    const detents = this.knobWheel.turn(e.deltaY, e.deltaMode)
    if (detents) this.$emit('turn', detents)
  }

  async mounted () {
    document.addEventListener('keydown', this.onKey)
    this.ring = this.viewer?.screenCircle() ?? null
    this.flight = this.flyFrom()
    // The next frame, so the zoom starts from the screen on the model.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.phase === 'in') this.phase = 'open'
    }))
    this.loading = true
    const bundle = await panelBundle(this.printerKey, !!this.$store.state.config.hostConfig.hosted, (loaded, total) => { this.loadPercent = total > 0 ? Math.min(100, Math.round(loaded / total * 100)) : null })
    this.loading = false
    if (this.phase === 'out' || (this as unknown as { _isDestroyed?: boolean })._isDestroyed) return
    this.needsNetwork = bundle.state === 'needs-network'
    this.served = bundle.state === 'unknown' || bundle.state === 'needs-network' ? null : bundle.state === 'yes'
    this.unreachable = bundle.state === 'unknown'
    if (bundle.state === 'yes') {
      this.html = bundle.html
      this.$nextTick(() => this.connect())
    }
  }

  /** Which printer this is, from what Control holds (its address, and the printer id on a managed route), never from what a printer says. */
  get printerKey (): string | null {
    // Only a printer id Control itself holds counts; on the LAN there is none, so nothing is kept for it.
    const id = cloudState.activePrinterId
    return id ? `${this.$store.state.config.apiUrl ?? ''}|${id}` : null
  }

  /** The screen's page, fetched from the printer. */
  html = ''
  /** While the page comes over the route (a Bluetooth link takes a while). */
  loading = false
  /** How much of it has come, 0 to 100, or null when the route can't say. */
  loadPercent: number | null = null

  /** Esc, Done or a click outside: fly back out to the model, then close. */
  close () {
    if (this.phase === 'out') return
    this.phase = 'out'
    clearTimeout(this.flyTimer)
    this.flyTimer = window.setTimeout(() => this.$emit('close'), this.reducedMotion ? 0 : FLY_MS)
  }

  /** The note in the strip: what was refused, and why. It stays until it is clicked away or the screen is left, so it can be read. */
  say (text: string) {
    this.refusedText = text
    this.refusedLast = true
  }

  /** The bridge to the framed screen, on Control's connection, after the allowlist. */
  connect () {
    const frame = this.$refs.frame as HTMLIFrameElement | undefined
    if (!frame) return
    this.handshakeConnectionId = (this.$store.state.socket.connectionId as number | null) ?? null
    bridges.set(this, new PanelBridge(frame, {
      rpc: async (method, params) => {
        const why = this.rpcRefusal(method, params)
        if (why) { this.say(why); throw new Error(why) }
        const result = await this.$socket.emit(method, { params })
        if (result === undefined) throw new Error('The printer refused that.')
        return result
      },
      auxGet: async path => (await httpClientActions.get(`/server/aux${path}`)).data,
      status: () => this.$store.state.printer.printer as Record<string, unknown>,
      connectionId: () => (this.$store.state.socket.connectionId as number | null) ?? null,
      verb: v => {
        const why = this.runVerb(v)
        if (why) this.say(why)
        return why
      },
      // The printer's live panel state, over the same route as everything else: any status comes back as data.
      panelGet: async () => {
        const r = await httpClientActions.get(PANEL_STATE_PATH, { validateStatus: () => true })
        return { status: r.status, body: r.data }
      },
      panelPost: async body => {
        const r = await httpClientActions.post(PANEL_NAVIGATE_PATH, body, { validateStatus: () => true })
        return { status: r.status, body: r.data }
      }
    }, {
      onRefused: what => this.say(refusalNote(what)),
      onSupport: supported => { this.liveSupported = supported }
    }))
    // An embed that never says hello (it booted before the bridge listened, or the link stalled it) is sent for again, twice at most.
    clearTimeout(this.helloTimer)
    this.helloTimer = window.setTimeout(() => {
      if (bridges.get(this)?.greeted === false && this.helloTries < 2) { this.helloTries++; this.rehandshake() }
    }, HELLO_WAIT_MS)
    // Only the websocket's own push while it works; a state poll only while it is down or silent.
    if (this.wsDown) bridges.get(this)?.setPolling(true)
    // Moonraker's notifications, as Control's socket passes them to the store, passed on.
    this.stopActions = this.$store.subscribeAction(action => {
      const bridge = bridges.get(this)
      if (!bridge) return
      if (action.type === 'socket/notifyMuonPanelState') {
        bridge.panelNotify(action.payload)
      } else if (action.type === 'printer/onFastNotifyStatusUpdate') {
        const { key, payload } = action.payload as { key: string, payload: unknown }
        bridge.notify('notify_status_update', [{ [key]: payload }])
      } else if (action.type in NOTIFY_ACTIONS) {
        bridge.notify(NOTIFY_ACTIONS[action.type], [action.payload])
      }
    })
  }

  /** A fresh frame and a fresh bridge: the embed boots again, says hello, and is handed a new port. */
  rehandshake () {
    this.stopActions?.()
    this.stopActions = null
    bridges.get(this)?.dispose()
    bridges.delete(this)
    this.frameKey++
    this.$nextTick(() => this.connect())
  }

  /** The socket came back on a new connection (a Bluetooth reconnect): the embed's port rode the old one, so the handshake runs again. */
  @Watch('socketConnectionId')
  onReconnected (id: number | null) {
    if (id === null || !this.html || !bridges.has(this) || id === this.handshakeConnectionId) return
    // The first id of a socket that was still identifying when the screen opened: not a reconnect.
    if (this.handshakeConnectionId === null) { this.handshakeConnectionId = id; return }
    this.helloTries = 0
    this.rehandshake()
  }

  get socketConnectionId (): number | null {
    return (this.$store.state.socket.connectionId as number | null) ?? null
  }

  beforeDestroy () {
    clearTimeout(this.helloTimer)
    clearTimeout(this.flyTimer)
    document.removeEventListener('keydown', this.onKey)
    this.stopActions?.()
    bridges.get(this)?.dispose()
    bridges.delete(this)
  }

  /** Another printer, or Klippy gone: the screen was this printer's, so it closes. */
  @Watch('connectionKey')
  onConnectionChange () {
    this.$emit('close')
  }

  /** The websocket is down or has gone quiet: the one time the panel state is polled (2 s). Back up: one re-read, then pushes only. */
  get wsDown (): boolean {
    const s = this.$store.state.socket
    return !s.open || !!s.stalled
  }

  @Watch('wsDown')
  onWsDown (down: boolean) {
    const bridge = bridges.get(this)
    if (!bridge) return
    bridge.setPolling(down)
    if (!down) bridge.syncPanel().catch(() => undefined)
  }

  get connectionKey (): string {
    const s = this.$store.state.socket
    // Which printer, and whether Klipper is up. A socket that drops and returns is the same screen (it shakes hands again), not a new printer.
    return `${this.$store.state.config.apiUrl ?? ''}|${this.$store.state.printer.printer.webhooks?.state ?? ''}`
  }

  /**
   * A verb from the screen, run as Control's own buttons run it: a jog by
   * moveBy (the no-go planner and the hand-move wait), home, a heater target
   * by setHeater (inside its limits), load and unload as the Filament card
   * runs them. Only while the printer is idle and Control can act; '' when
   * it was sent, else why not.
   */
  runVerb (v: Verb): string {
    if (!this.controlReady) return this.controlLock
    if (this.busy) return 'Not while the printer is busy.'
    switch (v.verb) {
      case 'jog': {
        if (!this.isHomed(v.axis)) return 'Home the printer first.'
        const wait = this.handMoveWait()
        if (wait) return wait
        this.moveBy(v.axis, v.by)
        return ''
      }
      case 'home':
        this.home(v.axes)
        return ''
      case 'heat': {
        const heater = v.heater === 'extruder' ? this.nozzle : this.bed
        if (!heater) return 'That heater is not on this printer.'
        const why = this.heatRefusal(heater.name, v.target)
        if (why) return why
        this.setHeater(heater, v.target)
        return ''
      }
      case 'fan': {
        const fan = v.fan === 'part' ? this.partFan : this.fans.find(f => f.type === 'fan_generic' && f.name === v.fan)
        if (!fan) return 'That fan is not on this printer.'
        this.setFan(fan, v.percent)
        return ''
      }
      case 'filament': {
        const macros = ((this.$store.getters['macros/getMacros'] as Macro[]) ?? []).filter(m => typeof m.name === 'string')
        const macro = v.action === 'load'
          ? findFilamentMacro(macros, 'load_filament', 'filament_load')
          : findFilamentMacro(macros, 'unload_filament', 'filament_unload')
        if (!macro) return 'This printer has no macro for that.'
        const temp = this.material?.nozzle ?? this.loadedMaterial?.nozzle ?? null
        this.sendGcode(macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name)
        return ''
      }
    }
  }

  /**
   * Why a forwarded print call isn't sent, '' when it is: the same gates as
   * Control's own buttons, as runVerb applies them. E-stop mirrors Control's
   * E-STOP button (AppBar estopReady): signed in, connected, Klipper ready.
   * Reads pass.
   */
  rpcRefusal (method: string, params?: Record<string, unknown>): string {
    switch (method) {
      case 'printer.emergency_stop':
        return this.authenticated && this.socketConnected && this.klippyReady ? '' : this.controlLock || this.notReadyReason
      case 'printer.gcode.script':
        if (!this.controlReady) return this.controlLock
        return this.busy ? 'Not while the printer is busy.' : gcodeRefusal(params?.script)
      case 'server.job_queue.post_job':
      case 'server.job_queue.start':
      case 'server.job_queue.pause':
      case 'server.job_queue.jump':
        return this.controlReady ? '' : this.controlLock
      case 'printer.print.start':
        if (!this.controlReady) return this.controlLock
        return this.busy ? 'Not while the printer is busy.' : ''
      case 'printer.print.pause':
        if (!this.controlReady) return this.controlLock
        return this.printerPrinting ? '' : 'The printer is not printing.'
      case 'printer.print.resume':
        if (!this.controlReady) return this.controlLock
        return this.printerPaused ? '' : 'The print is not paused.'
      case 'printer.print.cancel':
        if (!this.controlReady) return this.controlLock
        return this.printerPrinting || this.printerPaused ? '' : 'There is no print to cancel.'
      default:
        return ''
    }
  }

  /**
   * A heat target from the screen: refused (never clamped) above the heater's
   * max_temp, which is read live from the printer's config, and refused when
   * that is not known. '' when it may go.
   */
  heatRefusal (heater: string, target: number): string {
    const settings = (this.$store.state.printer.printer.configfile?.settings ?? {}) as Record<string, { max_temp?: unknown } | undefined>
    const max = Number(settings[heater]?.max_temp)
    if (!Number.isFinite(max) || max <= 0) return 'This printer has not said how hot that heater may go.'
    if (!Number.isFinite(target) || target < 0) return 'That is not a temperature this heater can be set to.'
    if (target > max) return 'That is hotter than this heater goes.'
    return ''
  }

  onKey (e: KeyboardEvent) {
    if (e.key === 'Escape') this.close()
  }
}
</script>

<style lang="scss" scoped>
  .m1-screen {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 55%);
    backdrop-filter: blur(6px);
    pointer-events: auto;
    transition: background var(--fly-ms, 380ms) ease, backdrop-filter var(--fly-ms, 380ms) ease;
  }

  /* Zooming in from the model's screen, and back out to it. */
  .m1-screen__bezel,
  .m1-screen__strip {
    transition: transform var(--fly-ms, 380ms) cubic-bezier(0.2, 0.8, 0.2, 1), opacity var(--fly-ms, 380ms) ease;
  }

  .m1-screen--in,
  .m1-screen--out {
    background: rgb(0 0 0 / 0%);
    backdrop-filter: blur(0);

    .m1-screen__bezel {
      transform: translate(var(--fly-x, 0), var(--fly-y, 0)) scale(calc(0.14 * var(--fit, 1)));
      opacity: 0.4;
    }

    .m1-screen__strip {
      transform: translateY(-8px);
      opacity: 0;
    }
  }

  .m1-screen__empty {
    max-width: 220px;
    margin: 0;
    text-align: center;
    color: #3a3a3c;
    font-size: 14px;
    font-weight: 600;

    p { margin: 0 0 10px; }
  }

  .m1-screen__progress {
    width: 180px;
    max-width: 100%;
    height: 8px;
    accent-color: #0a6c74;
  }

  .m1-screen__strip {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1;
    padding: 8px 10px 8px 14px;
    border-radius: 14px;
    background: rgb(36 36 40 / 82%);
    color: #f5f5f7;
    font-size: 13px;
  }

  .m1-screen__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgb(48 209 88);
    font-weight: 700;
  }

  .m1-screen__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  .m1-screen__what {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .m1-screen__hint {
    color: #98989d;
    font-size: 12px;
    white-space: nowrap;

    @media (max-width: 600px) {
      display: none;
    }
  }

  .m1-screen__livenote {
    color: #ffd60a;
    font-size: 12px;
  }

  .m1-screen__done {
    height: 30px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgb(118 118 128 / 24%);
    color: #f5f5f7;
    font-weight: 600;
  }

  /* The panel is a 480 px circle; drawn at 300 px in a light bezel like the M1's. */
  .m1-screen__bezel {
    position: relative;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 40%, #e9e9ea, #9c9ca0);
    display: grid;
    place-items: center;
    box-shadow: 0 30px 60px rgb(0 0 0 / 60%);
    transform: translateY(var(--drop, 0)) scale(var(--fit, 1));
  }

  .m1-screen__frame {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 480px;
    height: 480px;
    margin: -240px 0 0 -240px;
    border: 0;
    border-radius: 50%;
    transform: scale(0.625);
    background: #000;
    box-shadow: 0 0 0 3px #222, 0 0 0 5px rgb(128 214 209 / 55%);
  }

  /*
   * The camera has flown in to the model's own screen, straight down: the stage is left clear (the model's screen and its
   * knob are what is framed, and a scroll or a click there goes to the knob), and the live screen sits on the disc. It
   * fades in as the camera arrives, and goes at once on the way out.
   */
  .m1-screen--camera {
    pointer-events: none;
    background: transparent;
    backdrop-filter: none;

    .m1-screen__strip,
    .m1-screen__bezel,
    .m1-screen__note {
      pointer-events: auto;
    }

    .m1-screen__bezel {
      position: absolute;
      left: calc(var(--ring-x) - var(--ring-d) / 2);
      top: calc(var(--ring-y) - var(--ring-d) / 2);
      width: var(--ring-d);
      height: var(--ring-d);
      background: transparent;
      box-shadow: none;
      transform: none;
      opacity: 1;
      transition: opacity calc(var(--fly-ms, 380ms) * 0.45) ease calc(var(--fly-ms, 380ms) * 0.55);
    }

    .m1-screen__frame {
      transform: scale(var(--ring-k));
      box-shadow: 0 0 0 2px rgb(128 214 209 / 40%);
    }

    &.m1-screen--in .m1-screen__bezel {
      opacity: 0;
      transform: none;
    }

    &.m1-screen--out .m1-screen__bezel {
      opacity: 0;
      transform: none;
      transition-delay: 0s;
      transition-duration: 0.12s;
    }
  }

  .m1-screen__note {
    position: absolute;
    bottom: 16px;
    margin: 0;
    padding: 6px 12px;
    border: 0;
    cursor: pointer;
    border-radius: 999px;
    background: rgb(36 36 40 / 86%);
    color: #ffc48a;
    font-size: 12px;
  }
</style>
