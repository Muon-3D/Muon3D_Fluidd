<template>
  <div
    class="prev"
    :class="{ 'prev--phone': isMobileViewport }"
    data-tid="preview-page"
  >
    <p
      v-if="!socketConnected"
      class="prev__offline"
      data-tid="preview-offline"
    >
      {{ printerName }} is offline. {{ loaded ? 'This file stays here to look through; printing and opening files wait until it\'s back.' : 'Files can be opened once it\'s back.' }}
    </p>
    <section
      class="prev__tile prev__canvas"
      data-tid="preview-canvas"
    >
      <div class="prev__stage">
        <gcode-preview
          v-if="loaded"
          ref="viewer"
          class="prev__drawing"
          :layer="shownLayer"
          :progress="following ? undefined : moveEnd"
          :disabled="false"
          bare
          @cancelObject="cancelObject"
        />
        <template v-if="loaded">
          <span
            class="prev__pill"
            data-tid="preview-layer-pill"
          >Layer {{ shownLayer + 1 }} of {{ fileLayers.length }} · Z {{ z.toFixed(2) }} mm</span>
          <div class="prev__stage-actions">
            <button
              type="button"
              class="prev__round"
              aria-label="Load the file again"
              data-tid="preview-reload"
              :disabled="!socketConnected || !previewFile"
              @click="reload"
            >
              <frame-icon
                name="refresh"
                small
              />
            </button>
            <button
              type="button"
              class="cbtn prev__chip"
              data-tid="preview-reset-view"
              @click="resetView"
            >
              Reset view
            </button>
          </div>
        </template>
        <div
          v-else-if="parsing"
          class="prev__busy"
          data-tid="preview-parsing"
        >
          <v-progress-circular
            :value="parserProgress"
            size="44"
            width="3"
            color="primary"
          />
          <span>Reading {{ fileName }}… {{ Math.round(parserProgress) }}%</span>
          <button
            type="button"
            class="prev__link"
            data-tid="preview-stop"
            @click="stopReading"
          >
            Stop
          </button>
        </div>
        <div
          v-else-if="fetching"
          class="prev__busy"
        >
          <v-progress-circular
            indeterminate
            size="44"
            width="3"
            color="primary"
          />
          <span>Fetching {{ fetching }} from {{ printerName }}…</span>
        </div>
        <div
          v-else-if="error"
          class="prev__state"
          data-tid="preview-error"
        >
          <span class="prev__state-icon prev__state-icon--err"><frame-icon name="alert" /></span>
          <b>Couldn't open {{ failedFile ? failedFile.filename : 'the file' }}</b>
          <p>{{ error }}</p>
          <button
            v-if="failedFile"
            type="button"
            class="cbtn cbtn--primary"
            data-tid="preview-retry"
            :disabled="!socketConnected"
            @click="load(failedFile)"
          >
            Retry
          </button>
        </div>
        <div
          v-else
          class="prev__state"
          data-tid="preview-empty"
        >
          <span class="prev__state-icon"><frame-icon name="layout" /></span>
          <b>Nothing loaded</b>
          <p>{{ printerFile ? 'Load what\'s printing to watch it layer by layer, or open any file.' : 'Open a file on the printer to look through it layer by layer.' }}</p>
          <button
            v-if="printerFile"
            type="button"
            class="cbtn cbtn--primary"
            data-tid="preview-load-print"
            :disabled="!socketConnected"
            @click="load(printerFile)"
          >
            Load what's printing
          </button>
          <preview-open-menu
            v-else
            @pick="load"
          >
            <template #activator="{ on, attrs }">
              <button
                type="button"
                class="cbtn cbtn--primary"
                data-tid="preview-open"
                :disabled="!socketConnected"
                v-bind="attrs"
                v-on="on"
              >
                Open a file
              </button>
            </template>
          </preview-open-menu>
        </div>
      </div>
      <div
        v-if="loaded"
        class="prev__under"
      >
        <button
          v-if="printerFile && !printerFileLoaded"
          type="button"
          class="cbtn"
          data-tid="preview-load-print"
          :disabled="!socketConnected || parsing || !!fetching"
          @click="load(printerFile)"
        >
          Load what's printing
        </button>
        <div
          class="prev__slider"
          data-tid="preview-layer"
        >
          <div class="prev__slider-head">
            <b>Layer</b>
            <span>{{ shownLayer + 1 }} / {{ fileLayers.length }}</span>
          </div>
          <range-slider
            :value="shownLayer"
            :min="0"
            :max="Math.max(0, fileLayers.length - 1)"
            label="Layer"
            :value-text-formatter="layerValueText"
            @change="setLayer"
          />
          <div class="prev__slider-foot">
            <span>1</span>
            <span>{{ following ? 'Live position tracks the nozzle' : 'Drag to look through the layers' }}</span>
            <span>{{ fileLayers.length }}</span>
          </div>
        </div>
        <div
          v-if="!following"
          class="prev__slider"
        >
          <div class="prev__slider-head">
            <b>Along the layer</b>
            <span>{{ (moveEnd - layerStart + 1).toLocaleString() }} / {{ Math.max(1, layerEnd - layerStart + 1).toLocaleString() }}</span>
          </div>
          <range-slider
            :value="moveEnd - layerStart"
            :min="0"
            :max="Math.max(0, layerEnd - layerStart)"
            label="How far along the layer"
            :value-text-formatter="moveValueText"
            @change="moveEnd = layerStart + $event"
          />
        </div>
        <dl
          class="prev__stats"
          data-tid="preview-stats"
        >
          <div>
            <dt>Layer</dt>
            <dd>{{ shownLayer + 1 }} / {{ fileLayers.length }}</dd>
          </div>
          <div>
            <dt>Z</dt>
            <dd>{{ z.toFixed(2) }} mm</dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd>{{ (layerEnd - layerStart).toLocaleString() }}</dd>
          </div>
        </dl>
      </div>
    </section>
    <aside
      class="prev__tile prev__show"
      data-tid="preview-show"
    >
      <div class="prev__show-head">
        <b>Show</b>
        <v-menu
          offset-y
          left
          :close-on-content-click="false"
        >
          <template #activator="{ on, attrs }">
            <button
              type="button"
              class="prev__round"
              aria-label="More to show"
              data-tid="preview-show-more"
              v-bind="attrs"
              v-on="on"
            >
              <frame-icon
                name="more"
                small
              />
            </button>
          </template>
          <div
            class="prev__menu"
            data-tid="preview-show-menu"
          >
            <viewer-toggles />
            <preview-open-menu @pick="load">
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="cbtn"
                  data-tid="preview-show-open"
                  :disabled="!socketConnected"
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ loaded ? 'Open another…' : 'Open a file…' }}
                </button>
              </template>
            </preview-open-menu>
            <button
              v-if="loaded"
              type="button"
              class="cbtn"
              data-tid="preview-unload"
              @click="unload"
            >
              Unload
            </button>
          </div>
        </v-menu>
      </div>
      <div class="prev__rows">
        <div class="crow">
          <span class="crow__name">Travel moves</span>
          <toggle-switch
            :value="option('showMoves')"
            label="Travel moves"
            @input="setOption('showMoves', $event)"
          />
        </div>
        <div class="crow">
          <span class="crow__name">Retractions</span>
          <toggle-switch
            :value="option('showRetractions')"
            label="Retractions"
            @input="setOption('showRetractions', $event)"
          />
        </div>
        <div
          class="crow"
          data-tid="preview-follow"
        >
          <span class="crow__name">
            Follow the nozzle
            <span
              v-if="!printerFileLoaded"
              class="crow__sub"
            >· while this file prints</span>
          </span>
          <toggle-switch
            :value="following"
            label="Follow the nozzle"
            :disabled="!printerFileLoaded"
            @input="following = $event"
          />
        </div>
        <div class="crow">
          <span class="crow__name">Only current layer</span>
          <toggle-switch
            :value="onlyCurrentLayer"
            label="Only current layer"
            @input="onlyCurrentLayer = $event"
          />
        </div>
      </div>
      <ul
        class="prev__legend"
        data-tid="preview-legend"
      >
        <li><i class="prev__swatch prev__swatch--extrusion" />Extrusions</li>
        <li v-if="option('showMoves')">
          <i class="prev__swatch prev__swatch--travel" />Travel moves
        </li>
        <li v-if="option('showRetractions')">
          <i class="prev__swatch prev__swatch--retraction" />Retractions
        </li>
        <li v-if="!onlyCurrentLayer">
          <i class="prev__swatch prev__swatch--ghost" />Layers below and above
        </li>
        <li v-if="printerFileLoaded">
          <i class="prev__swatch prev__swatch--nozzle" />Nozzle
        </li>
      </ul>
      <p
        v-if="printerFileLoaded && hasObjects"
        class="prev__note"
      >
        Objects on the plate are outlined. Pick one in the drawing to stop printing it; the rest carry on.
      </p>
    </aside>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import JobsMixin from '@/mixins/jobs'
