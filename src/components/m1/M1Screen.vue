<template>
  <div
    class="m1-screen"
    data-tid="m1-screen"
    @click.self="$emit('close')"
  >
    <div class="m1-screen__strip">
      <span class="m1-screen__live"><span class="m1-screen__dot" />Live</span>
      <span class="m1-screen__what">Using {{ printerName }}'s screen</span>
      <span class="m1-screen__hint">Esc or click outside to leave</span>
      <button
        type="button"
        class="m1-screen__done"
        data-tid="m1-screen-done"
        @click="$emit('close')"
      >
        Done
      </button>
    </div>
    <div class="m1-screen__bezel">
      <iframe
        ref="frame"
        class="m1-screen__frame"
        src="/panel/"
        sandbox="allow-scripts"
        title="The printer's screen"
        data-tid="m1-screen-frame"
        referrerpolicy="same-origin"
      />
    </div>
    <p
      v-if="refusedLast"
      class="m1-screen__note"
      role="status"
      data-tid="m1-screen-refused"
    >
      That one is done on the printer itself.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { PanelBridge } from '@/services/panel-embed/bridge'
import { httpClientActions } from '@/api/httpClientActions'
import { NOTIFY_ACTIONS } from '@/services/panel-embed/allow'

/** Each view's bridge, kept out of Vue's reach: Vue must not walk it or its port. */
const bridges = new WeakMap<object, PanelBridge>()

/**
 * The printer's own screen, used from Control (SCREEN-PLAN.md, Jack 6 Nov):
 * MuonUI's embed build at /panel/, framed on Control's own origin, with no
 * network of its own. Everything it asks goes through PanelBridge on
 * Control's connection, after the allowlist; anything meant to be done on the
 * printer itself is refused there and tagged "Confirm on the printer" in the
 * screen. The knob is the mouse wheel and a click, inside the frame.
 */
@Component
export default class M1Screen extends Vue {
  stopActions: (() => void) | null = null
  refusedLast = false
  refusedTimer = 0

  get printerName (): string {
    return (this.$store.getters['config/getDisplayName'] as string | undefined) || 'the printer'
  }

  mounted () {
    const frame = this.$refs.frame as HTMLIFrameElement
    bridges.set(this, new PanelBridge(frame, {
      rpc: async (method, params) => {
        const result = await this.$socket.emit(method, { params })
        if (result === undefined) throw new Error('The printer refused that.')
        return result
      },
      auxGet: async path => (await httpClientActions.get(`/server/aux${path}`)).data,
      status: () => this.$store.state.printer.printer as Record<string, unknown>,
      connectionId: () => (this.$store.state.socket.connectionId as number | null) ?? null
    }, {
      onRefused: () => {
        this.refusedLast = true
        clearTimeout(this.refusedTimer)
        this.refusedTimer = window.setTimeout(() => { this.refusedLast = false }, 4000)
      }
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
    document.addEventListener('keydown', this.onKey)
  }

  beforeDestroy () {
    document.removeEventListener('keydown', this.onKey)
    this.stopActions?.()
    bridges.get(this)?.dispose()
    bridges.delete(this)
    clearTimeout(this.refusedTimer)
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

  onKey (e: KeyboardEvent) {
    if (e.key === 'Escape') this.$emit('close')
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
  }

  .m1-screen__strip {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
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
  }

  .m1-screen__hint {
    color: #98989d;
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

  .m1-screen__note {
    position: absolute;
    bottom: 16px;
    margin: 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgb(36 36 40 / 86%);
    color: #ffc48a;
    font-size: 12px;
  }
</style>
