<template>
  <div
    class="wifi-page"
    :class="{ 'wifi-page--phone': isMobileViewport }"
    data-tid="wifi-page"
  >
    <div class="stiles">
      <wifi-manager-card />
      <hotspot-manager-card />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'

/**
 * Wi-Fi and network (Settings): the network the printer is on, the
 * networks it hears (to join, leave or forget), its own hotspot (to turn
 * on or off and rename). The Wi-Fi and
 * hotspot parts talk to MuonOS's Aux API, and both say so instead when
 * network protection or a remote connection (Iroh) rules changes out.
 */
@Component({ components: { WifiManagerCard, HotspotManagerCard } })
export default class Wifi extends Mixins(BrowserMixin) {}
</script>

<style lang="scss" scoped>
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