import BrowserMixin from '@/mixins/browser'
import type { AppFile } from '@/store/files/types'
import type { Layer, ViewerOptions } from '@/store/gcodePreview/types'
import { jobTitle } from '@/services/jobs/model'
import RangeSlider from '@/components/control/RangeSlider.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import ViewerToggles from '@/components/jobs/ViewerToggles.vue'
import PreviewOpenMenu from '@/components/gcode-preview/PreviewOpenMenu.vue'
import { previewPage } from '@/services/gcode-preview/page-state'

type ShowOption = keyof Pick<ViewerOptions, 'showMoves' | 'showRetractions' | 'showPreviousLayer' | 'showNextLayer'>

/**
 * The G-code preview (Jobs › Preview): the drawing as large as the window
 * allows, its layer slider under it, and beside it (under it, on a phone)
 * what's drawn. The header names the file and carries Open another and
 * Print this. It loads what's printing, or any file on the printer; Jobs'
 * viewer opens here with its file already loaded. As Fluidd's own did, it
 * loads a print as it starts and follows it, when Settings says to. The
 * drawing itself loads only when this page opens: it's the heavy part.
 */
@Component({
  components: {
    GcodePreview: () => import('@/components/widgets/gcode-preview/GcodePreview.vue'),
    PreviewOpenMenu,
    RangeSlider,
    ToggleSwitch,
    ViewerToggles
  }
})
export default class GcodePreviewPage extends Mixins(JobsMixin, BrowserMixin) {
  shownLayer = 0
  /** The previous- and next-layer settings from before "Only current layer" was turned on. */
  layersBeside: { showPreviousLayer: boolean, showNextLayer: boolean } | null = null
  moveEnd = 0
  fetching = ''
  error = ''
  failedFile: AppFile | null = null

