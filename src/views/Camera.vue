<template>
  <div
    class="camera-page"
    :class="{ 'camera-page--phone': isMobileViewport }"
    data-tid="camera-page"
    @keydown.esc="closeDetails"
  >
    <div
      v-if="camera"
      class="camera-grid"
    >
      <section
        class="camera-tile camera-tile--stream"
        data-tid="camera-tile"
      >
        <div
          v-if="cameras.length > 1 || isMobileViewport"
          ref="detailsBar"
          class="camera-tile__bar"
        >
          <nav
            v-if="cameras.length > 1"
            class="camera-chips"
            aria-label="Cameras"
            data-tid="camera-chips"
          >
            <router-link
              v-for="item in cameras"
              :key="item.uid"
              v-slot="{ href, navigate }"
              :to="cameraTo(item)"
              custom
            >
              <a
                :href="href"
                class="camera-chips__chip"
                :class="{ 'camera-chips__chip--on': item.uid === camera.uid }"
                :aria-current="item.uid === camera.uid ? 'page' : undefined"
                @click="navigate"
              >{{ item.name }}</a>
            </router-link>
          </nav>
          <template v-if="isMobileViewport">
            <button
              ref="detailsTrigger"
              type="button"
              class="camera-tile__more"
              aria-label="Stream info"
              data-tid="camera-details-trigger"
              :aria-expanded="detailsOpen ? 'true' : 'false'"
              aria-controls="camera-details"
              @click="toggleDetails"
            >
              <frame-icon name="more" />
            </button>
            <div
              v-show="detailsOpen"
              id="camera-details"
              ref="detailsPanel"
              class="camera-details camera-details--popover"
              tabindex="-1"
              aria-label="Stream information"
            >
              <b class="camera-details__name">{{ camera.name }}</b>
              <dl class="camera-kv">
                <div
                  v-for="row in detailRows"
                  :key="row.label"
                >
                  <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
                </div>
              </dl>
              <router-link
                :to="settingsTo"
                class="cbtn cbtn--wide"
              >
                Camera settings
              </router-link>
            </div>
          </template>
        </div>

        <div
          ref="stage"
          class="camera-stage"
          data-tid="camera-stage"
          @error.capture="onStreamError"
        >
          <camera-item
            ref="item"
            :key="`${camera.uid}:${attempt}`"
            :camera="camera"
            fullscreen
            class="camera-stage__item"
          />

          <div
            v-if="streamError"
            class="camera-stage__error"
            role="alert"
            data-tid="camera-error"
          >
            <span class="camera-icon-square camera-icon-square--err">
              <frame-icon name="alert" />
            </span>
            <b>Can't reach {{ camera.name || 'this camera' }}</b>
            <span>The printer lists this camera, but its picture isn't coming through. Check it's plugged in, then try again.</span>
            <button
              type="button"
              class="cbtn"
              data-tid="camera-retry"
              @click="retry"
            >
              <frame-icon
                name="refresh"
                small
              />
              Retry
            </button>
          </div>

          <div
            v-else
            class="camera-stage__live"
            data-tid="camera-live"
          >
            <span class="camera-stage__dot" />
            <strong>Live</strong>
            <span v-if="rateText">{{ rateText }}</span>
          </div>

          <div
            v-if="hasLights"
            class="camera-stage__side"
          >
            <button
              type="button"
              class="camera-stage__chip"
              :aria-pressed="lightsOn ? 'true' : 'false'"
              data-tid="camera-lights"
              @click="setLights(!lightsOn)"
            >
              <frame-icon
                name="bulb"
                small
              />
              {{ lightsOn ? 'Lights on' : 'Lights off' }}
            </button>
          </div>

          <div
            v-if="!streamError"
            class="camera-stage__glass"
          >
            <button
              type="button"
              class="camera-stage__pill"
              data-tid="camera-stage-snapshot"
              @click="snapshot"
            >
              <frame-icon
                name="camera2"
                small
              />
              Snapshot
            </button>
            <button
              type="button"
              class="camera-stage__pill"
              data-tid="camera-stage-fullscreen"
              @click="fillScreen"
            >
              <frame-icon
                name="expand"
                small
              />
              Full screen
            </button>
          </div>
        </div>
      </section>

      <aside
        v-if="!isMobileViewport"
        class="camera-tile camera-tile--info"
        data-tid="camera-info"
      >
        <header class="camera-tile__head">
          <frame-icon name="camera" />
          <b>{{ camera.name || 'Camera' }}</b>
        </header>
        <dl
          id="camera-details"
          class="camera-kv"
          aria-label="Stream information"
        >
          <div
            v-for="row in detailRows"
            :key="row.label"
          >
            <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
          </div>
        </dl>
        <p
          v-if="hasLights && !lightsOn"
          class="camera-tile__note"
        >
          Lights off makes the picture dark
        </p>
        <router-link
          :to="settingsTo"
          class="cbtn cbtn--wide"
          data-tid="camera-settings"
        >
          Camera settings
        </router-link>
      </aside>
    </div>

    <div
      v-else
      class="camera-empty"
      data-tid="camera-empty"
    >
      <span class="camera-icon-square">
        <frame-icon name="camera" />
      </span>
      <b>This printer has no camera set up</b>
      <span>Plug one in, then add it in Settings › Cameras to watch your prints here.</span>
      <router-link
        :to="addTo"
        class="cbtn cbtn--primary"
      >
        Add a camera
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import OverviewMixin from '@/mixins/overview'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import { jobTitle } from '@/services/jobs/model'
import { EventBus } from '@/eventBus'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { cameraFor, liveFacts, snapshotName, snapshotPlan } from '@/services/camera/model'
import { cameraPage } from '@/services/camera/page-state'
import type { WebcamConfig } from '@/store/webcams/types'

