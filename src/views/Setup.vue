<template>
  <div class="muon-setup">
    <header class="muon-setup__header">
      <span class="muon-wordmark">MUON3D</span>
      <span
        v-if="state"
        class="muon-setup__printer"
      >{{ state.printer.display }}</span>
      <label
        v-if="languages.length > 1"
        class="muon-setup__language"
      >
        <span class="muon-setup__visually-hidden">{{ $t('app.muon.setup.language') }}</span>
        <select
          :value="pageLanguage"
          @change="onLanguageChange"
        >
          <option
            v-for="language in languages"
            :key="language.code"
            :value="language.code"
          >{{ language.endonym }}</option>
        </select>
      </label>
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

    <main
      class="muon-setup__body"
      :class="{ 'is-framed': framed }"
    >
      <!-- The printer answered, but its software has no phone setup. -->
      <setup-step-card
        v-if="unavailable"
        :title="$t('app.muon.setup.unavailable.title').toString()"
      >
        <p>{{ $t('app.muon.setup.unavailable.body') }}</p>
        <a
          class="muon-setup__open"
          :href="fluiddUrl"
        >{{ $t('app.muon.setup.open_printer') }}</a>
      </setup-step-card>

      <!-- S0: no footer until the printer answers. -->
      <setup-step-card
        v-else-if="screen === 'S0'"
        :title="$t('app.muon.setup.connecting.title').toString()"
        :sub="waitedLong ? $t('app.muon.setup.connecting.stay_on_wifi', { ssid: hotspotSsid }).toString() : ''"
        data-tid="setup-connecting"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          class="muon-setup__spinner"
        />
      </setup-step-card>

      <setup-step-card
        v-else-if="screen === 'S10'"
        :title="$t('app.muon.setup.set_up.title', { name: printerName }).toString()"
      >
        <a
          class="muon-setup__open"
          :href="fluiddUrl"
        >{{ $t('app.muon.setup.open', { name: printerName }) }}</a>
      </setup-step-card>

      <template v-else>
        <setup-step-list
          class="muon-setup__steps"
          :steps="steps"
        />
        <div class="muon-setup__card">
          <setup-wifi-steps :client="client">
            <template #done>
              <a
                v-if="screen === 'S8'"
                class="muon-setup__open"
                :href="fluiddUrl"
              >{{ $t('app.muon.setup.open', { name: printerName }) }}</a>
            </template>
            <template #elsewhere>
              <p class="muon-setup__muted">
                {{ $t('app.muon.setup.continue_on_printer', { name: printerName }) }}
              </p>
            </template>
          </setup-wifi-steps>
          <!-- S1 offers the printer's full page too. -->
          <a
            v-if="screen === 'S1'"
            class="muon-setup__open muon-setup__full"
            :href="fluiddUrl"
          >{{ $t('app.muon.setup.open', { name: printerName }) }}</a>
        </div>
      </template>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { loadLocaleMessagesAsync } from '@/plugins/i18n'
import { setupClient, type SetupClient } from '@/services/muon-setup/client'
import { pageLanguageFor } from '@/services/muon-setup/language'
import { screenFor, type ScreenId } from '@/services/muon-setup/screen'
import { frameSteps, type FrameStep } from '@/services/muon-setup/steps'
import { setupState } from '@/services/muon-setup/state'
import type { SetupOptions, SetupState } from '@/services/muon-setup/types'
import SetupStepCard from '@/components/muon-setup/SetupStepCard.vue'
import SetupStepList from '@/components/muon-setup/SetupStepList.vue'
import SetupWifiSteps from '@/components/muon-setup/SetupWifiSteps.vue'

/** The reconnect banner shows after 2 s without the printer (05 §4)... */
const BANNER_AFTER_MS = 2000
/** ...and after 30 s adds "Check the printer's screen". */
const CHECK_SCREEN_AFTER_MS = 30000
/** S0 adds its Wi-Fi reminder after 10 s. */
const S0_HINT_AFTER_MS = 10000

