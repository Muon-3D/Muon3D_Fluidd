<template>
  <tile-shell
    tile="stage"
    title="Printer view"
    bare
    class="st"
  >
    <overview-stage
      v-if="!showCamera"
      class="st__stage"
    />
    <div
      v-else
      class="st__cam"
      data-tid="stage-camera"
    >
      <camera-item
        :camera="cameras[0]"
        class="st__cam-item"
      />
    </div>
    <div
      v-if="toggleShown"
      class="st__seg"
      role="group"
      aria-label="Main view"
      data-tid="view-toggle"
    >
      <button
        type="button"
        :class="{ on: !showCamera }"
        :aria-pressed="showCamera ? 'false' : 'true'"
        @click="view = '3d'"
      >
        <frame-icon
          name="printer"
          small
        />3D view
      </button>
      <button
        type="button"
        :class="{ on: showCamera }"
        :aria-pressed="showCamera ? 'true' : 'false'"
        @click="view = 'camera'"
      >
        <frame-icon
          name="camera2"
          small
        />Camera
      </button>
    </div>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TileShell from './TileShell.vue'
import OverviewStage from '@/components/overview/OverviewStage.vue'
import { modelSettings } from '@/services/m1-3d/device-settings'
import type { WebcamConfig } from '@/store/webcams/types'

/**
 * The main view: the live 3D printer by default. A switch at the top right
 * shows the camera instead, but only when a camera is configured, and
 * Settings can hide the switch.
 */
@Component({
  components: {
    TileShell,
    OverviewStage,
    CameraItem: () => import('@/components/widgets/camera/CameraItem.vue')
  }
})
export default class StageTile extends Vue {
  view: '3d' | 'camera' = modelSettings.opensOn

  get cameras (): WebcamConfig[] {
    return (this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[] | undefined) ?? []
  }

  get toggleAllowed (): boolean {
    return this.$store.state.config?.uiSettings?.general?.overviewCameraToggle !== false
  }

  get toggleShown (): boolean {
    return this.cameras.length > 0 && this.toggleAllowed && modelSettings.show
  }

  /** With the 3D printer off, the camera if there is one (else the stage's still picture). */
  get showCamera (): boolean {
    if (!modelSettings.show) return this.cameras.length > 0
    return this.view === 'camera' && this.toggleShown
  }
}
</script>

<style lang="scss">
.st { min-height: 420px; }
.st .ot__door { position: relative; flex: 1 1 auto; }
.st__stage.ov-stage, .st__cam { position: absolute; inset: 0; min-height: 0; border-radius: 0; }
.st__cam { overflow: hidden; background: #242a2d; }
.st__cam-item { height: 100%; }
.st__seg { position: absolute; top: 12px; right: 12px; z-index: 3; display: inline-flex; padding: 3px; border-radius: 999px; background: var(--m3d-glass-thick, var(--m3d-surface)); box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge); backdrop-filter: var(--m3d-glass-filter); }
.st__seg button { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 13px; border-radius: 999px; color: var(--m3d-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
.st__seg button .frame-icon { color: inherit; }
.st__seg button.on { background: var(--m3d-surface-2); color: var(--m3d-text); box-shadow: var(--m3d-shadow-control); }
@media (max-width: 599px) { .st { min-height: 300px; } }
</style>
