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
      <hotspot-manager-card />
    </div>
    <div
      class="wifi-ble"
      data-tid="wifi-bluetooth"
    >
      <frame-icon name="bluetooth" />
      <span class="wifi-ble__text">
        <b>Bluetooth</b>
        <span data-tid="wifi-bluetooth-line">{{ bluetoothLine }}</span>
      </span>
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
 * Wi-Fi and network (Settings): the network the printer is on, the
 * networks it hears (to join, leave or forget), its own hotspot (to turn
 * on or off and rename). The Wi-Fi and
 * hotspot parts talk to MuonOS's Aux API, and both say so instead when
 * network protection or a remote connection (Iroh) rules changes out.
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

  .wifi-ble {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 14px 18px;
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font-size: 14px;
  }

  .wifi-ble__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  // The cards' tiles sit in this grid, in the order the mockup has them:
  // the notices, the network it is on and the hotspot, then the list.
  .wifi-page :deep(.wf__span) {
    grid-column: span 12;
    order: 0;
  }

  .wifi-page :deep(.wf__connected) {
    order: 1;
  }

  .wifi-page :deep(.hs--page) {
    order: 2;
  }

  .wifi-page :deep(.wf__available) {
    order: 3;
  }

  // The network it is on and the hotspot are one pair: the same height.
  .wifi-page :deep(.wf__connected),
  .wifi-page :deep(.hs--page) {
    align-self: stretch;
    min-height: var(--wifi-pair-min, 0);
  }

  // Stacked (narrow screens) the two sit in separate rows, so give both one floor.
  @media (max-width: 1100px) {
    .wifi-page {
      --wifi-pair-min: 340px;
    }
  }

  .wifi-page--phone .stiles {
    gap: 12px;
  }
</style>
