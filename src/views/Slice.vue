<template>
  <foreign-printer-slice v-if="foreignPrinter" />
  <div
    v-else
    class="slice-view"
    :class="{ 'slice-view--part': partOfPage, 'slice-view--phone': isMobileViewport }"
    data-test="slice-view"
  >
    <header class="slice-head">
      <h1
        class="slice-head__title"
        data-tid="page-title"
      >
        Slice
      </h1>
      <p class="slice-head__line">
        {{ headerLine }}
      </p>
      <div
        class="slice-head__sum"
        data-tid="slice-summary"
      >
        <span data-tid="slice-printer">{{ printerChip }}</span>
        <span
          v-if="materialChip"
          data-tid="slice-material"
        >
          <i
            v-if="materialChip.colour"
            :style="{ background: materialChip.colour }"
          />
          {{ materialChip.name }}
        </span>
      </div>
    </header>

    <section
      class="slice-tile"
      data-tid="slice-tile"
    >
      <div class="slice-tile__head">
        <frame-icon
          name="slice"
          small
        />
        <b>Slicer</b>
        <span
          class="slice-tile__pill"
          :class="`slice-tile__pill--${statusTone}`"
          data-tid="slice-status"
        >{{ statusText }}</span>
      </div>
      <div class="slice-tile__body">
        <iframe
          v-if="url && present === 'present'"
          ref="frame"
          class="slice-view__frame"
          :class="{ 'slice-view__frame--waiting': !ready }"
          title="Muon3D Slicer"
          allow="clipboard-write; fullscreen"
          referrerpolicy="no-referrer"
          :sandbox="sandbox"
          @load="onFrameLoad"
        />
        <div
          v-else-if="!url || present === 'absent'"
          class="slice-view__missing"
          data-tid="slice-missing"
        >
          <span class="slice-view__icon">
            <frame-icon name="slice" />
          </span>
          <b>The slicer isn't here</b>
          <span>{{ $t('app.slicer.msg.no_slicer') }}</span>
          <button
            v-if="url"
            type="button"
            class="cbtn"
            data-tid="slice-retry"
            @click="retryProbe"
          >
            <frame-icon
              name="refresh"
              small
            />
            Look again
          </button>
        </div>

        <div
          v-if="url && present !== 'absent' && !ready"
          class="slice-view__opening"
          role="status"
          data-tid="slice-opening"
        >
          <span
            class="slice-view__spinner"
            aria-hidden="true"
          />
          Opening the slicer…
        </div>
      </div>
    </section>

    <print-confirm-dialog
      :request="dialogRequest"
      :loaded="dialogLoaded"
      @answer="handleAnswer"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { watch } from 'vue'