/**
 * Camera (`/boxwood-367a/camera/front`), v3: the picture full-bleed in a
 * 9-column tile, with Snapshot and Full screen (F) on it and one chip per
 * camera above it when there are several. Its stream info sits in a side
 * tile (on a phone, in the tile's ··· menu), without the credentials its
 * addresses may carry. What's printing is the header's second line.
 */
@Component({ components: { CameraItem } })
export default class Camera extends Mixins(OverviewMixin, BrowserMixin) {
  detailsOpen = false
  /** The stream's picture failed to load; Retry draws it again. */
  streamError = false
  attempt = 0

  get cameras (): WebcamConfig[] {
    return this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[]
  }

  get camera (): WebcamConfig | null {
    return cameraFor(this.cameras, this.$route.params.cameraId)
  }

  get facts (): string {
    return liveFacts({
      printing: this.printerPrinting,
      paused: this.printerPaused,
      name: this.jobFile ? jobTitle(this.jobFile) : '',
      progress: this.progress,
      layer: this.layer,
      layers: this.layers,
      left: this.leftText
    })
  }

  /** "Live view of Boxwood · M1 bracket · 44% · 49m left", under the title. */
  get headerLine (): string {
    if (!this.camera) return ''
    const facts = this.facts
    return `Live view of ${this.printerName}${facts ? ` · ${facts}` : ''}`
  }

  @Watch('headerLine', { immediate: true })
  onHeaderLine (line: string) {
    cameraPage.subtitle = line
  }

  @Watch('camera')
  onCameraChange () {
    this.streamError = false
  }

  get detailRows (): Array<{ label: string, value: string }> {
    const camera = this.camera
    if (!camera) return []
    return [
      { label: 'Service', value: this.detail(camera.service) },
      { label: 'Stream', value: this.displayUrl(camera.stream_url) },
      { label: 'Snapshot', value: this.displayUrl(camera.snapshot_url) },
      { label: 'Frame rate', value: this.frameRate },
      { label: 'Turned', value: this.turnedText },
      ...(this.timelapseSupported ? [{ label: 'Timelapse', value: this.timelapseOn ? 'On' : 'Off' }] : [])
    ]
  }

  /** The rate the camera is set to stream at, beside Live. */
  get rateText (): string {
    const fps = this.camera?.target_fps
    return fps ? `${fps} fps` : ''
  }

  cameraTo (camera: WebcamConfig): string {
    return scopedPath(`/camera/${encodeURI(camera.uid)}`, activeSlug())
  }

  get settingsTo (): string {
    return this.addTo
  }

  /** An image or video in the stage that couldn't load: the camera's address doesn't answer. */
  onStreamError (event: Event) {
    const target = event.target
    if (target instanceof HTMLImageElement || target instanceof HTMLVideoElement) this.streamError = true
  }

  retry () {
    this.streamError = false
    this.attempt++
  }

  get lightsOn (): boolean {
    return this.lightsValue > 0
  }

  get timelapseSupported (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse') as boolean
  }

  get timelapseOn (): boolean {
    return !!this.$store.state.timelapse?.settings?.enabled
  }

  get addTo (): string {
    return `${scopedPath('/settings', activeSlug())}#camera`
  }

