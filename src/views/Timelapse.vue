<template>
  <div
    class="tl"
    :class="{ 'tl--phone': isMobileViewport }"
    data-tid="timelapse-page"
  >
    <section
      v-if="!supported"
      class="tl__tile tl__state"
      data-tid="timelapse-unsupported"
    >
      <span class="tl__state-icon"><frame-icon name="camera2" /></span>
      <b>Timelapse isn't set up on {{ printerShortName }}</b>
      <p>Add moonraker-timelapse to the printer, and each print's video shows up here.</p>
    </section>
    <template v-else>
      <p
        v-if="!socketConnected"
        class="tl__offline"
        data-tid="timelapse-offline"
      >
        {{ printerShortName }} is offline. The videos here can't be played, renamed or deleted until it's back.
      </p>
      <p
        v-if="renameNote"
        class="tl__offline"
        role="alert"
        data-tid="timelapse-rename-note"
      >
        {{ renameNote }}
      </p>
      <section
        v-if="loadError"
        class="tl__tile tl__state"
        data-tid="timelapse-error"
      >
        <span class="tl__state-icon tl__state-icon--err"><frame-icon name="alert" /></span>
        <b>Couldn't read the timelapse folder</b>
        <p>{{ printerShortName }} didn't send the list of videos. Check it's online, then try again.</p>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="timelapse-retry"
          :disabled="!socketConnected"
          @click="refresh"
        >
          Retry
        </button>
      </section>
      <p
        v-else-if="!loaded && socketConnected"
        class="tl__note"
      >
        Reading the timelapse folder…
      </p>
      <section
        v-else-if="!items.length && !thisPrint"
        class="tl__tile tl__state"
        data-tid="timelapse-empty"
      >
        <span class="tl__state-icon"><frame-icon name="camera2" /></span>
        <b>No timelapses yet</b>
        <p>Turn timelapse on in Settings, and each print's video lands here once it renders.</p>
        <router-link
          :to="settingsPath"
          class="cbtn cbtn--primary"
        >
          Timelapse settings
        </router-link>
      </section>
      <div
        v-if="!loadError && (items.length || thisPrint)"
        class="tl__grid"
        data-tid="timelapse-videos"
      >
        <article
          v-if="thisPrint"
          class="tl__tile tl__item tl__item--now"
          data-tid="timelapse-status"
        >
          <button
            type="button"
            class="tl__picture"
            :aria-label="rendering ? 'This print, rendering' : 'Look through this print\'s frames'"
            :disabled="rendering"
            data-tid="timelapse-frames-open"
            @click="framesOpen = true"
          >
            <img
              v-if="frameCount"
              :src="lastFrameUrl"
              alt=""
              :style="{ filter: rendering ? `saturate(${renderProgress}%)` : 'none' }"
            >
            <frame-icon
              v-else
              name="camera2"
            />
            <span
              v-if="rendering"
              class="tl__pill"
              data-tid="timelapse-rendering"
            >Rendering · {{ Math.round(renderProgress) }}%</span>
            <span
              v-if="rendering"
              class="tl__bar"
              role="progressbar"
              :aria-valuenow="Math.round(renderProgress)"
              aria-valuemin="0"
              aria-valuemax="100"
            ><span :style="{ width: `${renderProgress}%` }" /></span>
          </button>
          <div class="tl__meta">
            <div class="tl__name">
              <b>This print</b>
              <span>{{ rendering ? (renderLine || 'Rendering…') : `${frameCount} ${frameCount === 1 ? 'frame' : 'frames'} so far` }}</span>
            </div>
          </div>
        </article>
        <article
          v-for="item in items"
          :key="item.name"
          class="tl__tile tl__item"
          :data-file="item.name"
        >
          <button
            type="button"
            class="tl__picture"
            :aria-label="item.kind === 'video' ? `Play ${item.title}` : `Download ${item.title}`"
            :disabled="!socketConnected"
            @click="item.kind === 'video' ? play(item.name) : download(item.name)"
          >
            <img
              v-if="item.thumbnail"
              :src="url(item.thumbnail)"
              alt=""
              loading="lazy"
            >
            <frame-icon
              v-else
              :name="item.kind === 'video' ? 'camera2' : 'files'"
            />
            <span
              v-if="item.kind === 'video'"
              class="tl__play"
              aria-hidden="true"
            >▶</span>
          </button>
          <div class="tl__meta">
            <div class="tl__name">
              <b :title="item.name">{{ item.title }}</b>
              <span>{{ item.kind === 'frames' ? 'saved frames · ' : '' }}{{ item.when || date(item.modified) }} · {{ size(item.size) }}</span>
            </div>
            <v-menu
              offset-y
              left
            >
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="tl__more"
                  :aria-label="`More for ${item.title}`"
                  data-tid="timelapse-item-more"
                  v-bind="attrs"
                  v-on="on"
                >
                  <frame-icon
                    name="more"
                    small
                  />
                </button>
              </template>
              <v-list dense>
                <v-list-item
                  :disabled="!socketConnected"
                  data-tid="timelapse-download"
                  @click="download(item.name)"
                >
                  <v-list-item-title>Download</v-list-item-title>
                </v-list-item>
                <v-list-item
                  :disabled="!socketConnected"
                  data-tid="timelapse-rename"
                  @click="renaming = item"
                >
                  <v-list-item-title>Rename…</v-list-item-title>
                </v-list-item>
                <v-list-item
                  :disabled="!socketConnected"
                  data-tid="timelapse-delete"
                  @click="remove(item)"
                >
                  <v-list-item-title class="tl__danger">
                    Delete
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </article>
      </div>
    </template>
    <file-name-dialog
      v-if="renaming"
      :value="!!renaming"
      title="Rename the video"
      label="Name"
      :name="renaming.name"
      @input="!$event && (renaming = null)"
      @save="rename"
    />
    <v-dialog
      :value="framesOpen"
      max-width="720"
      @input="framesOpen = $event"
    >
      <div
        v-if="framesOpen"
        class="tl__frames"
        data-tid="timelapse-frames"
      >
        <div class="tl__frames-head">
          <b>This print's frames</b>
          <span>{{ frameCount }} {{ frameCount === 1 ? 'frame' : 'frames' }}</span>
        </div>
        <div
          v-if="frameCount"
          class="tl__frame"
        >
          <img
            :src="frameUrl"
            alt=""
          >
        </div>
        <camera-item
          v-else-if="camera"
          :camera="camera"
          class="tl__camera"
        />
        <div
          v-if="frameCount > 1"
          class="tl__slider"
        >
          <span>Frame {{ shownFrame }} of {{ frameCount }}</span>
          <range-slider
            :value="shownFrame"
            :min="1"
            :max="frameCount"
            label="Frame"
            :value-text-formatter="frameValueText"
            :disabled="rendering"
            @change="pickFrame"
          />
        </div>
        <div class="tl__buttons">
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!frameCount || rendering || !socketConnected"
            data-tid="timelapse-frames-render"
            @click="renderOpen = true"
          >
            Render now
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!frameCount || savingFrames || !socketConnected"
            data-tid="timelapse-frames-save"
            @click="saveFrames"
          >
            Save the frames
          </button>
        </div>
      </div>
    </v-dialog>
    <timelapse-render-settings-dialog
      v-if="renderOpen"
      v-model="renderOpen"
      renderable
    />
    <v-dialog
      :value="!!playing"
      max-width="960"
      @input="!$event && (playing = null)"
    >
      <div
        v-if="playing"
        class="tl__player"
        data-tid="timelapse-player"
      >
        <video
          :src="playing"
          controls
          autoplay
          playsinline
        />
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { AppFile, FileBrowserEntry } from '@/store/files/types'
import type { RenderStatus, TimelapseLastFrame, TimelapseSettings } from '@/store/timelapse/types'
import type { WebcamConfig } from '@/store/webcams/types'
import { fileSize, shortDate } from '@/services/jobs/model'
import { frameFile, renamedTimelapse, renderText, timelapseItems, type TimelapseItem } from '@/services/timelapse/model'
import { timelapsePage } from '@/services/timelapse/page-state'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { printerNameParts } from '@/util/printer-name'
import RangeSlider from '@/components/control/RangeSlider.vue'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import TimelapseRenderSettingsDialog from '@/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue'