  layerValueText (value: number): string {
    return `Layer ${value + 1} of ${this.fileLayers.length}`
  }

  moveValueText (value: number): string {
    return `Move ${value + 1} of ${Math.max(1, this.layerEnd - this.layerStart + 1)}`
  }

  mounted () {
    this.loadFiles()
    this.shownLayer = this.following ? this.printLayer : Math.floor(this.fileLayers.length / 4)
    this.moveEnd = this.layerEnd
  }

  get previewFile (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile'] as AppFile | undefined
  }

  get fileName (): string {
    return this.previewFile?.filename ?? this.fetching
  }

  get title (): string {
    return jobTitle(this.previewFile?.filename ?? '')
  }

  get parsing (): boolean {
    return !!this.$store.state.gcodePreview.parserWorker
  }

  get fileLayers (): Layer[] {
    return (this.$store.getters['gcodePreview/getLayers'] as Layer[]) ?? []
  }

  get moveCount (): number {
    return (this.$store.getters['gcodePreview/getMoves'] as unknown[]).length
  }

  get loaded (): boolean {
    return !this.parsing && this.moveCount > 0 && this.fileLayers.length > 0
  }

  get parserProgress (): number {
    const bytes = this.$store.getters['gcodePreview/getParserProgress'] as number
    const size = this.previewFile?.size
    return size ? Math.min(100, bytes / size * 100) : 0
  }