  get turnedText (): string {
    const camera = this.camera
    if (!camera || (camera.rotation == null && camera.flip_horizontal == null && camera.flip_vertical == null)) return 'Unknown'
    const parts: string[] = []
    if (camera.rotation) parts.push(`${camera.rotation}°`)
    if (camera.flip_horizontal) parts.push('flipped across')
    if (camera.flip_vertical) parts.push('flipped up and down')
    return parts.join(', ') || 'Not turned'
  }

  get frameRate (): string {
    const camera = this.camera
    if (!camera || camera.target_fps == null) return 'Unknown'
    const idle = camera.target_fps_idle == null ? 'unknown' : camera.target_fps_idle
    return `${camera.target_fps} fps, ${idle} idle`
  }

  detail (value: unknown): string {
    if (value == null || String(value).trim() === '') return 'Unknown'
    return String(value)
  }

  displayUrl (value: string | undefined): string {
    return value ? redactCameraUrl(value) : 'Unknown'
  }

  toggleDetails () {
    if (this.detailsOpen) this.closeDetails()
    else {
      this.detailsOpen = true
      this.$nextTick(() => (this.$refs.detailsPanel as HTMLElement | undefined)?.focus())
    }
  }

  closeDetails () {
    if (!this.detailsOpen) return
    const panel = this.$refs.detailsPanel as HTMLElement | undefined
    const restoreFocus = !!panel?.contains(document.activeElement)
    this.detailsOpen = false
    if (restoreFocus) {
      this.$nextTick(() => (this.$refs.detailsTrigger as HTMLButtonElement | undefined)?.focus())
    }
  }

  mounted () {
    EventBus.bus.$on('camera-snapshot', this.snapshot)
    EventBus.bus.$on('camera-fullscreen', this.fillScreen)
    document.addEventListener('click', this.onDocumentClick)
  }

  beforeDestroy () {
    cameraPage.subtitle = ''
    EventBus.bus.$off('camera-snapshot', this.snapshot)
    EventBus.bus.$off('camera-fullscreen', this.fillScreen)
    document.removeEventListener('click', this.onDocumentClick)
  }

  onDocumentClick (event: MouseEvent) {
    const bar = this.$refs.detailsBar as HTMLElement | undefined
    if (!this.detailsOpen || (event.target instanceof Node && bar?.contains(event.target))) return
    this.closeDetails()
  }

  fillScreen () {
    const stage = this.$refs.stage as HTMLElement | undefined
    if (!stage) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else stage.requestFullscreen?.().catch(() => {})
  }

  /**
   * Saves the frame on screen as a JPEG. A camera on another address that
   * doesn't allow it can't be drawn; then its own snapshot address opens,
   * or the page says it can't.
   */
  async snapshot () {
    const camera = this.camera
    if (!camera) return
    const item = this.$refs.item as (CameraItem & { componentInstance?: { streamingElement?: Element } }) | undefined
    const element = item?.componentInstance?.streamingElement
    const name = snapshotName(this.printerName, camera.name ?? 'camera', new Date())
    try {
      const blob = await frameOf(element, { rotation: camera.rotation, flipX: camera.flip_horizontal, flipY: camera.flip_vertical })
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
        return
      }
    } catch {
      // A frame from another address that doesn't allow it: fall through.
    }
    if (camera.snapshot_url) {
      window.open(new URL(camera.snapshot_url, document.URL).toString(), '_blank', 'noopener')
    } else {
      EventBus.$emit("This camera's picture can't be saved from here.", { type: 'warning', timeout: 5000 })
    }
  }
}

/** Camera addresses may embed basic-auth credentials or arbitrary signed query values. */
export function redactCameraUrl (value: string): string {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(value)
    const url = new URL(value, document.URL)
    url.username = ''
    url.password = ''
    const keys = Array.from(url.searchParams.keys())
    for (const key of keys) url.searchParams.set(key, '[redacted]')
    url.hash = ''
    const shown = absolute ? url.toString() : `${url.pathname}${url.search}`
    return shown.replace(/%5Bredacted%5D/g, '[redacted]')
  } catch {
    return 'Unknown'
  }
}

