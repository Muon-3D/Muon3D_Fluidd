<template>
  <div
    id="camera"
    class="cams"
    data-tid="cameras-settings"
  >
    <!-- One camera, open -->
    <camera-detail
      v-if="view === 'detail' && editing"
      :key="editKey"
      :camera="editing"
      @save="handleSave"
      @cancel="view = 'list'"
      @remove="handleRemove"
    />

    <!-- Add: the stream type first -->
    <section
      v-else-if="view === 'types'"
      class="m3-set"
      data-tid="camera-types"
    >
      <div class="m3-set__row cams__head">
        <div class="m3-set__label">
          <h2 class="m3-set__title">
            {{ $t('app.general.label.add_camera') }}
          </h2>
          <span>Choose the stream type. Then set its addresses and name.</span>
        </div>
        <div class="m3-set__control">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            data-tid="camera-types-cancel"
            @click="view = 'list'"
          >
            Cancel
          </button>
        </div>
      </div>
      <div class="cams__types">
        <button
          v-for="type in types"
          :key="type.value"
          type="button"
          class="cams__type"
          :class="{ 'cams__type--on': type.value === 'mjpegstreamer-adaptive' }"
          :data-tid="`camera-type-${type.value}`"
          @click="startNew(type.value)"
        >
          <b>{{ $t(type.labelKey) }}</b>
          <span>{{ type.hint }}</span>
        </button>
      </div>
    </section>

    <template v-else>
      <!-- Empty -->
      <section
        v-if="!cameras.length"
        class="m3-set cams__empty"
        data-tid="cameras-empty"
      >
        <span class="cams__empty-icon"><frame-icon name="camera" /></span>
        <b>No cameras yet</b>
        <p>Plug a USB camera into the printer, or add one by its address.</p>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="camera-add"
          @click="view = 'types'"
        >
          {{ $t('app.setting.btn.add_camera') }}
        </button>
      </section>

      <!-- The list -->
      <section
        v-else
        class="m3-set cams__list"
        data-tid="cameras-list"
      >
        <div class="m3-set__row cams__head">
          <div class="m3-set__label">
            <h2 class="m3-set__title">
              {{ $tc('app.setting.title.camera', 2) }} · {{ cameras.length }}
            </h2>
            <span>The cameras Control shows, in the order you switch between them</span>
          </div>
          <div class="m3-set__control">
            <button
              type="button"
              class="cbtn cbtn--primary"
              data-tid="camera-add"
              @click="view = 'types'"
            >
              <frame-icon
                name="plus"
                small
              />
              {{ $t('app.setting.btn.add_camera') }}
            </button>
          </div>
        </div>

        <div
          v-for="(camera, index) in cameras"
          :key="camera.uid"
          class="m3-set__row cams__row"
          :class="{ 'cams__row--over': overIndex === index && dragIndex !== index }"
          :data-tid="`camera-row-${camera.name}`"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="onDragOver(index)"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <button
            type="button"
            class="cams__grip"
            :aria-label="`Reorder ${camera.name}: Up and Down arrow keys move it`"
            :data-tid="`camera-grip-${camera.name}`"
            :data-cam="camera.uid"
            @keydown.up.prevent="moveBy(index, -1)"
            @keydown.down.prevent="moveBy(index, 1)"
          >
            <i
              v-for="n in 6"
              :key="n"
            />
          </button>

          <button
            type="button"
            class="cams__open"
            :aria-label="`Open ${camera.name}`"
            :data-tid="`camera-open-${camera.name}`"
            @click="open(camera)"
          >
            <camera-thumb
              :camera="camera"
              :off="camera.enabled === false"
            />
            <span class="cams__text">
              <b>{{ camera.name }}</b>
              <span>{{ line(camera) }}</span>
              <span class="cams__pills">
                <span
                  v-if="camera.uid === firstShown"
                  class="cams__pill cams__pill--acc"
                >Opens first</span>
                <span
                  v-for="fact in facts(camera)"
                  :key="fact"
                  class="cams__pill"
                >{{ fact }}</span>
                <span
                  v-if="camera.source === 'config'"
                  class="cams__pill"
                ><frame-icon
                  name="lock"
                  small
                /> From moonraker.conf</span>
              </span>
            </span>
          </button>

          <span class="cams__side">
            <span class="cams__move">
              <button
                type="button"
                :disabled="index === 0"
                :aria-label="`Move ${camera.name} up`"
                :data-tid="`camera-up-${camera.name}`"
                :data-cam="camera.uid"
                @click="moveBy(index, -1)"
              >
                <frame-icon
                  name="chevronUp"
                  small
                />
              </button>
              <button
                type="button"
                :disabled="index === cameras.length - 1"
                :aria-label="`Move ${camera.name} down`"
                :data-tid="`camera-down-${camera.name}`"
                :data-cam="camera.uid"
                @click="moveBy(index, 1)"
              >
                <frame-icon
                  name="chevronDown"
                  small
                />
              </button>
            </span>
            <toggle-switch
              class="cams__switch"
              :value="camera.enabled !== false"
              :disabled="camera.source === 'config'"
              :label="`Show ${camera.name}`"
              :data-tid="`camera-show-${camera.name}`"
              @input="setEnabled(camera, $event)"
            />
          </span>
        </div>
        <p class="cams__hint">
          Drag to set the order the camera view switches through, or use the arrows. The order is saved on the printer, for everyone; the first one opens by default.
        </p>
      </section>

      <h3 class="cams__group">
        Viewing
      </h3>
      <section class="m3-set">
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>{{ $t('app.setting.label.camera_fullscreen_action.title') }}</b>
            <span>Embed keeps Control's controls on top. Raw stream opens the camera's own address.</span>
          </div>
          <div class="m3-set__control">
            <seg-picker
              :options="fullscreen"
              :value="defaultFullscreenAction"
              :label="$t('app.setting.label.camera_fullscreen_action.title')"
              data-tid="camera-fullscreen"
              @input="defaultFullscreenAction = $event"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Camera on Overview</b>
            <span>Set in General, with the 3D view.</span>
          </div>
          <div class="m3-set__control">
            <router-link
              :to="generalTo"
              class="cbtn cbtn--ghost"
              data-tid="camera-overview-link"
            >
              {{ overviewOn ? 'On' : 'Off' }}
              <frame-icon
                name="chevronRight"
                small
              />
            </router-link>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import type { NewWebcamConfig, WebcamConfig, WebcamService } from '@/store/webcams/types'
