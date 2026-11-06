<template>
  <div
    class="design-view"
    :class="{ 'design-view--part': partOfPage }"
    data-test="design-view"
  >
    <iframe
      v-if="url && present === 'present'"
      ref="frame"
      class="design-view__frame"
      :class="{ 'design-view__frame--waiting': !ready }"
      title="Muon3D Design"
      allow="clipboard-write; fullscreen"
      referrerpolicy="no-referrer"
      :sandbox="sandbox"
      @load="onFrameLoad"
    />
    <v-alert
      v-else-if="!url || present === 'absent'"
      type="warning"
      text
      data-tid="design-absent"
    >
      {{ $t('app.design.msg.no_design') }}
    </v-alert>
    <div
      v-if="url && present !== 'absent' && !ready"
      class="design-view__opening"
      role="status"
      data-tid="design-opening"
    >
      <span
        class="design-view__spinner"
        aria-hidden="true"
      />
      Opening Design…
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { consola } from 'consola'
import BrowserMixin from '@/mixins/browser'
import { readLook } from '@/services/slicer-bridge/look'
import { CROSS_ORIGIN_SANDBOX } from '@/services/slicer-bridge/slicerUrl'
import { createFluiddLibrary } from '@/services/slicer-bridge/library'
import { libraryStatus, refreshLibrary, watchLibraryAccount } from '@/services/library/store'
import { startDesignHost, type DesignHost } from '@/services/design-bridge/host'
import { configuredDesignUrl, designPresence, probeDesign, type DesignPresence } from '@/services/design-bridge/designUrl'

/**
 * Fluidd › Design: Muon3D Design in a frame (its embed.html, from
 * VUE_MUON_DESIGN_URL, framed only once probeDesign found it there), hosted
 * over printer-bridge/1 like Slice (services/design-bridge/host.ts).
 *
 * Design is told Fluidd's look (ui.look) and gets the account's Library
 * (library, services/slicer-bridge/library.ts): it saves a design there, and
 * Slice or the Library sends it on to an M1. Design gets no printer, no
 * printer setup and no print dialog. Like Slice it receives no Control
 * layout mode (KAN-550, route meta noMode), and its frame stays while
 * Fluidd switches printer.
 */
@Component({})
export default class Design extends Mixins(BrowserMixin) {
  host: DesignHost | null = null
  /** Design draws itself as a part of the page (its hello listed ui.look). */
  partOfPage = false
  /** Whether the frame shows: hidden behind "Opening Design…" until Design has said hello and drawn. */
  ready = false
  readyTimer = 0
  styleObserver: MutationObserver | null = null
  closed = false

  get url (): URL | null {
    return configuredDesignUrl()
  }

  get present (): DesignPresence {
    return designPresence.state
  }

  get sandbox (): string | undefined {
    const url = this.url
    return url && url.origin !== window.location.origin ? CROSS_ORIGIN_SANDBOX : undefined
  }

  get theme (): 'light' | 'dark' {
    return this.$vuetify.theme.dark ? 'dark' : 'light'
  }

  get density (): 'compact' | 'touch' {
    return this.isMobileViewport ? 'touch' : 'compact'
  }

  /** What changes Fluidd's look: the theme and its colour. */
  get lookKey (): string {
    const themes = this.$vuetify.theme.themes as Record<string, Record<string, unknown>> | undefined
    return `${this.theme}|${String(themes?.[this.theme]?.primary ?? '')}`
  }

  readLook () {
    const root = (document.querySelector('.v-application') as HTMLElement | null) ?? document.documentElement
    return readLook(root, this.theme)
  }

  async mounted () {
    watchLibraryAccount()
    refreshLibrary().catch(() => {})
    if (!await probeDesign(this.url)) return
    await this.$nextTick()
    this.startHost()
  }

  startHost () {
    const url = this.url
    const frame = this.$refs.frame as HTMLIFrameElement | undefined
    if (!url || !frame || this.host || this.closed) return
    this.host = startDesignHost({
      frame,
      designUrl: url,
      theme: this.theme,
      density: this.density,
      look: this.readLook(),
      library: createFluiddLibrary({ browse: () => { this.$router.push('/library').catch(() => {}) } }),
      hostVersion: String(import.meta.env.VERSION ?? ''),
      log: (entry) => consola.debug('[design bridge]', entry)
    })
    // The look is read a frame after a change, once the new classes apply. setLook sends ui.theme too.
    const sendLook = () => requestAnimationFrame(() => this.host?.bridge.setLook(this.readLook()))
    this.$watch('lookKey', sendLook)
    this.styleObserver = new MutationObserver(sendLook)
    this.styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-m3d-style'] })
    this.$watch('density', (density: 'compact' | 'touch') => this.host?.bridge.setDensity(density))
    // library.status whenever sign-in, consent or the preferences change.
    this.$watch(() => JSON.stringify(libraryStatus()), () => this.host?.bridge.libraryStatus(libraryStatus()))
    this.watchFeatures()
  }

  /** Once Design's hello is welcomed, whether it draws itself as a part of the page; then it shows. */
  watchFeatures (tries = 120) {
    if (this.closed || !this.host) return
    const features = this.host.bridge.clientFeatures
    if (features.length || tries <= 0) {
      this.partOfPage = features.includes('ui.look')
      requestAnimationFrame(() => requestAnimationFrame(() => { this.ready = true }))
      return
    }
    setTimeout(() => this.watchFeatures(tries - 1), 250)
  }

  /** The frame's page has loaded: a Design that hasn't said hello within 3 s shows anyway. */
  onFrameLoad () {
    window.clearTimeout(this.readyTimer)
    this.readyTimer = window.setTimeout(() => { this.ready = true }, 3000)
  }

  beforeDestroy () {
    this.closed = true
    window.clearTimeout(this.readyTimer)
    this.styleObserver?.disconnect()
    this.host?.close()
    this.host = null
  }
}
</script>

<style lang="scss" scoped>
  .design-view {
    position: relative;
    height: calc(100vh - 56px - 32px);
    height: calc(100dvh - 56px - 32px);
    min-height: 360px;
  }

  .design-view__frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 12px;
    background: var(--v-background-base, transparent);
  }

  // Design drawn as a part of the page: no card of its own, the page's own ground.
  .design-view--part .design-view__frame {
    border-radius: 0;
    background: transparent;
  }

  // Hidden, not removed: Design loads and says hello behind the page's own "Opening".
  .design-view__frame--waiting {
    visibility: hidden;
  }

  .design-view__opening {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .design-view__spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--m3d-border);
    border-top-color: var(--m3d-accent);
    border-radius: 50%;
    animation: design-opening 0.9s linear infinite;
  }

  @keyframes design-opening {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .design-view__spinner {
      animation: none;
    }
  }
</style>