/** The frame an image or video shows now, turned as the page turns it, as a JPEG; null when it isn't one. */
function frameOf (element: Element | undefined, turn: Parameters<typeof snapshotPlan>[2]): Promise<Blob | null> {
  let width = 0
  let height = 0
  if (element instanceof HTMLImageElement) {
    width = element.naturalWidth
    height = element.naturalHeight
  } else if (element instanceof HTMLVideoElement) {
    width = element.videoWidth
    height = element.videoHeight
  }
  if (!element || !width || !height) return Promise.resolve(null)
  const plan = snapshotPlan(width, height, turn)
  const canvas = document.createElement('canvas')
  canvas.width = plan.width
  canvas.height = plan.height
  const context = canvas.getContext('2d')
  if (context) {
    for (const [op, a, b] of plan.steps) {
      if (op === 'translate') context.translate(a, b as number)
      else if (op === 'scale') context.scale(a, b as number)
      else context.rotate(a)
    }
    context.drawImage(element as HTMLImageElement | HTMLVideoElement, -width / 2, -height / 2, width, height)
  }
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92)
    } catch (e) {
      reject(e)
    }
  })
}
</script>

<style lang="scss" scoped>
  .camera-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .camera-tile {
    position: relative;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .camera-tile--stream {
    grid-column: span 9;
    overflow: hidden;
  }

  .camera-tile--info {
    grid-column: span 3;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
  }

  .camera-tile__head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;

    .frame-icon {
      color: var(--m3d-text-muted);
    }
  }

  .camera-tile__bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
  }

  .camera-tile__more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-left: auto;
    border: 0;
    border-radius: 10px;
    background: var(--m3d-surface-raised, transparent);
    color: var(--m3d-text);
    cursor: pointer;
  }

  .camera-tile__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .camera-chips {
    display: flex;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .camera-chips__chip {
    flex: none;
    padding: 6px 14px;
    border: 1px solid var(--m3d-border, rgba(127, 127, 127, 0.3));
    border-radius: 999px;
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .camera-chips__chip--on {
    border-color: var(--m3d-accent);
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e) !important;
  }

  .camera-kv {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;

    > div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    dt {
      flex: none;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }

    dd {
      min-width: 0;
      margin: 0;
      font-size: 13px;
      text-align: right;
      overflow-wrap: anywhere;
    }
  }

  .camera-details--popover {
    position: absolute;
    z-index: 5;
    top: calc(100% - 4px);
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(340px, calc(100vw - 48px));
    padding: 16px 18px;
    border-radius: 18px;
    background: var(--m3d-surface);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  }

  .cbtn--wide {
    justify-content: center;
  }

  .camera-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 420px;
    overflow: hidden;
    background: #0b0d0e;
  }

  .camera-stage:fullscreen {
    background: #000;
  }

  .camera-stage__item {
    width: 100%;
    background: transparent !important;

    // The tile's chips name the camera and its side tile describes the stream.
    :deep(.camera-name),
    :deep(.camera-frames),
    :deep(.camera-fullscreen) {
      display: none;
    }

    :deep(.camera-image) {
      display: block;
      width: 100%;
      max-height: calc(100vh - 230px);
      margin: 0 auto;
      object-fit: contain;
    }
  }

  .camera-stage:fullscreen .camera-stage__item :deep(.camera-image) {
    max-height: 100vh;
  }

  .camera-stage__live,
  .camera-stage__side,
  .camera-stage__glass {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 14px;
    background: rgba(20, 22, 24, 0.62);
    backdrop-filter: blur(10px);
    color: #fff;
    font-size: 13px;
  }

  .camera-stage__live {
    top: 14px;
    left: 14px;
    padding: 7px 12px;

    span:last-child:not(.camera-stage__dot) {
      color: rgba(255, 255, 255, 0.78);
    }
  }

  .camera-stage__side {
    top: 14px;
    right: 14px;
    padding: 4px;
  }

  .camera-stage__glass {
    right: 14px;
    bottom: 14px;
    padding: 4px;
  }

  .camera-stage__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-danger, #ef4444);
  }

  .camera-stage__chip,
  .camera-stage__pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  .camera-stage__error,
  .camera-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;

    span:not(.camera-icon-square) {
      max-width: 420px;
      color: var(--m3d-text-muted);
    }
  }

  .camera-stage__error {
    position: absolute;
    inset: 0;
    justify-content: center;
    padding: 24px;
    background: var(--m3d-surface);
  }

  .camera-empty {
    padding: 72px 16px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .camera-icon-square {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--m3d-surface-raised, rgba(127, 127, 127, 0.15));
    color: var(--m3d-text-muted);
  }

  .camera-icon-square--err {
    color: var(--m3d-danger, #ef4444);
  }

  .camera-page--phone {
    .camera-grid {
      display: block;
    }

    .camera-stage {
      min-height: 220px;
    }

    .camera-stage__item :deep(.camera-image) {
      max-height: calc(100vh - 300px);
    }
  }
</style>
