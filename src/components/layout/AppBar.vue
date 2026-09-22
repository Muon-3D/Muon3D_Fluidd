<template>
  <v-app-bar
    app
    class="muon-app-bar"
    clipped-left
    extension-height="46"
    :color="$vuetify.theme.currentTheme.appbar"
    :height="$globals.HEADER_HEIGHT"
  >
    <router-link
      v-if="!isMobileViewport"
      to="/"
      class="toolbar-logo muon-brand"
    >
      <app-icon />
      <span class="muon-brand-wordmark">
        <strong>MUON</strong><small>OS</small>
      </span>
    </router-link>

    <div class="toolbar-title">
      <app-btn
        v-if="isMobileViewport"
        fab
        small
        :elevation="0"
        class="mobile-nav-button mx-1"
        color="transparent"
        @click="$emit('navdrawer')"
      >
        <v-icon>$menuAlt</v-icon>
      </app-btn>

      <v-toolbar-title class="printer-title">
        <router-link
          to="/"
          v-html="instanceName"
        />
        <span class="muon-local-label">LOCAL PRINTER</span>
      </v-toolbar-title>
    </div>

    <!-- <v-spacer /> -->

    <div class="toolbar-supplemental muon-toolbar-actions">
      <div
        v-if="socketConnected && klippyReady && authenticated && showSaveConfigAndRestartForPendingChanges"
        class="mr-1"
      >
        <app-save-config-and-restart-btn
          :loading="hasWait($waits.onSaveConfig)"
          :disabled="printerPrinting || printerPaused"
          @click="saveConfigAndRestart"
        />
      </div>

      <div v-if="socketConnected && !isMobileViewport && authenticated">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              :disabled="!klippyReady"
              v-bind="attrs"
              class="toolbar-action mx-1"
              color=""
              v-on="on"
              @click="emergencyStop()"
            >
              <v-icon
                color="error"
                class="danger-action"
              >
                $estop
              </v-icon>
            </app-btn>
          </template>
          <span>
            {{ $t('app.general.tooltip.estop') }}
            <template v-if="enableKeyboardShortcuts">
              <br>
              <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>e</kbd>
            </template>
          </span>
        </v-tooltip>
      </div>

      <div v-if="authenticated && socketConnected && showUploadAndPrint">
        <app-upload-and-print-btn
          :disabled="printerPrinting || printerPaused || !klippyReady"
          @upload="handleUploadAndPrint"
        />
      </div>

      <div v-if="authenticated && socketConnected && topNavPowerToggle">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              fab
              small
              :elevation="0"
              class="toolbar-action mr-1 bg-transparent"
              color="transparent"
              :disabled="topNavPowerDeviceDisabled"
              v-bind="attrs"
              v-on="on"
              @click="handlePowerToggle()"
            >
              <v-icon>
                {{ topNavPowerDeviceOn ? '$powerOn' : '$powerOff' }}
              </v-icon>
            </app-btn>
          </template>
          <span>{{ $t(`app.general.label.turn_device_${topNavPowerDeviceOn ? 'off' : 'on'}`, { device: topNavPowerToggle.name }) }}</span>
        </v-tooltip>
      </div>

      <div
        v-if="authenticated && socketConnected"
        class="toolbar-action mr-1"
      >
        <app-notification-menu />
      </div>

      <div
        v-if="supportsAuth && authenticated"
        class="toolbar-action mr-1"
      >
        <app-user-menu @change-password="userPasswordDialogOpen = true" />
      </div>

      <div
        v-if="supportsAuth && authenticated"
        class="toolbar-action mr-1"
      >
        <app-wifi-button />
      </div>

      <app-btn
        fab
        small
        :elevation="0"
        class="toolbar-action mr-1"
        color="transparent"
        @click="$emit('toolsdrawer')"
      >
        <v-icon>$menu</v-icon>
      </app-btn>
    </div>

    <template
      v-if="inLayout"
      #extension
    >
      <app-btn
        small
        class="layout-action mx-2"
        color="primary"
        @click.stop="handleExitLayout"
      >
        {{ $t('app.general.btn.exit_layout') }}
      </app-btn>
      <app-btn
        small
        class="layout-action mx-2"
        color="primary"
        @click.stop="handleResetLayout"
      >
        {{ $t('app.general.btn.reset_layout') }}
      </app-btn>
      <template v-if="isDashboard">
        <v-divider
          vertical
          class="mx-2"
        />
        <app-btn
          small
          class="layout-action mx-2"
          color="primary"
          @click.stop="handleSetDefaultLayout"
        >
          {{ $t('app.general.btn.set_default_layout') }}
        </app-btn>
        <app-btn
          small
          class="mx-2"
          color="primary"
          @click.stop="handleResetDefaultLayout"
        >
          {{ $t('app.general.btn.reset_default_layout') }}
        </app-btn>
      </template>
    </template>

    <user-password-dialog
      v-if="userPasswordDialogOpen"
      v-model="userPasswordDialogOpen"
    />

    <pending-changes-dialog
      v-if="pendingChangesDialogOpen"
      v-model="pendingChangesDialogOpen"
      @save="saveConfigAndRestart(true)"
    />
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UserPasswordDialog from '@/components/settings/auth/UserPasswordDialog.vue'
import PendingChangesDialog from '@/components/settings/PendingChangesDialog.vue'
import AppSaveConfigAndRestartBtn from './AppSaveConfigAndRestartBtn.vue'
import AppUploadAndPrintBtn from './AppUploadAndPrintBtn.vue'
import { defaultState } from '@/store/layout/state'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import AppWifiButton from '@/components/ui/AppWifiButton.vue'

