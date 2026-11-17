<template>
  <div
    class="wifi-page"
    :class="{ 'wifi-page--phone': isMobileViewport }"
    data-tid="wifi-page"
  >
    <p
      class="wifi-route"
      data-tid="wifi-route"
    >
      <span
        class="wifi-route__pill"
        data-tid="wifi-route-pill"
      >{{ routeText }}</span>
      <span>{{ routeLine }}</span>
    </p>
    <div class="stiles">
      <wifi-manager-card />
      <section
        class="stile wifi-ble"
        data-tid="wifi-bluetooth"
      >
        <header class="stile__head">
          <frame-icon name="bluetooth" />
          <h2>Bluetooth</h2>
        </header>
        <p
          class="stile__note"
          data-tid="wifi-bluetooth-line"
        >
          {{ bluetoothLine }}
        </p>
      </section>
      <hotspot-manager-card />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { bluetoothCarrying, remoteRouteLabel } from '@/services/muon-ble/link'

/**
 * Wi-Fi and network (Settings): one Wi-Fi box (the network the printer
 * is on and the ones it hears, to join, leave or forget), then Bluetooth, then
 * its own hotspot (to turn on or off and rename). Wi-Fi works over any route:
 * the Aux API on the printer's network, muon-link's own routes over Bluetooth
 * and Muon3D (KAN-3601). The hotspot still says so when a remote connection
 * rules changes out.
 */
@Component({ components: { WifiManagerCard, HotspotManagerCard, FrameIcon } })
export default class Wifi extends Mixins(BrowserMixin) {
  /** Display only, from the connection state Control already has: how this browser reaches the printer. */
  get remote (): boolean {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.$store.state.config.apiUrl as string | null)
  }

  get routeText (): string {
    return this.remote ? remoteRouteLabel(cloudState.activePrinterId) : 'On this network'
  }

  get routeLine (): string {
    return this.remote ? 'Changes to Wi-Fi are made over this connection.' : 'This browser reaches the printer directly.'
  }

  get bluetoothOn (): boolean {
    return !!cloudState.activePrinterId && bluetoothCarrying(cloudState.activePrinterId)
  }

  get bluetoothLine (): string {
    return this.bluetoothOn ? 'Carrying this connection now.' : 'Not carrying this connection. Pair a phone or computer from the Bluetooth sheet.'
  }
}
</script>

<style lang="scss" scoped>
  .wifi-route {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .wifi-route__pill {
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }

  // One column of boxes: the Wi-Fi box (the network it is on, and the others),
  // then Bluetooth, then the hotspot (KAN-3607).
  .wifi-page :deep(.wf__span) {
    grid-column: span 12;
  }

  .wifi-page :deep(.hs--page) {
    grid-column: span 12;
  }

  // On a phone the list is the page: no side detail, one short row per
  // network, so scrolling it is one gesture and not a hunt.
  .wifi-page--phone .stiles {
    gap: 12px;
  }

  .wifi-page--phone :deep(.stile) {
    padding: 14px;
  }

  .wifi-page--phone :deep(.wf__detail),
  .wifi-page--phone :deep(.wf__net .wf__bars) {
    display: none;
  }

  .wifi-page--phone :deep(.wf__net .srow__s) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wifi-page--phone :deep(.wf__net) {
    min-height: 56px;
    gap: 10px;
  }
</style>
