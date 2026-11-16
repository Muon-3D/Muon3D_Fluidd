<template>
  <plate-clear-notice
    v-if="shows"
    class="plate-bar"
    :managed="managed"
    :owner="canManageAccess === true"
    :settings-path="settingsPath"
  />
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import PlateClearNotice from './PlateClearNotice.vue'
import { plateNoticeShows } from '@/services/plate/clear'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/**
 * The plate-clear notice at the top of Overview and Control (CT-14): only
 * while the printer says the plate needs confirming and nothing is printing
 * or paused. The owner link to Settings > Security uses the printer's own
 * "may manage access" answer; no gate is changed here.
 */
@Component({ components: { PlateClearNotice } })
export default class PlateClearBar extends Mixins(MuonGatesMixin) {
  get shows (): boolean {
    return plateNoticeShows(this.$store.state.printer.printer, this.printerState)
  }

  get managed (): boolean {
    return isManagedApiUrl(this.$store.state.config.apiUrl as string | null)
  }

  get settingsPath (): string {
    return `${scopedPath('/settings', activeSlug())}#security`
  }
}
</script>

<style lang="scss" scoped>
.plate-bar { margin-bottom: 16px; }
</style>