@Component({
  components: {
    UserPasswordDialog,
    PendingChangesDialog,
    AppSaveConfigAndRestartBtn,
    AppUploadAndPrintBtn,
    AppWifiButton
  }
})
export default class AppBar extends Mixins(StateMixin, ServicesMixin, FilesMixin, BrowserMixin) {
  menu = false
  userPasswordDialogOpen = false
  pendingChangesDialogOpen = false

  get supportsAuth () {
    return this.$store.getters['server/componentSupport']('authorization')
  }

  get instances () {
    return this.$store.state.config.instances
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get currentFile () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  get saveConfigPending (): boolean {
    return this.$store.getters['printer/getSaveConfigPending'] as boolean
  }

  get saveConfigPendingItems (): Record<string, Record<string, string>> {
    return this.$store.getters['printer/getSaveConfigPendingItems'] as Record<string, Record<string, string>>
  }

  get showSaveConfigAndRestartForPendingChanges (): boolean {
    if (!this.showSaveConfigAndRestart || !this.saveConfigPending) {
      return false
    }

    const sectionsToIgnore = this.sectionsToIgnorePendingConfigurationChanges

    return (
      sectionsToIgnore.length === 0 ||
      Object.keys(this.saveConfigPendingItems)
        .filter(key => !sectionsToIgnore.includes(key))
        .length > 0
    )
  }

  get devicePowerComponentEnabled () {
    return this.$store.getters['server/componentSupport']('power')
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get showSaveConfigAndRestart (): boolean {
    return this.$store.state.config.uiSettings.general.showSaveConfigAndRestart as boolean
  }

  get sectionsToIgnorePendingConfigurationChanges (): string[] {
    return this.$store.state.config.uiSettings.general.sectionsToIgnorePendingConfigurationChanges as string[]
  }

  get showUploadAndPrint (): boolean {
    return this.$store.state.config.uiSettings.general.showUploadAndPrint
  }

  get topNavPowerToggle () {
    const topNavPowerToggle = this.$store.state.config.uiSettings.general.topNavPowerToggle as string | null

    if (!topNavPowerToggle) return null

    const [name, type] = topNavPowerToggle.split(':')

    switch (type) {
      case 'klipper': {
        const device = this.$store.getters['printer/getPinByName'](name) as OutputPin | undefined

        return {
          type,
          name: device?.prettyName ?? name,
          device
        }
      }

      default: {
        const device = this.$store.getters['power/getDeviceByName'](topNavPowerToggle) as Device

        return {
          type: 'moonraker' as const,
          name: topNavPowerToggle,
          device
        }
      }
    }
  }

  get topNavPowerDeviceOn (): boolean {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return false

    switch (type) {
      case 'moonraker':
        return device.status === 'on'

      case 'klipper':
        return device.value !== 0
    }

    return false
  }

  get topNavPowerDeviceDisabled (): boolean {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return true

    switch (type) {
      case 'moonraker':
        return (this.printerPrinting && device.locked_while_printing) || ['init', 'error'].includes(device.status) || (!this.devicePowerComponentEnabled)

      case 'klipper':
        return !this.klippyReady
    }

    return true
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleExitLayout () {
    this.$store.commit('config/setLayoutMode', false)
  }

  get isDashboard () {
    return this.$route.path === '/'
  }

  handleResetLayout () {
    const pathLayouts: Record<string, string> = {
      '/diagnostics': 'diagnostics'
    }

    const pathLayout = pathLayouts[this.$route.path]
    let layoutDefaultState
    if (pathLayout) {
      // reset to default init state
      layoutDefaultState = defaultState().layouts[pathLayout]
    } else {
      // reset dashboard to default layout
      layoutDefaultState = this.$store.getters['layout/getLayout']('dashboard')
    }

    const toReset = pathLayout ?? this.$store.getters['layout/getSpecificLayoutName']

    this.$store.dispatch('layout/onLayoutChange', {
      name: toReset,
      value: layoutDefaultState
    })
  }

  handleSetDefaultLayout () {
    const currentLayoutName = this.$store.getters['layout/getSpecificLayoutName']
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: this.$store.getters['layout/getLayout'](currentLayoutName)
    })
  }

  handleResetDefaultLayout () {
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: defaultState().layouts.dashboard
    })
  }

  async handlePowerToggle () {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return

    const confirmOnPowerDeviceChange = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange

    const result = (
      !confirmOnPowerDeviceChange ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_power_device_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      switch (type) {
        case 'moonraker': {
          const state = (device.status === 'on') ? 'off' : 'on'
          SocketActions.machineDevicePowerToggle(device.device, state)
          break
        }

        case 'klipper': {
          const value = (device.value !== 0) ? 0 : device.scale
          this.sendGcode(`SET_PIN PIN=${device.name} VALUE=${value}`, `${this.$waits.onSetOutputPin}${device.name}`)
          break
        }
      }
    }
  }

  handleUploadAndPrint (file: File) {
    this.uploadFile(file, '/', 'gcodes', true)
  }

  saveConfigAndRestart (force = false) {
    if (!force) {
      const confirmOnSaveConfigAndRestart = this.$store.state.config.uiSettings.general.confirmOnSaveConfigAndRestart

      if (confirmOnSaveConfigAndRestart) {
        this.pendingChangesDialogOpen = true

        return
      }
    }

    this.sendGcode('SAVE_CONFIG', this.$waits.onSaveConfig)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .muon-app-bar {
    background: var(--m3d-surface-1) !important;
    border-bottom: 1px solid var(--m3d-border) !important;
    box-shadow: var(--m3d-shadow-sm) !important;
    color: var(--m3d-text);
  }

  .toolbar-logo {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 152px;
    gap: 8px;
    height: inherit;
    color: inherit;
    text-decoration: none;
  }

  .muon-brand-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    letter-spacing: 0.14em;
    line-height: 1;
    color: var(--m3d-text);
    font-family: var(--m3d-font-display);
    font-size: var(--m3d-text-sm);
  }

  .muon-brand-wordmark strong {
    font-weight: var(--m3d-weight-regular);
  }

  .muon-brand-wordmark small {
    color: var(--m3d-accent);
    font-size: var(--m3d-text-2xs);
    font-weight: var(--m3d-weight-bold);
    letter-spacing: 0.16em;
  }

  .toolbar-title {
    display: flex;
    flex: 1 1;
    max-width: 50%;
    height: inherit;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
  }

  .toolbar-supplemental {
    display: flex;
    justify-content: flex-end;
    flex: 0 0 50%;
    max-width: 50%;
    align-items: center;
    height: inherit;
  }

  .printer-title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
    font-size: 1.05rem;
    font-weight: var(--m3d-weight-semibold);
    font-family: var(--m3d-font-sans);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @media #{map-get($display-breakpoints, 'sm-and-up')} {
      font-size: 1.875rem;
    }
  }

  .printer-title > a {
    color: inherit;
    text-decoration: none;
  }

  .muon-local-label {
    flex: 0 0 auto;
    border: 1px solid var(--m3d-border-strong);
    border-radius: var(--m3d-radius-pill, 999px);
    padding: 4px 8px;
    color: var(--m3d-text-muted);
    font-family: inherit;
    font-size: 0.58rem;
    font-weight: var(--m3d-weight-bold);
    letter-spacing: 0.11em;
    line-height: 1;
  }

  .v-toolbar--extended :deep(.v-toolbar__content) {
    box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
  }

  :deep(.v-toolbar__extension) {
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  :deep(.v-toolbar__content) {
    padding-left: 0;
  }

  .toolbar-action,
  .mobile-nav-button {
    min-width: 44px !important;
    min-height: 44px !important;
    border-radius: var(--m3d-radius-pill) !important;
  }

  .toolbar-action:hover,
  .mobile-nav-button:hover {
    background: var(--m3d-surface-2) !important;
  }

  .danger-action {
    filter: drop-shadow(0 0 8px var(--m3d-danger));
  }

  .layout-action {
    min-height: 40px !important;
    border-radius: var(--m3d-radius-pill) !important;
  }

  .v-btn.v-btn--disabled.v-btn--has-bg.bg-transparent {
    background: none !important;
  }

  @media #{map-get($display-breakpoints, 'xs-only')} {
    .toolbar-title {
      max-width: 58%;
      padding: 0 4px;
    }

    .toolbar-supplemental {
      flex-basis: 42%;
      max-width: 42%;
    }

    .muon-local-label {
      display: none;
    }

    .printer-title {
      font-size: 0.94rem;
    }
  }
</style>