  get layerStart (): number {
    return this.fileLayers[this.shownLayer]?.move ?? 0
  }

  get layerEnd (): number {
    return this.fileLayers[this.shownLayer + 1]?.move ?? this.moveCount
  }

  get z (): number {
    return this.fileLayers[this.shownLayer]?.z ?? 0
  }

  get printerFile (): AppFile | undefined {
    const current = this.$store.state.printer.printer.current_file as AppFile | undefined
    return current?.filename && this.busy ? current : undefined
  }

  get printerFileLoaded (): boolean {
    const f = this.previewFile
    const p = this.printerFile
    return !!f && !!p && `${f.path}/${f.filename}` === `${p.path}/${p.filename}`
  }

  get following (): boolean {
    return this.printerFileLoaded && !!this.$store.getters['gcodePreview/getViewerOption']('followProgress')
  }

  set following (value: boolean) {
    this.$store.commit('gcodePreview/setViewerState', { followProgress: value })
    if (value) this.shownLayer = this.printLayer
  }

  get printLayer (): number {
    const position = this.$store.state.printer.printer.virtual_sdcard?.file_position ?? 0
    return this.$store.getters['gcodePreview/getLayerNrByFilePosition'](position) as number
  }

  get hasObjects (): boolean {
    return (this.$store.state.printer.printer.exclude_object?.objects?.length ?? 0) > 1
  }

  setLayer (layer: number) {
    this.shownLayer = layer
    this.moveEnd = this.layerEnd
    if (this.following && layer !== this.printLayer) this.$store.commit('gcodePreview/setViewerState', { followProgress: false })
  }

  @Watch('printLayer')
  onPrintLayer (layer: number) {
    if (this.following) this.shownLayer = layer
  }

  @Watch('fileLayers')
  onLayers (layers: Layer[], old: Layer[]) {
    if (!layers.length || layers === old) return
    // A new file: the print's layer when following it, else a layer partway up, where the part shows its shape.
    const autoFollow = this.$store.state.config.uiSettings.gcodePreview.autoFollowOnFileLoad
    if (autoFollow && this.printerFileLoaded) this.$store.commit('gcodePreview/setViewerState', { followProgress: true })
    this.shownLayer = this.following ? this.printLayer : Math.floor(layers.length / 4)
    this.moveEnd = this.layerEnd
  }

  /** A print starting loads its file, when Settings › G-code preview says so (as Fluidd's own viewer did). */
  @Watch('printerFile')
  onPrinterFile () {
    const settings = this.$store.state.config.uiSettings.gcodePreview
    const auto = this.isMobileViewport ? settings.autoLoadMobileOnPrintStart : settings.autoLoadOnPrintStart
    if (auto && this.printerFile && !this.printerFileLoaded && !this.parsing) this.load(this.printerFile)
  }

  async load (file: AppFile) {
    if (!this.socketConnected) return
    this.error = ''
    this.failedFile = null
    this.fetching = file.filename
    try {
      const response = await this.getGcode(file)
      const gcode = response?.data
      if (!gcode) return
      if (this.parsing) await this.$store.dispatch('gcodePreview/terminateParserWorker')
      this.$store.dispatch('gcodePreview/loadGcode', { file, gcode })
    } catch {
      this.error = `${this.printerName} didn't send ${file.filename}. Try again in a moment.`
      this.failedFile = file
    } finally {
      this.fetching = ''
    }
  }

  reload () {
    if (this.previewFile) this.load(this.previewFile)
  }

  resetView () {
    (this.$refs.viewer as { reset?: () => void } | undefined)?.reset?.()
  }

  created () {
    this.$watch(() => previewPage.requested, this.onRequested)
  }

  onRequested (file: AppFile | null) {
    if (!file) return
    previewPage.requested = null
    this.load(file)
  }

  option (key: ShowOption): boolean {
    return !!this.$store.getters['gcodePreview/getViewerOption'](key)
  }

  setOption (key: ShowOption, value: boolean) {
    this.$store.commit('gcodePreview/setViewerState', { [key]: value })
  }