import type { Route, NavigationGuardNext } from 'vue-router'
import { consola } from 'consola'
import BrowserMixin from '@/mixins/browser'
import ControlMixin from '@/mixins/control'
import { readLook } from '@/services/slicer-bridge/look'
import { hostSetup, type ActiveSpool } from '@/services/slicer-bridge/setup'
import type { HostSetup, PrinterMaterial } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'
import PrintConfirmDialog, { type LoadedMaterial, type PrintConfirmRequest } from '@/components/slicer/PrintConfirmDialog.vue'
import { startSlicerHost, type SlicerHost } from '@/services/slicer-bridge/host'
import { readFluiddSelection } from '@/services/slicer-bridge/fluidd'
import { configuredSlicerUrl, probeSlicer, resetSlicerProbe, slicerPresence, type SlicerPresence } from '@/services/slicer-bridge/slicerUrl'
import { isBoundToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import type { ConfirmAnswer, ConfirmRequest } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import { printerError } from '@/services/slicer-bridge/vendor/printer-client/errors/kinds'
import { createFluiddLibrary } from '@/services/slicer-bridge/library'
import { addModelText, handOverModels, heldModels } from '@/services/slicer-bridge/handover'
import { libraryStatus, refreshLibrary, watchLibraryAccount } from '@/services/library/store'
import { EventBus } from '@/eventBus'
import { isForeignSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import ForeignPrinterSlice from '@/components/foreign/ForeignPrinterSlice.vue'

/** How long held models wait for the slicer's welcome (its features are watched for 30 s). */
const HELD_MODELS_WAIT_MS = 35_000

interface OpenDialog {
  request: ConfirmRequest;
  resolve: (answer: ConfirmAnswer) => void;
  reject: (error: unknown) => void;
}

/**
 * The frame's sandbox when the slicer is on another origin (a hosted Fluidd),
 * which may be hostile: everything the slicer uses, but never a navigation of
 * this page (no allow-top-navigation). On this page's own origin (a printer's
 * copy) a sandbox would add nothing, so there is none.
 */
export const CROSS_ORIGIN_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox'

/**
 * Fluidd › Slice: the Muon3D Slicer in a frame (its embed.html, from
 * VUE_MUON_SLICER_URL, framed only once probeSlicer found it there), hosted
 * over printer-bridge/1
 * (services/slicer-bridge/host.ts). The slicer slices for the printer
 * Fluidd has selected and sends to it through Fluidd's own connection; a
 * print starts only from Fluidd's dialog (PrintConfirmDialog.vue).
 *
 * The frame stays while Fluidd switches printer: the slicer is told of the
 * new printer and keeps its plates. Leaving /slice with changes the slicer
 * has not saved asks first.
 *
 * The Fluidd integration (KAN-511, muon3d-slicer docs/fluidd-integration.md):
 * the slicer is told Fluidd's look and what the selected printer has loaded,
 * each again when it changes. The slicer receives no Control layout mode
 * (KAN-550, route meta
 * noMode). A slicer that draws itself
 * as a part of the page (its hello lists ui.look) gets a frame with no card
 * of its own; an older one keeps today's framed card. The rail stays either
 * way.
 *
 * The account's Library (KAN-521, printer-client 0.4.0): the slicer saves
 * to it and opens from it through Fluidd (services/slicer-bridge/library.ts),
 * and hears library.status whenever sign-in, consent or the preferences
 * change. "Open in Slice" on the Library page comes here with ?library=<id>:
 * once the slicer is welcomed, it is sent library.open.
 */
@Component({
  components: {
    PrintConfirmDialog,
    ForeignPrinterSlice
  }
})
export default class Slice extends Mixins(ControlMixin, BrowserMixin) {
  host: SlicerHost | null = null
  /** The slicer draws itself as a part of the page (its hello listed ui.look). */
  partOfPage = false
  /**
   * Whether the frame shows. Until the slicer has said hello and drawn a
   * frame in Fluidd's look, the frame is hidden behind "Opening the slicer…",
   * so its first paint (a blank page, white in a browser that gives a frame
   * its own colour scheme) never shows. An older slicer that never says
   * hello shows on its load, a moment later.
   */
  ready = false
  readyTimer = 0
  styleObserver: MutationObserver | null = null
  setupFrame = 0
  dialog: OpenDialog | null = null
  dirty = false
  closed = false
  stopWatching: (() => void) | null = null

  get foreignPrinter (): boolean {
    return isForeignSlug(this.$route?.params.printer)
  }

  get url (): URL | null {
    return configuredSlicerUrl()
  }

  get present (): SlicerPresence {
    return slicerPresence.state
  }

  /** On /slice with no printer, the slicer exports; it sends to none. */
  get printerName (): string | null {
    if (this.$route?.name === 'Slice (no printer)' || !this.$route?.params.printer) return null
    const shown = this.$store.getters['config/getDisplayName'] as string | undefined
    return shown ? printerNameParts(shown).name : null
  }

  get headerLine (): string {
    return this.printerName
      ? `Muon3D Slicer · slices for ${this.printerName} and sends the print to it`
      : 'Muon3D Slicer · no printer open, so it saves the sliced file instead of sending it'
  }

  get printerChip (): string {
    if (!this.printerName) return 'No printer'
    return this.socketConnected ? this.printerName : `${this.printerName} · offline`
  }

  /** What the printer has loaded, as the slicer is told it; nothing when it's unknown. */
  get materialChip (): { name: string, colour: string | null } | null {
    if (!this.printerName) return null
    try {
      const loaded = this.loadedMaterial
      return loaded ? { name: loaded.name, colour: this.loadedColour ?? loaded.colour ?? null } : null
    } catch {
      return null
    }
  }

  get statusText (): string {
    if (!this.url || this.present === 'absent') return 'Not found'
    return this.ready ? 'Ready' : 'Opening'
  }

  get statusTone (): 'ok' | 'wait' | 'err' {
    if (!this.url || this.present === 'absent') return 'err'
    return this.ready ? 'ok' : 'wait'
  }

  /** Looks for the slicer again, as a fresh page would, and opens it if it's there now. */
  async retryProbe () {
    resetSlicerProbe()
    if (!await probeSlicer(this.url)) return
    await this.$nextTick()
    this.startHost()
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

  /** What changes Fluidd's look: the theme, its colour, and the page style (flat or glass). */
  get lookKey (): string {
    const themes = this.$vuetify.theme.themes as Record<string, Record<string, unknown>> | undefined
    return `${this.theme}|${String(themes?.[this.theme]?.primary ?? '')}`
  }

  readLook () {
    const root = (document.querySelector('.v-application') as HTMLElement | null) ?? document.documentElement
    return readLook(root, this.theme)
  }

  /**
   * What the selected printer has loaded, and the material table
   * (setup.ts). Nothing Fluidd can't read yet stops the slicer: it gets no
   * material, and the next change sends it again.
   */
  get currentSetup (): HostSetup {
    try {
      const spool = this.$store.getters['spoolman/getActiveSpool'] as ActiveSpool | null | undefined
      const heated = this.material ? this.materialChoices.find(c => c.presetId === this.material?.id) ?? null : null
      return hostSetup({ spool: spool ?? null, loaded: this.loadedMaterial, loadedColour: this.loadedColour, heated, choices: this.materialChoices })
    } catch {
      return { material: null, materials: [] }
    }
  }

  get dialogRequest (): PrintConfirmRequest | null {
    const request = this.dialog?.request
    if (!request) return null
    return { printer: request.printer.name, paths: request.paths, mode: request.mode, plateClear: request.plateClear }
  }

  /** What the printer has loaded, beside the file in the print check. */
  get dialogLoaded (): LoadedMaterial | null {
    try {
      const loaded = this.loadedMaterial
      return loaded ? { name: loaded.name, colour: loaded.colour } : null
    } catch {
      return null
    }
  }

  async mounted () {
    if (this.foreignPrinter) {
      this.openHeldModels(true)
      return
    }
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    EventBus.bus.$on('models-held', this.handleModelsHeld)
    watchLibraryAccount()
    refreshLibrary().catch(() => {})
    // Held models wait for the slicer's welcome only so long: then they're let go, with the Add model message.
    this.heldTimer = window.setTimeout(() => this.openHeldModels(true), HELD_MODELS_WAIT_MS)
    if (!await probeSlicer(this.url)) {
      this.openHeldModels(true)
      return
    }
    await this.$nextTick()
    this.startHost()
  }

  heldTimer = 0

  /** Open Slice while /slice is open: the page takes them now, or once the slicer is welcomed. */
  handleModelsHeld () {
    window.clearTimeout(this.heldTimer)
    this.heldTimer = window.setTimeout(() => this.openHeldModels(true), HELD_MODELS_WAIT_MS)
    this.openHeldModels()
  }

  startHost () {
    const url = this.url
    const frame = this.$refs.frame as HTMLIFrameElement | undefined
    if (this.foreignPrinter || !url || !frame || this.host || this.closed) return
    this.host = startSlicerHost({
      frame,
      slicerUrl: url,
      store: this.$store,
      http: this.$httpClient,
      selection: () => readFluiddSelection(this.$store),
      remote: () => isBoundToPrinterTransport(this.$httpClient),
      fetchIdentity: this.identityFetcher(),
      confirm: (request) => this.confirm(request),
      theme: this.theme,
      density: this.density,
      look: this.readLook(),
      setup: (key) => (key === this.host?.printer()?.key ? this.currentSetup : null),
      onMaterial: (key, material) => { if (key === this.host?.printer()?.key) this.takeMaterial(material) },
      library: createFluiddLibrary({ browse: () => { this.$router.push('/library').catch(() => {}) } }),
      hostVersion: String(import.meta.env.VERSION ?? ''),
      onState: (state) => { this.dirty = state.dirty === true },
      log: (entry) => consola.debug('[slicer bridge]', entry)
    })
    // Synchronous: the frame hears of a new printer before anything else about it.
    this.stopWatching = watch(
      () => JSON.stringify(readFluiddSelection(this.$store)),
      () => this.host?.refresh(),
      { flush: 'sync' }
    )
    // The look is read a frame after a change, once the new classes apply. setLook sends ui.theme too.
    const sendLook = () => requestAnimationFrame(() => this.host?.bridge.setLook(this.readLook()))
    this.$watch('lookKey', sendLook)
    this.styleObserver = new MutationObserver(sendLook)
    this.styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-m3d-style'] })
    this.$watch('density', (density: 'compact' | 'touch') => this.host?.bridge.setDensity(density))
    // One printer.setup a frame, however many of its inputs change at once.
    this.$watch(() => JSON.stringify(this.currentSetup), () => {
      cancelAnimationFrame(this.setupFrame)
      this.setupFrame = requestAnimationFrame(() => this.host?.bridge.setupChanged())
    })
    // library.status whenever sign-in, consent or the preferences change.
    this.$watch(() => JSON.stringify(libraryStatus()), () => this.host?.bridge.libraryStatus(libraryStatus()))
    this.$watch(() => this.routeQuery.library, () => this.openFromLibrary())
    this.watchFeatures()
  }

  /** The address's query, where "Open in Slice" names the print. */
  get routeQuery (): Record<string, unknown> {
    return { ...(this.$route?.query ?? {}) }
  }

  replaceQuery (query: Record<string, unknown>) {
    this.$router.replace({ query: query as Route['query'] }).catch(() => {})
  }

  /**
   * "Open in Slice" from the Library (?library=<id>, and &version=<n> for an
   * older one): once the slicer is welcomed, library.open, and the address
   * drops it, so a reload doesn't open it over the person's changes. A
   * slicer that predates the Library is told nothing, and the person is.
   */
  openFromLibrary () {
    const query = this.routeQuery
    const item = query.library
    const bridge = this.host?.bridge
    if (typeof item !== 'string' || !item || !bridge?.connected || !this.ready) return
    if (bridge.clientFeatures.includes('library')) {
      const version = Number(query.version)
      bridge.libraryOpen({ item, version: Number.isInteger(version) && version > 0 ? version : null })
    } else {
      EventBus.$emit('This slicer can\'t open prints from your Library yet.', { type: 'warning', timeout: 6000 })
    }
    delete query.library
    delete query.version
    this.replaceQuery(query)
  }

  /**
   * The slicer's material drawer changed what's loaded (printer.material):
   * the printer keeps it, as when Overview or Control set it, so the panel,
   * these pages and the live M1 agree. The material only while nothing
   * prints (the print was sliced for what's loaded); its colour any time.
   */
  takeMaterial (material: PrinterMaterial) {
    const choice = this.materialChoices.find(c => c.name.trim().toUpperCase() === material.material.trim().toUpperCase())
    if (choice && !this.printerPrinting && !this.printerPaused && choice.name !== this.loadedMaterial?.name) this.setLoadedMaterial(choice)
    if (material.colour && material.colour.toUpperCase() !== this.loadedColour) this.setLoadedColour(material.colour)
  }

  /**
   * Open Slice on a dropped or picked model (KAN-2191): once the slicer is
   * welcomed, the held files go to it (models.open) and are let go, so a
   * reload doesn't add them again. A slicer that predates models.open, or
   * none that said hello, is sent nothing, and the person is told to use its
   * Add model. `giveUp`: no slicer is coming (none here, another printer's
   * page, or none welcomed within HELD_MODELS_WAIT_MS): they are let go now,
   * with that message, never left for a later visit to add unasked.
   */
  async openHeldModels (giveUp = false) {
    const names = heldModels().map(f => f.name)
    if (!names.length) return
    if (!giveUp && (this.closed || !this.ready)) return
    const result = await handOverModels(this.host?.bridge, giveUp || this.featuresSettled)
    if (result !== 'none') window.clearTimeout(this.heldTimer)
    if (result === 'not-taken') EventBus.$emit(addModelText(names), { type: 'warning', timeout: 10000 })
  }

  /** The slicer's hello was welcomed, or it never will be: no models.open is coming. */
  featuresSettled = false

  /** Once the slicer's hello is welcomed, whether it draws itself as a part of the page; then it shows. */
  watchFeatures (tries = 120) {
    if (this.closed || !this.host) return
    const features = this.host.bridge.clientFeatures
    if (features.length || tries <= 0) {
      this.partOfPage = features.includes('ui.look')
      this.featuresSettled = true
      this.showWhenPainted()
      return
    }
    setTimeout(() => this.watchFeatures(tries - 1), 250)
  }

  /** Two frames after the welcome, the slicer has drawn in the look it was given. */
  showWhenPainted () {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.ready = true
      this.openFromLibrary()
      this.openHeldModels()
    }))
  }

  /** The frame's page has loaded: a slicer that hasn't said hello within 3 s shows anyway (an older one never will). */
  onFrameLoad () {
    window.clearTimeout(this.readyTimer)
    this.readyTimer = window.setTimeout(() => { this.ready = true }, 3000)
  }

  beforeDestroy () {
    this.closed = true
    window.clearTimeout(this.readyTimer)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    EventBus.bus.$off('models-held', this.handleModelsHeld)
    window.clearTimeout(this.heldTimer)
    // Left before the slicer took them: let them go, never for a later visit to add.
    this.openHeldModels(true)
    this.stopWatching?.()
    this.styleObserver?.disconnect()
    cancelAnimationFrame(this.setupFrame)
    this.dialog?.reject(new Error('The slicer closed'))
    this.dialog = null
    this.host?.close()
    this.host = null
  }

  async beforeRouteLeave (to: Route, from: Route, next: NavigationGuardNext) {
    if (!this.dirty) return next()
    const leave = await this.$confirm(this.$tc('app.slicer.leave.text'), {
      title: this.$tc('app.slicer.leave.title'),
      buttonTrueText: this.$tc('app.slicer.leave.leave'),
      buttonFalseText: this.$tc('app.slicer.leave.stay'),
      danger: true
    })
    if (leave === true) next()
    else next(false)
  }

  handleBeforeUnload (event: BeforeUnloadEvent) {
    if (!this.dirty) return
    event.preventDefault()
    event.returnValue = ''
  }

  /**
   * Asks the network printer at an API address its identity through Fluidd's
   * own client, so with its sign-in, and reads every status here: a refusal
   * shows no toast and never signs Fluidd out.
   */
  identityFetcher () {
    return (apiUrl: string): Promise<unknown> =>
      this.$httpClient.get('/server/muon/identity', { baseURL: apiUrl, responseType: 'json', validateStatus: () => true })
        .then(r => r.status === 200 ? r.data : Promise.reject(new Error(String(r.status))))
  }

  /** Fluidd's dialog for one print.request; one at a time. */
  confirm (request: ConfirmRequest): Promise<ConfirmAnswer> {
    if (this.dialog) return Promise.reject(printerError('busy', 'Another print is waiting for its confirmation'))
    if (request.signal.aborted) return Promise.reject(new Error('The request ended'))
    return new Promise<ConfirmAnswer>((resolve, reject) => {
      const open: OpenDialog = { request, resolve, reject }
      const onAbort = () => {
        if (this.dialog !== open) return
        this.dialog = null
        reject(new Error('The request ended'))
      }
      request.signal.addEventListener('abort', onAbort, { once: true })
      this.dialog = open
    })
  }

  handleAnswer (answer: ConfirmAnswer) {
    const open = this.dialog
    if (!open) return
    this.dialog = null
    open.resolve(answer)
  }
}
</script>

