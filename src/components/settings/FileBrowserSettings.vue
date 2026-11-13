<template>
  <div id="browser">
    <div
      v-if="isMuonPrinter === true && !devModeEnabled"
      class="files-devmode"
      data-tid="files-devmode-note"
    >
      <p class="files-devmode__title">
        Developer mode is off.
      </p>
      <p>On {{ printerName }} the config folder shows only in Developer mode; calibration and the Muon3D defaults stay open. Your print files in Jobs aren't affected.</p>
      <router-link
        :to="developerLink"
        data-tid="files-devmode-link"
      >
        Developer mode ›
      </router-link>
    </div>
    <section
      class="m3-set"
      data-tid="files-lists"
    >
      <h2 class="m3-set__title">
        Lists of files
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Sort names</b>
          <span>Numbers in order means "part 2" comes before "part 10".</span>
        </div>
        <div class="m3-set__control">
          <seg-picker
            :options="sortOptions"
            :value="textSortOrder"
            label="Sort names"
            data-tid="files-sort-names"
            @input="textSortOrder = $event"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Show hidden files</b>
          <span>Names starting with a dot.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="showHiddenFiles"
            label="Show hidden files"
            data-tid="files-show-hidden"
            @input="showHiddenFiles = $event"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import SegPicker from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'

/** Settings › Files and editor (KAN-1960, files storyboard): says up front what Developer mode means for these files on a Muon printer. */
@Component({ components: { SegPicker, ToggleSwitch } })
export default class FileBrowserSettings extends Mixins(MuonGatesMixin) {
  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get developerLink (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }

  get textSortOrder () {
    return this.$store.state.config.uiSettings.general.textSortOrder
  }

  set textSortOrder (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.textSortOrder',
      value,
      server: true
    })
  }

  get showHiddenFiles (): boolean {
    return !!this.$store.state.config.uiSettings.fileSystem.showHiddenFiles
  }

  set showHiddenFiles (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.fileSystem.showHiddenFiles', value, server: true })
  }

  readonly sortOptions = [
    { value: 'default', label: 'A–Z' },
    { value: 'numeric-prefix', label: 'Numbers in order' },
    { value: 'version', label: 'Versions' }
  ]
}
</script>

<style lang="scss" scoped>
  .files-devmode {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    p {
      margin: 0;
    }
  }

  .files-devmode__title {
    color: var(--m3d-text);
    font-weight: 600;
  }
</style>
