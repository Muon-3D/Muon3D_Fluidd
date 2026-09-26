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

    <main class="muon-setup__body">
      <!-- The printer answered, but its software has no phone setup. -->
      <template v-if="unavailable">
        <p class="muon-setup__title">
          {{ $t('app.muon.setup.unavailable.title') }}
        </p>
        <p>{{ $t('app.muon.setup.unavailable.body') }}</p>
        <a
          class="muon-setup__open"
          :href="fluiddUrl"
        >{{ $t('app.muon.setup.open_printer') }}</a>
      </template>

      <template v-else-if="screen === 'S0'">
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

      <template v-else-if="screen === 'S10'">
        <p class="muon-setup__title">
          {{ $t('app.muon.setup.set_up.title', { name: printerName }) }}
        </p>
        <a
          class="muon-setup__open"
          :href="fluiddUrl"
        >{{ $t('app.muon.setup.open', { name: printerName }) }}</a>
      </template>

      <!-- The other screens arrive with FL-3. Until then the panel, which can
           finish every step on its own, carries the owner on, and S1 offers
           the printer's full page too. -->
      <template v-else>
        <p>{{ $t('app.muon.setup.continue_on_printer', { name: printerName }) }}</p>
        <a
          v-if="screen === 'S1'"
          class="muon-setup__open"
          :href="fluiddUrl"
        >{{ $t('app.muon.setup.open', { name: printerName }) }}</a>
      </template>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { loadLocaleMessagesAsync } from '@/plugins/i18n'
import { setupClient } from '@/services/muon-setup/client'
import { pageLanguageFor } from '@/services/muon-setup/language'
import { progressFor, screenFor, type ScreenId } from '@/services/muon-setup/screen'
import { setupState } from '@/services/muon-setup/state'
import type { SetupOptions, SetupState } from '@/services/muon-setup/types'

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

  get progress () {
    return this.state ? progressFor(this.state) : null
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
  text-align: center;
  padding-top: 48px;
}

.muon-setup__title {
  font-size: 1.25rem;
}

.muon-setup__open {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
  margin-top: 16px;
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