import { Globals } from '@/globals'
import { moveCamera } from '@/services/camera/order'
import { STREAM_TYPES, newCamera, pictureFacts, streamLine, streamTypeKey } from '@/services/camera/types'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import SegPicker from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import CameraDetail from './CameraDetail.vue'
import CameraThumb from './CameraThumb.vue'

/**
 * Settings > Cameras: the cameras, each with a live thumbnail, in an order
 * that is saved on the printer (a UI setting, `cameraOrder`; Moonraker's own
 * webcam records are untouched). A camera opens into its own view with a
 * large preview; adding starts with the stream types.
 */
@Component({ components: { CameraDetail, CameraThumb, SegPicker, ToggleSwitch } })
export default class CameraSettings extends Vue {
  get fullscreen () {
    return [
      { value: 'embed', label: this.$t('app.setting.label.camera_fullscreen_action.embed') as string },
      { value: 'rawstream', label: this.$t('app.setting.label.camera_fullscreen_action.rawstream') as string }
    ]
  }

  readonly types = STREAM_TYPES

  view: 'list' | 'types' | 'detail' = 'list'

  /** The header's "Add a camera" opens this page with ?add=1: start at the stream types. */
  created () {
    this.openFromHeader()
  }

  @Watch('$route.query.add')
  openFromHeader () {
    if (this.$route.query.add) {
      this.view = 'types'
      this.$router.replace({ path: this.$route.path, hash: this.$route.hash }).catch(() => {})
    }
  }

  editing: WebcamConfig | NewWebcamConfig | null = null
  editKey = 0
  dragIndex: number | null = null
  overIndex: number | null = null

  get cameras (): WebcamConfig[] {
    return this.$store.getters['webcams/getWebcams'] as WebcamConfig[]
  }

  /** The camera that opens first: the first one that is shown. */
  get firstShown (): string | undefined {
    return this.cameras.find(c => c.enabled !== false)?.uid
  }

  line (camera: WebcamConfig): string {
    const key = streamTypeKey(camera.service)
    return streamLine(camera, key ? this.$t(key) as string : camera.service === 'device' ? 'This device' : 'Unknown type')
  }

  facts (camera: WebcamConfig): string[] {
    return pictureFacts(camera)
  }

  open (camera: WebcamConfig) {
    this.editing = { ...camera }
    this.editKey++
    this.view = 'detail'
  }

  startNew (service: WebcamService) {
    this.editing = newCamera(service, Globals.DEFAULTS.CAMERA_URL_STREAM, Globals.DEFAULTS.CAMERA_URL_SNAPSHOT)
    this.editKey++
    this.view = 'detail'
  }

