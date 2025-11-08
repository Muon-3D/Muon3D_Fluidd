<template>
  <div>
    <v-menu bottom left offset-y transition="slide-y-transition" :close-on-content-click="true">
      <template #activator="{ on: menu, attrs }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-btn :disabled="disabled" fab small text v-bind="attrs" v-on="{ ...menu, ...tooltip }">
              <v-icon>
                $cog
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t('app.general.btn.advanced') }}</span>
        </v-tooltip>
      </template>

      <v-list dense>
        <v-list-item @click="devModeClick">
          <v-list-item-action class="my-0">
            <v-checkbox :input-value="devMode" readonly />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('app.general.label.developer_mode') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <template v-if="devMode">
          <v-divider class="my-1" />
          <v-list-item :disabled="loading" @click="restoreDefaults">
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.general.dev_mode.restore-defaults') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :disabled="loading" @click="backupConfig">
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.general.dev_mode.backup-config') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <!-- Enable Dev Mode modal -->
    <v-dialog v-model="confirmDialog" max-width="620px">
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.enable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.modal-1') }}</p>
          <p class="font-weight-bold mb-1">Warning:</p>
          <p>{{ $t('app.general.dev_mode.modal-2') }}</p>
          <p class="font-weight-bold mb-1">{{ $t('app.general.dev_mode.modal-warranty-liability') }}:</p>
          <p>{{ $t('app.general.dev_mode.modal-3') }}</p>

          <v-checkbox v-model="confirmAccepted" :label="$t('app.general.dev_mode.modal-checkbox-message')"
            class="mt-4" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text :disabled="loading" @click="closeConfirm">
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn color="red darken-1" :disabled="!confirmAccepted || loading" @click="confirmEnable">
            {{ $t('app.general.dev_mode.enable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- NEW: Disable Dev Mode modal (simple) -->
    <v-dialog v-model="confirmDisableDialog" max-width="520px">
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.disable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.disable-modal-1') /* "You’re returning to the default configuration." */ }}</p>
          <p>{{ $t('app.general.dev_mode.disable-modal-2') /* "Your current custom configuration will be saved so you
            can
            switch back later." */ }}</p>
          <p class="text--secondary">
            {{ $t('app.general.dev_mode.disable-modal-3') /* "Because Developer Mode was enabled, warranty may remain
            limited for issues caused by custom configuration." */ }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text :disabled="loading" @click="closeDisable">
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn color="primary" :disabled="loading" @click="confirmDisable">
            {{ $t('app.general.dev_mode.disable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script lang="ts">
//TODO: IMPROOVE DEVELOPER MODE WARNING MESSAGES AND LEGAL DISCALIMER
import { Component, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import consola from 'consola'

@Component({})
export default class FileSystemConfigureAdvancedOptionsMenu extends Vue {
  private api = useAuxApi().devMode
  private devMode = false
  private confirmDialog = false              // enable modal
  private confirmDisableDialog = false       // disable modal
  private confirmAccepted = false
  private disabled = false
  private loading = false

  async mounted() {
    await this.updateDevMode()
  }

  async updateDevMode() {
    try {
      const result = await this.api.getDevModeStatusDevModeGet()
      this.devMode = result.data.enabled
    } catch (err) {
      consola.error('Failed to get dev mode status:', err)
    } finally {
      this.$emit('dev-mode', this.devMode)
      consola.info('Dev mode status updated:', this.devMode)
    }
  }

  devModeClick() {
    // If dev mode is OFF, open the enable modal; if ON, open the disable modal.
    if (this.devMode) {
      this.confirmDisableDialog = true
    } else {
      this.confirmDialog = true
    }
  }

  closeConfirm() {
    this.confirmAccepted = false
    this.confirmDialog = false
  }

  closeDisable() {
    this.confirmDisableDialog = false
  }

  async confirmEnable() {
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({ enabled: true })
    } catch (err) {
      consola.error('Failed to enable dev mode:', err)
    } finally {
      this.loading = false
      this.closeConfirm()
      await this.updateDevMode()
    }
  }

  // NEW: Disable Dev Mode (returns to OEM defaults; dev-mode config remains saved on disk)
  async confirmDisable() {
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({ enabled: false })
    } catch (err) {
      consola.error('Failed to disable dev mode:', err)
    } finally {
      this.loading = false
      this.closeDisable()
      await this.updateDevMode()
      this.$emit('refresh-fs')
    }
  }

  async restoreDefaults() {
    this.loading = true
    try {
      await this.api.refreshDevModeConfigDevModeRefreshPost()
    } catch (err) {
      consola.error('Failed to restore dev-mode defaults:', err)
    } finally {
      this.loading = false
      this.$emit('refresh-fs')
    }
  }

  async backupConfig() {
    this.loading = true
    try {
      await this.api.manualBackupDevModeBackupPost()
    } catch (err) {
      consola.error('Failed to back up dev-mode config:', err)
    } finally {
      this.loading = false
      this.$emit('refresh-fs')
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.v-list-item--active::before) {
  opacity: 0;
}

:deep(.v-list-item--active:hover::before) {
  opacity: 0.08;
}
</style>
