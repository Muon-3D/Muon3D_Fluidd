<template>
  <div>
    <v-menu
      bottom
      left
      offset-y
      transition="slide-y-transition"
      :close-on-content-click="true"
    >
      <template #activator="{ on: menu, attrs }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-btn
              :disabled="disabled"
              fab
              small
              text
              v-bind="attrs"
              v-on="{ ...menu, ...tooltip }"
            >
              <v-icon>
                $cog
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t('app.general.btn.advanced') }}</span>
        </v-tooltip>
      </template>

      <v-list dense>
        <v-list-item
          :disabled="!canManage"
          @click="devModeClick"
        >
          <v-list-item-action class="my-0">
            <v-checkbox
              :input-value="devMode"
              readonly
              :disabled="!canManage"
            />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('app.general.label.developer_mode') }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="!canManage">
              {{ $t('app.general.dev_mode.manage-at-printer') }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <template v-if="devMode && canManage">
          <v-divider class="my-1" />
          <v-list-item
            :disabled="loading"
            @click="restoreDefaults"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.general.dev_mode.restore-defaults') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            :disabled="loading"
            @click="backupConfig"
          >
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
    <v-dialog
      v-model="confirmDialog"
      max-width="620px"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.enable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.modal-1') }}</p>
          <p class="font-weight-bold mb-1">
            Warning:
          </p>
          <p>{{ $t('app.general.dev_mode.modal-2') }}</p>
          <p class="font-weight-bold mb-1">
            {{ $t('app.general.dev_mode.modal-warranty-liability') }}:
          </p>
          <p>{{ $t('app.general.dev_mode.modal-3') }}</p>

          <v-checkbox
            v-model="confirmAccepted"
            :label="$t('app.general.dev_mode.modal-checkbox-message')"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="loading"
            @click="closeConfirm"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="red darken-1"
            :disabled="!confirmAccepted || loading"
            @click="confirmEnable"
          >
            {{ $t('app.general.dev_mode.enable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- NEW: Disable Dev Mode modal (simple) -->
    <v-dialog
      v-model="confirmDisableDialog"
      max-width="520px"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.disable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.disable-modal-1') /* "You’re returning to the default configuration." */ }}</p>
          <p>
            {{ $t('app.general.dev_mode.disable-modal-2') /* "Your current custom configuration will be saved so you
            can
            switch back later." */ }}
          </p>
          <p class="text--secondary">
            {{ $t('app.general.dev_mode.disable-modal-3') /* "Because Developer Mode was enabled, warranty may remain
            limited for issues caused by custom configuration." */ }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="loading"
            @click="closeDisable"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :disabled="loading"
            @click="confirmDisable"
          >
            {{ $t('app.general.dev_mode.disable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
// TODO: IMPROOVE DEVELOPER MODE WARNING MESSAGES AND LEGAL DISCALIMER
import { Component, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { httpClientActions } from '@/api/httpClientActions'
import consola from 'consola'

@Component({})
export default class FileSystemConfigureAdvancedOptionsMenu extends Vue {
  private api = useAuxApi().devMode
  private devMode = false
  /** Whether this client may *change* the mode, not merely see it. See updateDevMode. */
  private canManage = false
  private confirmDialog = false // enable modal
  private confirmDisableDialog = false // disable modal
  private confirmAccepted = false
  private disabled = false
  private loading = false

  async mounted () {
    await this.updateDevMode()
  }

  // Two questions, and they are not the same question.
  //
  // "Is developer mode on?" is DEV-4, and it must be answerable here as well as
  // on the panel. "May this client turn it on?" is DEV-1, and it must be
  // answerable only at the machine. /server/aux/dev_mode answers the second one:
  // SEC-2 keeps it on the floor, and that deny covers *reading* the state as
  // well as setting it, so any caller over the network gets 403.
  //
  // This method used to ask only that endpoint and swallow the failure, which
  // made the absence of an answer render as a confident "off". So a printer with
  // developer mode ON showed an unticked box in Fluidd while the panel showed
  // the amber rim. Measured on two M1s on 2026-09-15: /server/muon/dev_mode said
  // enabled:true, /server/aux/dev_mode said 403.
  //
  // Aux stays, as the test of authority rather than as the source of truth: if
  // it answers, this client is the machine and the actions in this menu work; if
  // it does not, they cannot, and the menu hides them rather than offering
  // buttons that fail in silence. The state itself comes from the read-only
  // endpoint the Moonraker fork publishes off the floor for exactly this.
  async updateDevMode () {
    try {
      const result = await this.api.getDevModeStatusDevModeGet()
      const enabled = result.data?.enabled
      // Not merely defensive. When the Aux client still holds its initial '/aux'
      // basePath, that path falls through the LAN vhost's SPA location and comes
      // back as 200 text/html -- a success carrying no state at all. Treat
      // anything that is not a boolean as no answer.
      if (typeof enabled !== 'boolean') {
        throw new Error('unexpected /server/aux/dev_mode payload')
      }
      this.devMode = enabled
      this.canManage = true
    } catch (err) {
      consola.debug('Developer mode is not manageable from this client:', err)
      this.canManage = false
      await this.readDevModeStateOffFloor()
    } finally {
      this.$emit('dev-mode', this.devMode)
      consola.info('Dev mode status updated:', this.devMode, '- manageable:', this.canManage)
    }
  }

  private async readDevModeStateOffFloor () {
    try {
      const response = await httpClientActions.serverMuonDevModeGet()
      const enabled = response.data?.result?.enabled
      if (typeof enabled === 'boolean') {
        this.devMode = enabled
      }
    } catch (err) {
      // Keep the last known state rather than asserting "off". A printer in
      // developer mode that is briefly unreachable is still in developer mode,
      // and this is the only warning the interface carries.
      consola.error('Failed to get dev mode status:', err)
    }
  }

  devModeClick () {
    // Panel-only by DEV-1: a client the floor refuses cannot toggle the mode,
    // and a modal that ends in a silent 403 is worse than no modal.
    if (!this.canManage) return

    // If dev mode is OFF, open the enable modal; if ON, open the disable modal.
    if (this.devMode) {
      this.confirmDisableDialog = true
    } else {
      this.confirmDialog = true
    }
  }

  closeConfirm () {
    this.confirmAccepted = false
    this.confirmDialog = false
  }

  closeDisable () {
    this.confirmDisableDialog = false
  }

  async confirmEnable () {
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
  async confirmDisable () {
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

  async restoreDefaults () {
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

  async backupConfig () {
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
