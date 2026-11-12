<template>
  <div
    v-if="reason || droppedSheet"
    class="ble-fallback"
    role="status"
    aria-live="polite"
    data-tid="bluetooth-fallback"
  >
    <frame-icon
      name="wifi"
      class="ble-fallback__icon"
    />
    <div class="ble-fallback__text">
      <template v-if="droppedSheet">
        <strong>Bluetooth dropped</strong>
        <span data-tid="bluetooth-dropped-reason">{{ droppedSheet.reason }} Choose how to connect to {{ droppedSheet.name }}.</span>
        <span
          v-if="droppedSheet.retrying"
          data-tid="bluetooth-dropped-retrying"
        >Trying Bluetooth again…</span>
      </template>
      <template v-else>
        <strong>Bluetooth didn't connect, using Muon3D instead</strong>
        <span>{{ reason }}</span>
      </template>
    </div>
    <div
      v-if="droppedSheet"
      class="ble-fallback__actions"
    >
      <button
        v-for="choice in droppedSheet.choices"
        :key="choice.id"
        type="button"
        :data-tid="`bluetooth-dropped-${choice.id}`"
        :disabled="droppedSheet.retrying"
        @click="choose(choice.id)"
      >
        {{ choice.label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import { cloudState } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'
import { discoverPrinters } from '@/services/muon-cloud/discovery'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'
import {
  bluetoothCarrying,
  bluetoothDeviceFor,
  bluetoothDropped,
  bluetoothDroppedAt,
  bluetoothFellBack,
  droppedBluetoothPrinters
} from '@/services/muon-ble/link'
import { nearbyState } from '@/services/muon-ble/nearby'
import { webBluetooth } from '@/services/muon-ble/webBluetooth'
import {
  autoMove,
  chooseRouteMode,
  dropChoices,
  routeMode,
  type DropChoice,
  type Route,
  type RouteAvailability
} from '@/services/muon-cloud/route-choice'

/** How long auto mode waits on a route change before acting on it: a blip is not a change. */
export const AUTO_SETTLE_MS = 3_000
/** How often auto mode looks for a better route than the one it is on. */
export const AUTO_LOOK_MS = 1_000
/** How often auto mode asks whether the printer answers on this network, when it is not on it. */
export const AUTO_DISCOVER_MS = 30_000

interface DroppedSheet {
  id: string;
  name: string;
  reason: string;
  choices: DropChoice[];
  retrying: boolean;
}

/**
 * The connection sheet over every page (KAN-1396, KAN-1913, KAN-2080):
 *
 * - The Bluetooth route the person chose dropped. Control does not move the
 *   session anywhere on its own: it says "Bluetooth dropped" and offers
 *   Connect on local network (only when this page can reach it there),
 *   Connect via cloud, and Try Bluetooth again. Bluetooth coming back (the
 *   radio on again, or the printer heard again) tries it again by itself. A
 *   try that fails leaves the sheet up with the same three choices.
 * - Auto mode (plain Connect): keeps the session on the best route there is,
 *   local network, then cloud, then Bluetooth, and moves back up when a
 *   better one returns.
 *
 * The drop is not assumed to be the radio going away: the link can stay up
 * while carrying nothing (the bench, 12 Nov), so the words say what was seen.
 */
@Component({})
export default class BluetoothFallbackBanner extends Mixins(PrinterEntriesMixin) {
  retrying = false
  /** When Bluetooth was last seen coming back, so one return gives one automatic try. */
  lastReturn = 0
  autoTimer: ReturnType<typeof setInterval> | null = null
  /** The move auto mode is waiting to make, and since when. */
  pendingMove: { to: Route, since: number } | null = null
  lastDiscover = 0

  get reason (): string | null {
    const id = cloudState.activePrinterId
    return id ? bluetoothFellBack(id) : null
  }

  /** The printer whose dropped route the sheet is about: the open one first, else any. */
  get droppedId (): string | null {
    const active = cloudState.activePrinterId
    if (active && bluetoothDropped(active)) return active
    return droppedBluetoothPrinters()[0] ?? null
  }

  get allEntries (): DirectoryEntry[] {
    const d = this.directory
    return [...d.cloud, ...d.local, ...d.found]
  }

  entryFor (id: string | null): DirectoryEntry | null {
    if (!id) return null
    const lower = id.toLowerCase()
    return this.allEntries.find(e => e.cloud?.id.toLowerCase() === lower || e.endpointId?.toLowerCase() === lower) ?? null
  }

  lanReachable (e: DirectoryEntry | null): boolean {
    return !!e && (!!e.lan || !!e.host)
  }

  get droppedSheet (): DroppedSheet | null {
    const id = this.droppedId
    if (!id) return null
    const reason = bluetoothDropped(id)
    if (!reason) return null
    // Auto mode moves on by itself; the sheet is for a route the person chose,
    // and for auto mode with nowhere left to go.
    if (routeMode(id) === 'auto' && this.availability(id).cloud) return null
    const e = this.entryFor(id)
    return {
      id,
      name: e?.name ?? 'the printer',
      reason,
      choices: dropChoices(this.lanReachable(e)),
      retrying: this.retrying
    }
  }

  async choose (choice: DropChoice['id']) {
    const sheet = this.droppedSheet
    if (!sheet) return
    const e = this.entryFor(sheet.id)
    if (!e) return
    if (choice === 'lan') return this.connectLocal(e)
    if (choice === 'cloud') return this.connectCloud(e, 'relay')
    return this.tryBluetoothAgain(sheet.id)
  }

  async tryBluetoothAgain (id: string) {
    const e = this.entryFor(id)
    const device = bluetoothDeviceFor(id) ?? e?.nearby?.device ?? null
    if (!e || this.retrying) return
    this.retrying = true
    try {
      if (device) await this.connectCloud(e, device)
      else await this.connectOverBluetooth(e)
    } finally {
      this.retrying = false
    }
  }

  // -- Bluetooth coming back -------------------------------------------------

  /** The newest sign that Bluetooth is back for the dropped printer: the radio on, or the printer heard. */
  get bluetoothBackAt (): number {
    const id = this.droppedId
    if (!id || this.radioOff) return 0
    const heard = nearbyState.printers
      .filter(p => p.endpointId?.toLowerCase() === id.toLowerCase())
      .reduce((latest, p) => Math.max(latest, p.heardAt), 0)
    const radioBack = this.radioOff ? 0 : this.radioOnAt
    const back = Math.max(heard, radioBack)
    return back > bluetoothDroppedAt(id) ? back : 0
  }

  radioOnAt = 0
  /** The radio as this sheet last heard it: the Printers page's own listener stops when it closes. */
  radioHeard: 'on' | 'off' | null = null

  get radioOff (): boolean {
    return (this.radioHeard ?? nearbyState.radio) === 'off'
  }

  get radio () {
    return nearbyState.radio
  }

  @Watch('radio')
  onRadio (now: string, before: string) {
    if (now === 'on' && before === 'off') this.radioOnAt = Date.now()
  }

  onAvailability (event: Event) {
    const value = (event as Event & { value?: boolean }).value
    if (typeof value !== 'boolean') return
    const was = this.radioHeard ?? nearbyState.radio
    this.radioHeard = value ? 'on' : 'off'
    if (value && was !== 'on') this.radioOnAt = Date.now()
  }

  @Watch('bluetoothBackAt')
  onBluetoothBack (at: number) {
    const sheet = this.droppedSheet
    if (!at || at <= this.lastReturn || !sheet) return
    if (!sheet.choices.some(c => c.id === 'ble')) return
    this.lastReturn = at
    this.tryBluetoothAgain(sheet.id)
  }

  // -- auto mode -------------------------------------------------------------

  availability (id: string): RouteAvailability {
    const e = this.entryFor(id)
    return {
      lan: this.lanReachable(e),
      cloud: !!e?.cloud?.online,
      ble: (!!e?.nearby || !!bluetoothDeviceFor(id)) && !this.radioOff
    }
  }

  /** The printer auto mode looks after: the open one, when it was opened with plain Connect. */
  get autoId (): string | null {
    const active = cloudState.activePrinterId
    if (active) return routeMode(active) === 'auto' ? active : null
    const local = this.allEntries.find(e => e.active === 'local')
    const id = local?.cloud?.id ?? local?.endpointId ?? null
    return id && routeMode(id) === 'auto' ? id : null
  }

  /** The route the open printer's session is on, or null when it is down. */
  currentRoute (id: string): Route | null {
    const socket = this.$store.state.socket
    const live = !!socket?.open
    if (cloudState.activePrinterId?.toLowerCase() === id.toLowerCase()) {
      if (bluetoothDropped(id)) return null
      if (!live) return null
      return bluetoothCarrying(id) ? 'ble' : 'cloud'
    }
    return live ? 'lan' : null
  }

  autoTick () {
    const id = this.autoId
    if (!id || this.busyKey || activationState.switching || this.retrying) {
      this.pendingMove = null
      return
    }
    const now = Date.now()
    const current = this.currentRoute(id)
    if (current !== 'lan' && now - this.lastDiscover > AUTO_DISCOVER_MS) {
      this.lastDiscover = now
      discoverPrinters(false, { nearby: false }).catch(() => {})
    }
    const to = autoMove(current, this.availability(id))
    if (!to) {
      this.pendingMove = null
      return
    }
    if (this.pendingMove?.to !== to) {
      this.pendingMove = { to, since: now }
      return
    }
    if (now - this.pendingMove.since < AUTO_SETTLE_MS) return
    this.pendingMove = null
    const e = this.entryFor(id)
    if (!e) return
    if (to === 'lan') this.connectLocal(e, true)
    else if (to === 'cloud') this.openAuto(e, 'relay')
    else {
      const device = bluetoothDeviceFor(id) ?? e.nearby?.device
      if (device) this.openAuto(e, device)
    }
  }

  /** An auto-mode move: the same open as a chosen route, but the choice stays auto. */
  openAuto (e: DirectoryEntry, route: Parameters<PrinterEntriesMixin['connectCloud']>[1]) {
    const result = this.connectCloud(e, route)
    if (e.cloud) chooseRouteMode(e.cloud.id, 'auto')
    return result
  }

  /** The switcher closes after an open; here there is nothing to close. */
  afterOpen () {}

  mounted () {
    this.autoTimer = setInterval(() => this.autoTick(), AUTO_LOOK_MS)
    webBluetooth()?.addEventListener('availabilitychanged', this.onAvailability)
  }

  beforeDestroy () {
    if (this.autoTimer) clearInterval(this.autoTimer)
    webBluetooth()?.removeEventListener('availabilitychanged', this.onAvailability)
  }
}
</script>

<style lang="scss" scoped>
  .ble-fallback {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 16px;
    border-radius: 16px;
    color: var(--m3d-text);
    background: color-mix(in srgb, var(--m3d-warning) 16%, var(--m3d-surface));
  }

  .ble-fallback__icon {
    flex: none;
    color: var(--m3d-warning);
  }

  .ble-fallback__text {
    display: flex;
    flex: 1 1 240px;
    flex-wrap: wrap;
    gap: 2px 10px;
    min-width: 0;
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }
  }

  .ble-fallback__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    button {
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      color: var(--m3d-text);
      background: var(--m3d-surface);
      border: 1px solid color-mix(in srgb, var(--m3d-text) 20%, transparent);

      &:disabled {
        opacity: 0.5;
      }
    }
  }
</style>