  /** Only the layer shown: neither the layer below nor the one above drawn faintly beside it. */
  get onlyCurrentLayer (): boolean {
    return !this.option('showPreviousLayer') && !this.option('showNextLayer')
  }

  set onlyCurrentLayer (value: boolean) {
    if (value) {
      // Remember the layers beside it as they were, so turning this off brings back both.
      if (this.option('showPreviousLayer') || this.option('showNextLayer')) {
        this.layersBeside = { showPreviousLayer: this.option('showPreviousLayer'), showNextLayer: this.option('showNextLayer') }
      }
      this.$store.commit('gcodePreview/setViewerState', { showPreviousLayer: false, showNextLayer: false })
      return
    }
    // Both were off already (the viewer's default): show both, as the legend says "below and above".
    this.$store.commit('gcodePreview/setViewerState', this.layersBeside ?? { showPreviousLayer: true, showNextLayer: true })
  }

  stopReading () {
    this.$store.dispatch('gcodePreview/terminateParserWorker')
  }

  unload () {
    this.$store.dispatch('gcodePreview/reset')
  }

  async cancelObject (id: string) {
    const ok = await this.$confirm("The rest of the plate carries on. A part that's skipped can't be added back.", { title: `Stop printing ${id}?`, buttonTrueText: 'Skip it', buttonFalseText: 'Keep printing it', danger: true })
    if (ok) this.sendGcode(`EXCLUDE_OBJECT NAME=${id.toUpperCase().replace(/\s/g, '_')}`)
  }
}
</script>

<style lang="scss" scoped>
  .prev {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .prev__offline {
    grid-column: 1 / -1;
    margin: 0;
    padding: 12px 16px;
    border: 1px solid var(--m3d-border);
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .prev__tile {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--m3d-border);
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .prev__canvas {
    grid-column: span 9;
  }

  .prev__show {
    grid-column: span 3;
  }

  .prev__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 380px);
    height: calc(100svh - 380px);
    min-height: 420px;
    overflow: hidden;
    border-radius: 16px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);
  }

  .prev__drawing {
    width: 100%;
    height: 100%;

    :deep(.v-input__slot) {
      min-height: 0 !important;
      max-height: none;
      height: calc(100vh - 380px);
      height: calc(100svh - 380px);
    }
  }

  .prev__pill {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgb(0 0 0 / 55%);
    color: #fff;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .prev__stage-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 8px;
  }

  .prev__round {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .prev__busy,
  .prev__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 18px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    b {
      color: var(--m3d-text);
      font-size: 16px;
    }

    p {
      max-width: 420px;
      margin: 0 0 6px;
    }
  }

  .prev__state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .prev__state-icon--err {
    color: var(--m3d-danger);
  }

  .prev__link {
    color: var(--m3d-accent);
    font-size: 14px;
    font-weight: 600;
  }

  .prev__under {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .prev__slider {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .prev__slider-head,
  .prev__slider-foot {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-variant-numeric: tabular-nums;
  }

  .prev__slider-head {
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }
  }

  .prev__slider-foot {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .prev__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .prev__show-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    b {
      font-size: 16px;
    }
  }

  .prev__rows {
    display: flex;
    flex-direction: column;
  }

  .prev__menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 320px;
    padding: 14px;
    border-radius: 14px;
    background: var(--m3d-surface);
  }

  .prev__legend {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 12px 0 0;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 13px;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .prev__swatch {
    display: inline-block;
    width: 18px;
    height: 4px;
    border-radius: 2px;
  }

  .prev__swatch--extrusion { background: var(--m3d-text); }
  .prev__swatch--travel { background: var(--m3d-text-subtle); }
  .prev__swatch--retraction { background: var(--m3d-danger); }
  .prev__swatch--ghost { background: var(--m3d-border); }

  .prev__swatch--nozzle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--m3d-accent);
  }

  .prev__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .prev--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;

    .prev__canvas,
    .prev__show {
      grid-column: 1 / -1;
    }

    .prev__tile {
      padding: 12px;
    }

    .prev__stage {
      height: 52svh;
      min-height: 300px;
    }

    .prev__drawing :deep(.v-input__slot) {
      height: 52svh;
    }
  }
</style>
