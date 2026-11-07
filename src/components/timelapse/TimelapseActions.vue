<template>
  <div
    class="tl-actions"
    data-tid="timelapse-actions"
  >
    <router-link
      :to="settingsPath"
      class="cbtn tl-actions__settings"
      data-tid="timelapse-settings-link"
    >
      Timelapse settings <span aria-hidden="true">›</span>
    </router-link>
    <v-menu
      offset-y
      left
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="tl-actions__round"
          aria-label="More about timelapses"
          data-tid="timelapse-more"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          :disabled="!canRender"
          data-tid="timelapse-render"
          @click="renderOpen = true"
        >
          <v-list-item-title>Render this print now…</v-list-item-title>
        </v-list-item>
        <v-list-item
          :disabled="!canSaveFrames"
          data-tid="timelapse-save-frames"
          @click="saveFrames"
        >
          <v-list-item-title>Save this print's frames</v-list-item-title>
        </v-list-item>
        <v-list-item
          :disabled="!socketConnected"
          data-tid="timelapse-refresh"
          @click="page.refreshTick++"
        >
          <v-list-item-title>Refresh the list</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <timelapse-render-settings-dialog
      v-if="renderOpen"
      v-model="renderOpen"
      renderable
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { RenderStatus, TimelapseLastFrame } from '@/store/timelapse/types'
import { timelapsePage } from '@/services/timelapse/page-state'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import TimelapseRenderSettingsDialog from '@/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue'

/**
 * The Timelapse header's actions: the settings live in Settings › Timelapse,
 * and this print's render and saved frames, with Refresh, in the ··· menu.
 */
@Component({ components: { TimelapseRenderSettingsDialog } })
export default class TimelapseActions extends Mixins(StateMixin) {
  page = timelapsePage
  renderOpen = false

  get settingsPath (): string {
    return `${scopedPath('/settings', activeSlug())}#timelapse`
  }

  get frameCount (): number {
    return (this.$store.getters['timelapse/getLastFrame'] as TimelapseLastFrame | undefined)?.uniqueCount ?? 0
  }

  get rendering (): boolean {
    const status = this.$store.getters['timelapse/getRenderStatus'] as RenderStatus | undefined
    return !!status && status.status !== 'success'
  }

  get canRender (): boolean {
    return this.socketConnected && this.frameCount > 0 && !this.rendering
  }

  get canSaveFrames (): boolean {
    return this.socketConnected && this.frameCount > 0 && !this.hasWait(this.$waits.onTimelapseSaveFrame)
  }

  saveFrames () {
    SocketActions.machineTimelapseSaveFrames(this.$waits.onTimelapseSaveFrame)
  }
}
</script>

<style lang="scss" scoped>
  .tl-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .tl-actions__settings {
    text-decoration: none;
  }

  .tl-actions__round {
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
</style>