@Component<Setup>({
  components: { SetupStepCard, SetupStepList, SetupWifiSteps },
  metaInfo () {
    return {
      title: this.$t('app.muon.setup.title', { name: this.printerName }).toString()
    }
  }
})
export default class Setup extends Vue {
  now = Date.now()
  mountedAt = Date.now()
  languages: SetupOptions['languages'] = []
  /** The switcher's choice, before the language step is done. */
  chosenLanguage: string | null = null
  private ticker: number | null = null

  get state (): SetupState | null {
    return setupState.state
  }

  get unavailable (): boolean {
    return setupState.unavailable
  }

  get screen (): ScreenId {
    return screenFor(setupState.state, setupState.local)
  }

  get client (): SetupClient {
    return setupClient()
  }

  /** The step list and card, once there is a step to show. */
  get framed (): boolean {
    return !this.unavailable && this.screen !== 'S0' && this.screen !== 'S10'
  }

  get steps (): FrameStep[] {
    return frameSteps(this.state, this.screen)
  }

  get printerName (): string {
    return this.state?.printer.name ?? 'Muon3D'
  }

  get hotspotSsid (): string {
    return this.state?.hotspot.ssid ?? 'Muon-…'
  }

  /**
   * The printer's full page. A plain link, which loads Fluidd fresh (05 §2);
   * a captive-portal window ignores new windows, so no target.
   */
  get fluiddUrl (): string {
    return new URL(import.meta.env.BASE_URL || '/', window.location.href).href
  }

  get pageLanguage (): string {
    return pageLanguageFor(
      this.state,
      this.languages.map(l => l.code),
      navigator.languages ?? [navigator.language],
      this.chosenLanguage
    )
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

  // Only the one locale file, and never config/onLocaleChange, which blanks
  // App.vue while it loads (05 §9).
  @Watch('pageLanguage', { immediate: true })
  onPageLanguage (language: string) {
    loadLocaleMessagesAsync(language)
  }

  onLanguageChange (event: Event) {
    this.chooseLanguage((event.target as HTMLSelectElement).value)
  }

  async chooseLanguage (code: string) {
    this.chosenLanguage = code
    if (this.state?.steps.language.status === 'pending') {
      await setupClient().post('language', { code }).catch(() => null)
    }
  }

  async loadLanguages () {
    try {
      this.languages = (await setupClient().options()).languages ?? []
    } catch { /* no muon_setup yet, or the printer is away: no switcher */ }
  }

  created () {
    // The page's own client, not Fluidd's socket: it must never run appInit
    // or switch printers (05 §2).
    setupClient().start()
    this.loadLanguages()
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
  max-width: 920px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
  color: var(--m3d-text);
}

.muon-setup__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.muon-setup__language {
  margin-left: auto;
}

.muon-setup__language select {
  min-height: 44px;
  color: inherit;
  background: transparent;
}

.muon-setup__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.muon-setup__body {
  max-width: 560px;
  margin: 0 auto;
  padding-top: 24px;

  &.is-framed {
    display: grid;
    grid-template-columns: 220px minmax(0, 560px);
    gap: 32px;
    max-width: none;
    align-items: start;
  }
}

.muon-setup__muted {
  color: var(--m3d-text-muted);
  font-size: var(--m3d-text-sm);
}

.muon-setup__open {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
}

.muon-setup__full {
  margin-top: 8px;
}

.muon-setup__spinner {
  margin: 8px 0;
}

@media (max-width: 1023px) {
  .muon-setup__body.is-framed {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 20px;
  }
}

@media (max-width: 699px) {
  .muon-setup {
    padding: 12px;
  }

  .muon-setup__body {
    padding-top: 8px;

    &.is-framed {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
  }
}

:root.m3d-reduced-motion {
  .muon-setup__spinner ::v-deep svg {
    animation: none;
  }
}
</style>
