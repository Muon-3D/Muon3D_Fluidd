<template>
  <div class="muon-setup">
    <header class="muon-setup__header">
      <span class="muon-wordmark">MUON3D</span>
      <span
        v-if="state"
        class="muon-setup__printer"
      >{{ state.printer.display }}</span>
      <span
        v-if="progress"
        class="muon-setup__progress"
      >{{ $t('app.muon.setup.progress', progress) }}</span>
    </header>

    <div
      class="muon-setup__status"
      role="status"
      aria-live="polite"
    >
      <p v-if="showReconnecting">
        {{ $t('app.muon.setup.reconnecting.title', { name: printerName }) }}
        <template v-if="showCheckScreen">
          {{ $t('app.muon.setup.reconnecting.check_screen', { name: printerName, ssid: hotspotSsid }) }}
        </template>
      </p>
    </div>

    <main class="muon-setup__body">
      <template v-if="screen === 'S0'">
        <v-progress-circular
          indeterminate
          color="primary"
          class="muon-setup__spinner"
        />
        <p>{{ $t('app.muon.setup.connecting.title') }}</p>
        <p v-if="waitedLong">
          {{ $t('app.muon.setup.connecting.stay_on_wifi', { ssid: hotspotSsid }) }}
        </p>
      </template>

      <!-- The screens themselves arrive with FL-3. Until then the panel,
           which can finish every step on its own, carries the owner on. -->
      <p v-else>
        {{ $t('app.muon.setup.continue_on_printer', { name: printerName }) }}
      </p>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { setupClient } from '@/services/muon-setup/client'
import { progressFor, screenFor, type ScreenId } from '@/services/muon-setup/screen'
import { setupState } from '@/services/muon-setup/state'
import type { SetupState } from '@/services/muon-setup/types'

/** The reconnect banner shows after 2 s without the printer (05 §4)... */
const BANNER_AFTER_MS = 2000
/** ...and after 30 s adds "Check the printer's screen". */
const CHECK_SCREEN_AFTER_MS = 30000
/** S0 adds its Wi-Fi reminder after 10 s. */
const S0_HINT_AFTER_MS = 10000

@Component<Setup>({
  metaInfo () {
    return {
      title: this.$t('app.muon.setup.title', { name: this.printerName }).toString()
    }
  }
})
export default class Setup extends Vue {
  now = Date.now()
  mountedAt = Date.now()
  private ticker: number | null = null

  get state (): SetupState | null {
    return setupState.state
  }

  get screen (): ScreenId {
    return screenFor(setupState.state, setupState.local)
  }

  get progress () {
    return this.state ? progressFor(this.state) : null
  }

  get printerName (): string {
    return this.state?.printer.name ?? 'Muon3D'
  }

  get hotspotSsid (): string {
    return this.state?.hotspot.ssid ?? 'Muon-…'
  }

  get disconnectedFor (): number {
    const since = setupState.disconnectedSince
    return since === null ? 0 : this.now - since
  }

  get showReconnecting (): boolean {
    return this.state !== null && this.disconnectedFor >= BANNER_AFTER_MS
  }

  get showCheckScreen (): boolean {
    return this.disconnectedFor >= CHECK_SCREEN_AFTER_MS
  }

  get waitedLong (): boolean {
    return this.now - this.mountedAt >= S0_HINT_AFTER_MS
  }

  created () {
    // The page's own client, not Fluidd's socket: it must never run appInit
    // or switch printers (05 §2).
    setupClient().start()
    this.ticker = window.setInterval(() => { this.now = Date.now() }, 1000)
  }

  destroyed () {
    setupClient().stop()
    if (this.ticker !== null) window.clearInterval(this.ticker)
  }
}
</script>

<style lang="scss" scoped>
.muon-setup {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  color: var(--m3d-text);
}

.muon-setup__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.muon-setup__progress {
  margin-left: auto;
  opacity: 0.7;
}

.muon-setup__body {
  text-align: center;
  padding-top: 48px;
}

.muon-setup__spinner {
  margin-bottom: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .muon-setup__spinner ::v-deep svg {
    animation: none;
  }
}
</style>
