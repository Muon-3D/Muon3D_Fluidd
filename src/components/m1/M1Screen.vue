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
      <iframe
        v-else-if="served"
        ref="frame"
        class="m1-screen__frame"
        src="/panel/"
        sandbox="allow-scripts"
        title="The printer's screen"
        data-tid="m1-screen-frame"
        referrerpolicy="same-origin"
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
import { httpClientActions } from '@/api/httpClientActions'
import { NOTIFY_ACTIONS } from '@/services/panel-embed/allow'
import { wheelDetents } from '@/services/m1-3d/knob'

/** The zoom in from the model's screen, and back out to it, ms. */
const FLY_MS = 380
/** The bezel's drawn size, and the room the top strip takes, px. */
const BEZEL_PX = 340
const STRIP_PX = 64

/** Whether this Control serves the printer screen's embed build at /panel/. */
async function panelServed (): Promise<boolean> {
  try {
    const r = await fetch('/panel/index.html', { method: 'HEAD', cache: 'no-store' })
    return r.ok && (r.headers.get('content-type') ?? '').includes('text/html')
  } catch {
    return false
  }
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
  /** /panel/ is served here: null until known. */
  served: boolean | null = null
  flyTimer = 0
  flight: Record<string, string> = {}
  stopActions: (() => void) | null = null
  refusedLast = false
  refusedText = ''

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

  /** A scroll on the strip or the stage around the screen turns the model's knob (the picture only); the embedded screen's own scroll is its own. */
  onWheel (e: WheelEvent) {
    if (!this.ring) return
    e.preventDefault()
    this.$emit('turn', wheelDetents(e.deltaY, e.deltaMode))
  }

  async mounted () {
    document.addEventListener('keydown', this.onKey)
    this.ring = this.viewer?.screenCircle() ?? null
    this.flight = this.flyFrom()
    // The next frame, so the zoom starts from the screen on the model.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.phase === 'in') this.phase = 'open'
    }))
    const served = await panelServed()
    if (this.phase === 'out' || (this as unknown as { _isDestroyed?: boolean })._isDestroyed) return
    this.served = served
    if (served) this.$nextTick(() => this.connect())
  }

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
    bridges.set(this, new PanelBridge(frame, {
      rpc: async (method, params) => {
        const why = this.rpcRefusal(method)
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
      }
    }, {
      onRefused: () => this.say("Confirm on the printer. Control can't do that one for you.")
    }))
    // Moonraker's notifications, as Control's socket passes them to the store, passed on.
    this.stopActions = this.$store.subscribeAction(action => {
      const bridge = bridges.get(this)
      if (!bridge) return
      if (action.type === 'printer/onFastNotifyStatusUpdate') {
        const { key, payload } = action.payload as { key: string, payload: unknown }
        bridge.notify('notify_status_update', [{ [key]: payload }])
      } else if (action.type in NOTIFY_ACTIONS) {
        bridge.notify(NOTIFY_ACTIONS[action.type], [action.payload])
      }
    })
  }

  /** The model's knob was turned or pressed: the framed screen gets it as its own knob. */
  knob (input: { turn: number } | { press: true }) {
    bridges.get(this)?.knob(input)
  }

  beforeDestroy () {
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

  get connectionKey (): string {
    const s = this.$store.state.socket
    return `${this.$store.state.config.apiUrl ?? ''}|${s.connectionId ?? ''}|${s.open ? 1 : 0}|${this.$store.state.printer.printer.webhooks?.state ?? ''}`
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
  rpcRefusal (method: string): string {
    switch (method) {
      case 'printer.emergency_stop':
        return this.authenticated && this.socketConnected && this.klippyReady ? '' : this.controlLock || this.notReadyReason
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