  handleSave (camera: WebcamConfig) {
    this.$store.dispatch('webcams/updateWebcam', camera)
    this.view = 'list'
  }

  setEnabled (camera: WebcamConfig, enabled: boolean) {
    this.$store.dispatch('webcams/updateWebcam', { ...camera, enabled })
  }

  async handleRemove () {
    const camera = this.editing as WebcamConfig | null
    if (!camera?.uid) return
    const sure = await this.$confirm(`${camera.name} is removed from Control. The camera itself isn't touched, and you can add it again by its address.`, {
      title: `Remove ${camera.name}?`,
      buttonTrueText: 'Remove',
      danger: true
    })
    if (!sure) return
    this.$store.dispatch('webcams/removeWebcam', camera.uid)
    this.view = 'list'
  }

  /** Moves a camera `step` places up (-1) or down (1) and saves the order. */
  moveBy (index: number, step: number) {
    const to = index + step
    if (to < 0 || to >= this.cameras.length) return
    const uid = this.cameras[index].uid
    const focused = document.activeElement as HTMLElement | null
    const kind = focused && this.$el.contains(focused) ? (focused.dataset.tid ?? '').split('-')[1] : ''
    this.saveOrder(moveCamera(this.cameras, index, to))
    // The row moved, not the keys: keep the focus on the same camera's control, found by uid.
    if (kind) {
      this.$nextTick(() => {
        const controls = Array.from(this.$el.querySelectorAll<HTMLElement>(`[data-tid^="camera-${kind}-"]`))
        controls.find(c => c.dataset.cam === uid)?.focus()
      })
    }
  }

  saveOrder (order: string[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.cameraOrder',
      value: order,
      server: true
    })
  }

  onDragStart (index: number, event: DragEvent) {
    this.dragIndex = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))
    }
  }

  onDragOver (index: number) {
    if (this.dragIndex !== null) this.overIndex = index
  }

  onDrop (index: number) {
    if (this.dragIndex !== null && this.dragIndex !== index) {
      this.saveOrder(moveCamera(this.cameras, this.dragIndex, index))
    }
    this.onDragEnd()
  }

  onDragEnd () {
    this.dragIndex = null
    this.overIndex = null
  }

  get generalTo (): string {
    return `${scopedPath('/settings', activeSlug())}#general`
  }

  get overviewOn (): boolean {
    return this.$store.state.config.uiSettings.general.overviewCameraToggle !== false
  }

  get defaultFullscreenAction (): string {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction
  }

  set defaultFullscreenAction (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.cameraFullscreenAction',
      value,
      server: true
    })
  }
}
</script>

<style lang="scss" scoped>
  .cams__head .m3-set__title {
    margin: 0;
  }

  .cams__row {
    gap: 10px;
    padding: 12px 0;
  }

  .cams__row--over {
    box-shadow: inset 0 2px 0 var(--m3d-accent);
  }

  .cams__grip {
    display: grid;
    flex: none;
    grid-template-columns: 3px 3px;
    gap: 3px;
    padding: 12px 8px;
    border-radius: 8px;
    color: var(--m3d-text-subtle, var(--m3d-text-muted));
    cursor: grab;

    i {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: currentcolor;
    }

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
    }
  }

  .cams__open {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 14px;
    min-width: 0;
    text-align: left;
  }

  .cams__text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      font-size: 15px;
      font-weight: 600;
    }

    > span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .cams__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .cams__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .cams__pill--acc {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .cams__side {
    display: flex;
    flex: none;
    align-items: center;
    gap: 10px;
  }

  .cams__move {
    display: inline-flex;
    flex-direction: column;

    button {
      display: inline-flex;
      padding: 3px 8px;
      border-radius: 8px;
      color: var(--m3d-text-muted);

      &:hover:not(:disabled) {
        background: var(--m3d-hover);
        color: var(--m3d-text);
      }

      &:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }
  }

  .cams__hint {
    margin: 8px 0 8px;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .cams__group {
    margin: 20px 0 8px 4px;
    color: var(--m3d-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .cams__types {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 8px 0 12px;
  }

  .cams__type {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    text-align: left;

    b {
      font-size: 13px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    &:hover,
    &:focus-visible,
    &--on {
      background: var(--m3d-accent-soft);
    }
  }

  .cams__empty {
    align-items: center;
    gap: 6px;
    padding: 36px 24px;
    text-align: center;

    p {
      margin: 0 0 12px;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .cams__empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 6px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  @media (max-width: 760px) {
    .cams__types {
      grid-template-columns: 1fr;
    }

    .cams__row {
      flex-wrap: nowrap;
    }

    .cams__switch {
      display: none;
    }
  }
</style>
