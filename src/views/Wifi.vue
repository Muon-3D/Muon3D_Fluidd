<template>
  <div
    class="wifi-page"
    :class="{ 'wifi-page--phone': isMobileViewport }"
    data-tid="wifi-page"
  >
    <div class="stiles">
      <wifi-manager-card />
      <hotspot-manager-card />
      <section
        class="stile stile--4 wifi-page__cable"
        data-tid="wifi-ethernet"
      >
        <header class="stile__head">
          <frame-icon name="link" />
          <h2>Ethernet</h2>
          <span class="stile__aside">
            <tone-pill
              :tone="cable ? 'ok' : 'off'"
              :dot="!!cable"
            >
              {{ cable ? 'Connected' : 'No cable' }}
            </tone-pill>
          </span>
        </header>
        <p
          v-if="cable"
          class="stile__note"
        >
          On <span class="wifi-page__mono">{{ cable.ip }}</span>. The printer uses the cable first, and Wi-Fi stays as a spare.
        </p>
        <p
          v-else
          class="stile__note"
        >
          Plug in a cable and the printer uses it first. Wi-Fi stays as a spare.
        </p>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'
import TonePill from '@/components/printers/TonePill.vue'
import { interfaceIp } from '@/services/system/model'

/**
 * Wi-Fi and network (Settings): the network the printer is on, the
 * networks it hears (to join, leave or forget), its own hotspot (to turn
 * on or off and rename), and whether a cable is plugged in. The Wi-Fi and
 * hotspot parts talk to MuonOS's Aux API, and both say so instead when
 * network protection or a remote connection (Iroh) rules changes out.
 */
@Component({ components: { WifiManagerCard, HotspotManagerCard, TonePill } })
export default class Wifi extends Mixins(BrowserMixin) {
  /** The cable's address, from the computer's own report of its interfaces; null with no cable. */
  get cable (): { name: string, ip: string } | null {
    const info = this.$store.getters['server/getSystemInfo'] as { network?: Record<string, { ip_addresses?: Array<{ family?: string, address?: string }> }> } | null
    return interfaceIp(info?.network, ['eth', 'en'])
  }
}
</script>

<style lang="scss" scoped>
  // The cards' tiles sit in this grid, in the order the mockup has them:
  // the notices, the network it is on and the hotspot, then the list and the cable.
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

  .wifi-page__cable {
    order: 4;
  }

  .wifi-page__mono {
    font-family: var(--m3d-font-mono, monospace);
  }

  .wifi-page--phone .stiles {
    gap: 12px;
  }
</style>
