<template>
  <div
    class="cdet"
    data-tid="camera-detail"
  >
    <nav
      class="cdet__crumb"
      aria-label="Breadcrumb"
    >
      <button
        type="button"
        data-tid="camera-back"
        @click="$emit('cancel')"
      >
        <frame-icon
          name="chevronLeft"
          small
        />
        Cameras
      </button>
      <frame-icon
        name="chevronRight"
        small
      />
      <span aria-current="page">{{ draft.name || 'New camera' }}</span>
    </nav>

    <div
      v-if="readOnly"
      class="cdet__lock"
      data-tid="camera-locked"
    >
      <frame-icon name="lock" />
      <div>
        <b>Managed by your Moonraker configuration.</b>
        Change it in moonraker.conf; Control can only show it.
      </div>
    </div>

    <div class="cdet__grid">
      <div class="cdet__left">
        <camera-preview :camera="draft">
          <span class="cdet__info">Preview shows rotation and flips as you change them</span>
          <div
            v-if="!readOnly"
            class="cdet__glass"
          >
            <button
              type="button"
              data-tid="camera-glass-rotate"
              @click="rotateNext"
            >
              <frame-icon
                name="refresh"
                small
              />
              Rotate
            </button>
            <button
              type="button"
              :class="{ on: draft.flip_horizontal }"
              :aria-pressed="draft.flip_horizontal ? 'true' : 'false'"
              data-tid="camera-glass-flip-x"
              @click="draft.flip_horizontal = !draft.flip_horizontal"
            >
              ↔ Flip
            </button>
            <button
              type="button"
              :class="{ on: draft.flip_vertical }"
              :aria-pressed="draft.flip_vertical ? 'true' : 'false'"
              data-tid="camera-glass-flip-y"
              @click="draft.flip_vertical = !draft.flip_vertical"
            >
              ↕ Flip
            </button>
          </div>
        </camera-preview>

        <h3 class="cdet__group">
          Picture
        </h3>
        <section class="m3-set">
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Rotate by</b>
            </div>
            <div class="m3-set__control">
              <seg-picker
                :options="ROTATIONS"
                :value="draft.rotation || 0"
                :disabled="readOnly"
                label="Rotate by"
                @input="draft.rotation = $event"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Flip horizontally</b>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="!!draft.flip_horizontal"
                :disabled="readOnly"
                label="Flip horizontally"
                @input="draft.flip_horizontal = $event"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Flip vertically</b>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="!!draft.flip_vertical"
                :disabled="readOnly"
                label="Flip vertically"
                @input="draft.flip_vertical = $event"
              />
            </div>
          </div>
        </section>
      </div>

      <div class="cdet__right">
        <h3 class="cdet__group">
          Camera
        </h3>
        <section class="m3-set">
          <div class="m3-set__row">
            <label
              class="m3-set__label"
              for="camera-name"
            ><b>Name</b></label>
            <div class="m3-set__control m3-set__control--wide">
              <input
                id="camera-name"
                v-model.trim="draft.name"
                class="cdet__field"
                type="text"
                :disabled="readOnly"
                :aria-invalid="triedSave && !draft.name ? 'true' : undefined"
                data-tid="camera-name"
              >
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Show this camera</b>
              <span>Off keeps it here but hides it from the camera view.</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="draft.enabled !== false"
                :disabled="readOnly"
                label="Show this camera"
                @input="draft.enabled = $event"
              />
            </div>
          </div>
        </section>

        <h3 class="cdet__group">
          Stream
        </h3>
        <section class="m3-set">
          <div class="m3-set__row">
            <label
              class="m3-set__label"
              for="camera-type"
            >
              <b>Stream type</b>
              <span>What the camera sends. Adaptive works with most USB cameras.</span>
            </label>
            <div class="m3-set__control">
              <select
                id="camera-type"
                v-model="draft.service"
                class="cdet__field cdet__field--select"
                :disabled="readOnly"
                data-tid="camera-type"
              >
                <option
                  v-for="type in types"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="m3-set__row">
            <label
              class="m3-set__label"
              for="camera-stream"
            ><b>Stream address</b></label>
            <div class="m3-set__control m3-set__control--wide">
              <input
                id="camera-stream"
                v-model.lazy.trim="draft.stream_url"
                class="cdet__field cdet__field--mono"
                type="text"
                spellcheck="false"
                :disabled="readOnly"
                :aria-invalid="triedSave && !draft.stream_url ? 'true' : undefined"
                data-tid="camera-stream-url"
              >
            </div>
          </div>
          <div class="m3-set__row">
            <label
              class="m3-set__label"
              for="camera-snapshot"
            >
              <b>Snapshot address</b>
              <span>Used for thumbnails and Snapshot.</span>
            </label>
            <div class="m3-set__control m3-set__control--wide">
              <input
                id="camera-snapshot"
                v-model.lazy.trim="draft.snapshot_url"
                class="cdet__field cdet__field--mono"
                type="text"
                spellcheck="false"
                :disabled="readOnly"
                :aria-invalid="triedSave && !draft.snapshot_url ? 'true' : undefined"
                data-tid="camera-snapshot-url"
              >
            </div>
          </div>
          <template v-if="draft.service === 'mjpegstreamer-adaptive'">
            <div class="m3-set__row cdet__cond">
              <label
                class="m3-set__label"
                for="camera-fps"
              >
                <b>Frame rate</b>
                <span>Adaptive only.</span>
              </label>
              <div class="m3-set__control">
                <input
                  id="camera-fps"
                  v-model.number="draft.target_fps"
                  class="cdet__field cdet__field--num"
                  type="number"
                  min="1"
                  :disabled="readOnly"
                  data-tid="camera-fps"
                >
                fps
              </div>
            </div>
            <div class="m3-set__row cdet__cond">
              <label
                class="m3-set__label"
                for="camera-fps-idle"
              >
                <b>When Control is in the background</b>
                <span>Adaptive only. Saves the printer's bandwidth.</span>
              </label>
              <div class="m3-set__control">
                <input
                  id="camera-fps-idle"
                  v-model.number="draft.target_fps_idle"
                  class="cdet__field cdet__field--num"
                  type="number"
                  min="1"
                  :disabled="readOnly"
                  data-tid="camera-fps-idle"
                >
                fps
              </div>
            </div>
          </template>
          <div
            v-if="draft.service === 'iframe'"
            class="m3-set__row cdet__cond"
          >
            <label
              class="m3-set__label"
              for="camera-aspect"
            >
              <b>Aspect ratio</b>
              <span>Width:height, like 16:9. HTTP page only.</span>
            </label>
            <div class="m3-set__control">
              <input
                id="camera-aspect"
                v-model.trim="draft.aspect_ratio"
                class="cdet__field"
                type="text"
                spellcheck="false"
                :disabled="readOnly"
                :aria-invalid="triedSave && !aspectOk ? 'true' : undefined"
                data-tid="camera-aspect"
              >
            </div>
          </div>
        </section>
        <p class="cdet__note">
          Rows with a teal edge appear only for the stream type that needs them.
        </p>

        <p
          v-if="triedSave && problem"
          class="cdet__error"
          role="alert"
          data-tid="camera-problem"
        >
          {{ problem }}
        </p>

        <section
          v-if="!readOnly && !isNew"
          class="m3-set cdet__remove"
        >
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b class="cdet__danger">Remove this camera</b>
              <span>Removes it from Control. The camera itself isn't touched.</span>
            </div>
            <div class="m3-set__control">
              <button
                type="button"
                class="cbtn cbtn--danger"
                data-tid="camera-remove"
                @click="$emit('remove')"
              >
                Remove…
              </button>
            </div>
          </div>
        </section>

        <div
          v-if="!readOnly"
          class="cdet__actions"
        >
          <button
            type="button"
            class="cbtn cbtn--ghost"
            data-tid="camera-cancel"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="camera-save"
            @click="save"
          >
            {{ isNew ? 'Add camera' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { NewWebcamConfig, WebcamConfig, WebcamRotation } from '@/store/webcams/types'
import { STREAM_TYPES } from '@/services/camera/types'
import SegPicker from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import CameraPreview from './CameraPreview.vue'

const ROTATIONS = [
  { value: 0, label: 'None' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '270°' }
]

/**
 * One camera: a live preview that leads, then its settings. Edits are kept
 * here until Save; the preview shows rotation and flips as they change. A
 * camera from moonraker.conf opens read-only, with a note saying why.
 */
@Component({ components: { SegPicker, ToggleSwitch, CameraPreview } })
export default class CameraDetail extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: WebcamConfig | NewWebcamConfig

  readonly ROTATIONS = ROTATIONS
  readonly types = STREAM_TYPES

  draft: WebcamConfig | NewWebcamConfig = {}
  triedSave = false

  created () {
    this.draft = { ...this.camera }
  }

  get isNew (): boolean {
    return !('uid' in this.camera && this.camera.uid)
  }

  get readOnly (): boolean {
    return 'source' in this.camera && this.camera.source === 'config'
  }

  get aspectOk (): boolean {
    return /^\d+\s*[:/]\s*\d+$/.test(this.draft.aspect_ratio ?? '')
  }

  /** What stops Save, in plain words; empty when it can go. */
  get problem (): string {
    if (!this.draft.name) return 'Give the camera a name.'
    if (!this.draft.stream_url) return 'Enter the stream address.'
    if (!this.draft.snapshot_url) return 'Enter the snapshot address.'
    if (this.draft.service === 'iframe' && !this.aspectOk) return 'Enter the aspect ratio as width:height, like 16:9.'
    return ''
  }

  rotateNext () {
    const turns = ROTATIONS.map(r => r.value)
    const at = turns.indexOf(this.draft.rotation ?? 0)
    this.draft.rotation = turns[(at + 1) % turns.length] as WebcamRotation
  }

  save () {
    this.triedSave = true
    if (this.problem) return
    this.$emit('save', { ...this.draft })
  }
}
</script>

<style lang="scss" scoped>
  .cdet__crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
    color: var(--m3d-text-muted);
    font-size: 13px;

    button {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--m3d-accent);
      font-weight: 600;
    }
  }

  .cdet__lock {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;

    b {
      display: block;
    }
  }

  .cdet__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .cdet__group {
    margin: 18px 0 8px 4px;
    color: var(--m3d-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .cdet__right .cdet__group:first-child {
    margin-top: 0;
  }

  .cdet__info {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(0 0 0 / 45%);
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .cdet__glass {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    gap: 8px;

    button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      background: rgb(30 30 34 / 62%);
      backdrop-filter: blur(20px);
      box-shadow: inset 0 0 0 1px var(--m3d-border);
      color: var(--m3d-text);
      font-size: 13px;
      font-weight: 600;

      &.on {
        background: var(--m3d-accent-soft);
        color: var(--m3d-accent);
      }
    }
  }

  .cdet__field {
    width: 100%;
    min-width: 0;
    height: 36px;
    padding: 0 12px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;

    &:disabled {
      opacity: 0.6;
    }

    &[aria-invalid='true'] {
      box-shadow: inset 0 0 0 1px var(--m3d-danger);
    }
  }

  .cdet__field--mono {
    font-family: var(--m3d-mono, ui-monospace, monospace);
    font-size: 13px;
  }

  .cdet__field--num {
    width: 72px;
    text-align: right;
  }

  .cdet__field--select {
    width: auto;
  }

  .cdet__cond {
    padding-left: 10px;
    box-shadow: inset 3px 0 0 var(--m3d-accent);
  }

  .cdet__note {
    margin: 8px 4px 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .cdet__error {
    margin: 12px 4px 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--m3d-danger) 14%, transparent);
    color: var(--m3d-danger);
    font-size: 13px;
  }

  .cdet__remove {
    margin-top: 16px;
  }

  .cdet__danger {
    color: var(--m3d-danger);
  }

  .cdet__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }

  @media (max-width: 760px) {
    .cdet__grid {
      grid-template-columns: 1fr;
    }

    .cdet__info {
      display: none;
    }

    .cdet__glass button {
      height: 34px;
      padding: 0 10px;
      font-size: 12px;
    }
  }
</style>
