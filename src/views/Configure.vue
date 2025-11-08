<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="6"
    >
      <collapsable-card
        :title="$t('app.general.title.config_files')"
        icon="$codeJson"
        :help-tooltip="$t('app.general.tooltip.file_browser_help')"
      >
        <file-system
          ref="configFs"
          :key="configurationRoots.join('|')"
          :roots="configurationRoots"
          max-height="816"
          name="configure"
          bulk-actions
        >
        <template #extra-actions>
          <file-system-configure-advanced-options-menu
          @dev-mode="handleDevModeChanged"
          @refresh-fs="refreshFS"/>
        </template>
      </file-system>
      </collapsable-card>
    </v-col>
    <v-col
      cols="12"
      md="6"
    >
      <collapsable-card
        :title="$t('app.general.title.other_files')"
        icon="$files"
        :help-tooltip="$t('app.general.tooltip.file_browser_configuration_help')"
      >
        <file-system
          :roots="roots"
          max-height="816"
          name="configure"
        />
      </collapsable-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import FileSystemConfigureAdvancedOptionsMenu from '@/components/widgets/filesystem/FileSystemConfigureAdvancedOptionsMenu.vue'

import SystemOverviewCard from '@/components/widgets/system/SystemOverviewCard.vue'
import SystemUsageCard from '@/components/widgets/system/SystemUsageCard.vue'
import DiskUsageCard from '@/components/widgets/system/DiskUsageCard.vue'

@Component({
  components: {
    FileSystem,
    SystemOverviewCard,
    SystemUsageCard,
    DiskUsageCard,
    FileSystemConfigureAdvancedOptionsMenu
  }
})
export default class Configure extends Mixins(StateMixin) {
  get hasGraphData () {
    return (
      this.$store.state.charts.klipper !== undefined ||
      this.$store.state.charts.moonraker !== undefined ||
      this.$store.state.charts.memory !== undefined
    )
  }

  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }

  get roots () {
    const roots = ['logs', 'docs']
    const excludeRoots = ['gcodes', 'config', 'timelapse', 'timelapse_frames', 'calibration', 'defaults']

    for (const root of this.$store.state.server.info.registered_directories || []) {
      if (!excludeRoots.includes(root) && !roots.includes(root)) {
        roots.push(root)
      }
    }

    return roots
  }

  private configurationRoots = ['calibration', 'defaults']
  handleDevModeChanged(devMode: boolean) {
    if (devMode) {
      if (!this.configurationRoots.includes('config')) {
        this.configurationRoots.unshift('config')
      }
    } else {
      this.configurationRoots = this.configurationRoots.filter(root => root !== 'config')
    }
  }

  refreshFS(){
    const fs = this.$refs.configFs as any
    if (fs && fs.currentPath) {
      fs.refreshPath(fs.currentPath)
    }
  }
}
</script>
