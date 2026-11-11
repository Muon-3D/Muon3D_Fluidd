<template>
  <div>
    <v-subheader id="browser">
      {{ $t('app.setting.title.file_browser') }}
    </v-subheader>
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
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.text_sort_order')">
        <v-select
          v-model="textSortOrder"
          filled
          dense
          hide-details="auto"
          :items="availableTextSortOrders"
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'

/** Settings › Files and editor (KAN-1960, files storyboard): says up front what Developer mode means for these files on a Muon printer. */
@Component({})
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

  get availableTextSortOrders () {
    return [
      {
        value: 'default',
        text: this.$t('app.general.label.default')
      },
      {
        value: 'numeric-prefix',
        text: this.$t('app.general.label.numeric_prefix_sort')
      },
      {
        value: 'version',
        text: this.$t('app.general.label.version_sort')
      }
    ]
  }
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