/**
 * Timelapse (Jobs, with moonraker-timelapse): a page to watch. The videos
 * made so far, to play, download, rename or delete, with this print first
 * while it takes frames or renders. How timelapses are made is in
 * Settings › Timelapse, linked from the header.
 */
@Component({ components: { RangeSlider, CameraItem, FileNameDialog, TimelapseRenderSettingsDialog } })
export default class Timelapse extends Mixins(StateMixin, FilesMixin, BrowserMixin) {
  picked = 0
  framesOpen = false
  renderOpen = false
  playing: string | null = null
  renaming: TimelapseItem | null = null
  /** Why the last rename didn't happen; empty when it did, or before one. */
  renameNote = ''
  loadError = false

  frameValueText (value: number): string {
    return `Frame ${value} of ${this.frameCount}`
  }

  /** Moonraker reports its components again on reconnecting: through a drop, the page keeps what it last knew. */
  wasSupported = false

  get supported (): boolean {
    const supported = this.$store.getters['server/componentSupport']('timelapse') as boolean
    return supported || (!this.socketConnected && this.wasSupported)
  }

  get printerShortName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string ?? '').name || 'The printer'
  }

  get settingsPath (): string {
    return `${scopedPath('/settings', activeSlug())}#timelapse`
  }

  async refresh () {
    if (!this.supported || !this.socketConnected) return
    this.loadError = false
    const result = await SocketActions.serverFilesGetDirectory('timelapse', 'timelapse')
    if (result === undefined && this.socketConnected) this.loadError = true
  }

  @Watch('supported', { immediate: true })
  onSupported (supported: boolean) {
    if (supported) this.wasSupported = true
    if (supported) this.refresh()
  }

  @Watch('socketConnected')
  onConnected (connected: boolean) {
    if (connected && (this.loadError || !this.loaded)) this.refresh()
  }

  @Watch('page.refreshTick')
  onRefresh () {
    this.refresh()
  }

  get page () {
    return timelapsePage
  }

  // -- the folder -------------------------------------------------------------------

  get loaded (): boolean {
    return !!this.$store.getters['files/getDirectory']('timelapse')
  }

  get folder (): AppFile[] {
    const entries = (this.$store.getters['files/getDirectory']('timelapse') as FileBrowserEntry[] | undefined) ?? []
    return entries.filter((e): e is AppFile => e.type === 'file')
  }

  get items (): TimelapseItem[] {
    return timelapseItems(this.folder)
  }

  url (name: string): string {
    return this.createFileUrl(name, 'timelapse')
  }

  size (bytes: number): string {
    return fileSize(bytes)
  }

  date (seconds: number): string {
    return shortDate(seconds)
  }

  async play (name: string) {
    this.playing = await this.createFileUrlWithToken(name, 'timelapse')
  }

  download (name: string) {
    this.downloadFile(name, 'timelapse')
  }

  /** The video read for the player is let go when it closes or another one opens. */
  @Watch('playing')
  onPlaying (_now: string | null, before: string | null) {
    this.releaseFileUrl(before)
  }

  beforeDestroy () {
    this.releaseFileUrl(this.playing)
  }

  /**
   * Renames a video and the picture saved beside it. A name the folder
   * already holds is refused (a move would write over that file). The picture
   * moves only once the video has, and nothing else moves after a refusal.
   */
  async rename (title: string) {
    const item = this.renaming
    this.renaming = null
    this.renameNote = ''
    if (!item) return
    const next = renamedTimelapse(item, title)
    if (!next) return
    const held = new Set(this.folder.map(f => f.filename))
    const taken = [next.name, next.thumbnail].find(name => !!name && held.has(name))
    if (taken) {
      this.renameNote = `There's already a file called ${taken} on ${this.printerShortName}. ${item.title} keeps its name; pick another.`
      return
    }
    const moved = await SocketActions.serverFilesMove(`timelapse/${item.name}`, `timelapse/${next.name}`)
    if (!moved) {
      this.renameNote = `Couldn't rename ${item.title}: ${this.printerShortName} refused. It keeps its name, and so does its picture.`
      return
    }
    // The picture saved beside a video keeps its name matching, so the video keeps its picture.
    if (item.thumbnail && next.thumbnail) {
      const picture = await SocketActions.serverFilesMove(`timelapse/${item.thumbnail}`, `timelapse/${next.thumbnail}`)
      if (!picture) this.renameNote = `${next.name} is renamed, but ${this.printerShortName} wouldn't rename its picture, ${item.thumbnail}.`
    }
  }

  async remove (item: TimelapseItem) {
    const ok = await this.$confirm("The video goes from the printer. This can't be undone.", { title: `Delete ${item.title}${item.when ? ` (${item.when})` : ''}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok) return
    SocketActions.serverFilesDeleteFile(`timelapse/${item.name}`)
    // The picture saved beside a video goes with it, as Fluidd's file browser does.
    if (item.thumbnail) SocketActions.serverFilesDeleteFile(`timelapse/${item.thumbnail}`)
  }

  // -- this print -------------------------------------------------------------------

  get settings (): TimelapseSettings | undefined {
    return this.$store.getters['timelapse/getSettings']
  }

  get lastFrame (): TimelapseLastFrame | undefined {
    return this.$store.getters['timelapse/getLastFrame']
  }

  get frameCount (): number {
    return this.lastFrame?.uniqueCount ?? 0
  }

  /** This print has a card of its own while it takes frames or renders. */
  get thisPrint (): boolean {
    return this.frameCount > 0 || this.rendering
  }

  get shownFrame (): number {
    return this.picked || this.frameCount
  }

  pickFrame (n: number) {
    this.picked = n === this.frameCount ? 0 : n
  }

  get lastFrameUrl (): string {
    return this.createFileUrl(this.lastFrame?.file ?? '', 'timelapse_frames')
  }

  get frameUrl (): string {
    const last = this.lastFrame?.file ?? ''
    return this.createFileUrl(this.picked ? frameFile(this.picked, last) : last, 'timelapse_frames')
  }

  get camera (): WebcamConfig | undefined {
    return this.settings ? this.$store.getters['webcams/getWebcamById'](this.settings.camera) as WebcamConfig | undefined : undefined
  }

  get renderStatus (): RenderStatus | undefined {
    return this.$store.getters['timelapse/getRenderStatus']
  }

  get rendering (): boolean {
    return !!this.renderStatus && this.renderStatus.status !== 'success'
  }

  get renderProgress (): number {
    return this.renderStatus?.status === 'running' ? this.renderStatus.progress : 0
  }

  get renderLine (): string | null {
    return renderText(this.renderStatus as never)
  }

  get savingFrames (): boolean {
    return this.hasWait(this.$waits.onTimelapseSaveFrame)
  }

  saveFrames () {
    SocketActions.machineTimelapseSaveFrames(this.$waits.onTimelapseSaveFrame)
  }
}
</script>

<style lang="scss" scoped>
  .tl {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tl__tile {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--m3d-border);
    border-radius: 16px;
    background: var(--m3d-surface);
  }

  .tl__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .tl--phone .tl__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .tl__picture {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 10;
    width: 100%;
    overflow: hidden;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:disabled {
      cursor: default;
    }
  }

  .tl__play {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgb(0 0 0 / 55%);
    color: #fff;
    font-size: 16px;
  }

  .tl__pill {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--m3d-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }

  .tl__bar {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 4px;
    background: rgb(0 0 0 / 30%);

    span {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }

  .tl__meta {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px 14px;
  }

  .tl__name {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .tl__more {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--m3d-text-muted);
  }

  .tl__danger {
    color: var(--m3d-danger);
  }

  .tl__state {
    align-items: center;
    gap: 8px;
    padding: 40px 18px;
    text-align: center;

    b {
      font-size: 16px;
    }

    p {
      margin: 0 0 8px;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .tl__state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 4px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .tl__state-icon--err {
    color: var(--m3d-danger);
  }

  .tl__note,
  .tl__offline {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .tl__offline {
    padding: 12px 16px;
    border: 1px solid var(--m3d-border);
    border-radius: 12px;
    background: var(--m3d-surface);
  }

  .tl__frames {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
    border-radius: 16px;
    background: var(--m3d-surface);
  }

  .tl__frames-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .tl__frame img {
    display: block;
    width: 100%;
    border-radius: 10px;
  }

  .tl__slider {
    display: flex;
    flex-direction: column;
    gap: 6px;

    > span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .tl__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tl__player video {
    display: block;
    width: 100%;
    max-height: 80vh;
    background: #000;
  }
</style>