<style lang="scss" scoped>
  .slice-view {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: calc(100vh - 56px - 32px);
    height: calc(100dvh - 56px - 32px);
    min-height: 480px;
  }

  .slice-head {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 6px;
    padding: 4px 4px 0;
  }

  .slice-head__title {
    margin: 0;
    color: var(--m3d-text);
    font-family: var(--m3d-font-title, var(--m3d-font-sans));
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
  }

  .slice-head__line {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .slice-head__sum {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--m3d-surface);
      color: var(--m3d-text);
      font-size: 13px;
      font-weight: 600;
    }

    i {
      width: 10px;
      height: 10px;
      border: 1px solid var(--m3d-border);
      border-radius: 50%;
    }
  }

  .slice-tile {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .slice-tile__head {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    font-size: 15px;

    .frame-icon {
      color: var(--m3d-text-muted);
    }
  }

  .slice-tile__pill {
    margin-left: auto;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .slice-tile__pill--ok {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .slice-tile__pill--err {
    color: var(--m3d-danger);
  }

  .slice-tile__body {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    margin: 0 6px 6px;
    overflow: hidden;
    border-radius: 16px;
    background: var(--v-background-base, var(--m3d-bg));
  }

  .slice-view__frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: var(--v-background-base, transparent);
  }

  // A slicer drawn as a part of the page: the tile's own ground shows through.
  .slice-view--part .slice-view__frame {
    background: transparent;
  }

  // Hidden, not removed: the slicer loads and says hello behind the page's own "Opening".
  .slice-view__frame--waiting {
    visibility: hidden;
  }

  .slice-view__missing {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    padding: 24px;
    text-align: center;

    span:not(.slice-view__icon) {
      max-width: 420px;
      color: var(--m3d-text-muted);
    }
  }

  .slice-view__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
  }

  .slice-view--phone {
    gap: 10px;
    height: calc(100vh - 56px - 16px);
    height: calc(100dvh - 56px - 16px);
    min-height: 420px;

    .slice-head__title {
      font-size: 24px;
    }

    .slice-head__line {
      display: none;
    }

    .slice-head__sum {
      flex-wrap: nowrap;
      margin-top: 2px;
      overflow-x: auto;
      scrollbar-width: none;

      span {
        flex: none;
      }
    }

    .slice-tile {
      border-radius: 18px;
    }

    .slice-tile__head {
      padding: 10px 14px;
    }

    .slice-tile__body {
      margin: 0 4px 4px;
    }
  }

  .slice-view__opening {
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

  .slice-view__spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--m3d-border);
    border-top-color: var(--m3d-accent);
    border-radius: 50%;
    animation: slice-opening 0.9s linear infinite;
  }

  @keyframes slice-opening {
    to { transform: rotate(360deg); }
  }

  :root.m3d-reduced-motion {
    .slice-view__spinner {
      animation: none;
    }
  }
</style>
