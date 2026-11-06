<template>
  <div
    v-if="hasCamera"
    class="camera-actions"
  >
    <button
      type="button"
      class="cbtn cbtn--ghost"
      data-tid="camera-snapshot"
      @click="send('camera-snapshot')"
    >
      <frame-icon
        name="camera2"
        small
      />
      Snapshot
    </button>
    <router-link
      v-if="timelapseSupported"
      :to="timelapseTo"
      class="cbtn cbtn--ghost"
      data-tid="camera-timelapse"
    >
      <frame-icon
        name="clock"
        small
      />
      Timelapse
    </router-link>
    <v-menu
      offset-y
      left
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="camera-actions__round"
          aria-label="More camera actions"
          data-tid="camera-more"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          data-tid="camera-fullscreen"
          @click="send('camera-fullscreen')"
        >
          <v-list-item-title>
            Full screen
            <kbd
              v-if="!isMobileViewport"
              class="camera-actions__key"
            >F</kbd>
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :to="settingsTo"
          data-tid="camera-more-settings"
        >
          <v-list-item-title>Camera settings</v-list-item-title>
        </v-list-item>
        <v-list-item
          :to="settingsTo"
          data-tid="camera-more-add"
        >
          <v-list-item-title>Add a camera</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { EventBus } from '@/eventBus'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/**
 * Camera's actions in the page header: Snapshot, Timelapse (when the
 * printer records them) and a ··· menu with Full screen (F), the camera
 * settings and adding a camera. The page takes the snapshot and fills the screen.
 */
@Component({})
export default class CameraActions extends Mixins(BrowserMixin) {
  get hasCamera (): boolean {
    return (this.$store.getters['webcams/getEnabledWebcams'] as unknown[]).length > 0
  }

  get timelapseSupported (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse') as boolean
  }

  get timelapseTo (): string {
    return scopedPath('/timelapse', activeSlug())
  }

  get settingsTo (): string {
    return `${scopedPath('/settings', activeSlug())}#camera`
  }

  send (event: string) {
    EventBus.bus.$emit(event)
  }
}
</script>

<style lang="scss" scoped>
  .camera-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .camera-actions__round {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .camera-actions__key {
    margin-left: 8px;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--m3d-fill, rgba(255, 255, 255, 0.08));
    box-shadow: none;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 11px;
  }
</style>
