<template>
  <div
    id="general"
    class="gs"
    data-tid="general-settings"
  >
    <h2 class="gs__gt">
      This printer
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Name
          </div>
          <div class="gs__s">
            Shown in the top bar, on the printer's screen and to everyone it's shared with.
          </div>
        </div>
        <div class="gs__ctl gs__ctl--wide">
          <v-text-field
            ref="instanceName"
            outlined
            dense
            single-line
            hide-details="auto"
            :rules="[$rules.required]"
            :value="instanceName"
            :default-value="$globals.APP_NAME"
            aria-label="Name"
            data-tid="setting-name"
            @change="setInstanceName"
          />
        </div>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Model
          </div>
          <div class="gs__s">
            Read from the printer.
          </div>
        </div>
        <span
          class="gs__v"
          data-tid="setting-model"
        >{{ model }}</span>
      </div>
    </div>

    <h2 class="gs__gt">
      Look
    </h2>
    <div
      id="theme"
      class="gs__list"
      data-tid="theme-settings"
    >
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Accent colour
          </div>
          <div class="gs__s">
            Buttons, switches and highlights. Glass is the only look.
          </div>
        </div>
        <div
          class="gs__swatches"
          role="radiogroup"
          aria-label="Accent colour"
        >
          <button
            v-for="accent in accents"
            :key="accent.color"
            type="button"
            role="radio"
            class="gs__swatch"
            :class="{ 'gs__swatch--on': accentOn === accent.color }"
            :style="{ background: accent.color }"
            :aria-label="accent.name"
            :aria-checked="accentOn === accent.color ? 'true' : 'false'"
            :data-tid="`accent-${accent.name.toLowerCase()}`"
            @click="setAccent(accent.color)"
          />
        </div>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Light or dark
          </div>
          <div class="gs__s">
            Auto follows this device.
          </div>
        </div>
        <seg-picker
          :options="modeOptions"
          :value="mode"
          label="Light or dark"
          data-tid="setting-theme-mode"
          @input="setMode"
        />
      </div>
    </div>
    <p class="gs__gh">
      These are yours on this printer: someone else on {{ printerName }} keeps their own.
    </p>

    <h2 class="gs__gt">
      Language and time
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Language
          </div>
        </div>
        <div class="gs__ctl gs__ctl--wide">
          <v-select
            outlined
            dense
            hide-details
            item-value="code"
            item-text="name"
            aria-label="Language"
            :items="supportedLocales"
            :value="locale"
            @change="setLocale"
          />
        </div>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Dates
          </div>
        </div>
        <div class="gs__ctl gs__ctl--wide">
          <v-select
            v-model="dateFormat"
            outlined
            dense
            hide-details
            aria-label="Dates"
            :items="availableDateFormats"
          />
        </div>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Times
          </div>
        </div>
        <seg-picker
          :options="timeOptions"
          :value="timeChoice"
          label="Times"
          data-tid="setting-times"
          @input="timeFormat = String($event)"
        />
      </div>
    </div>

    <h2 class="gs__gt">
      Ask before
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Emergency stop
          </div>
          <div class="gs__s">
            Off: one press stops {{ printerName }} at once. On: it asks first.
          </div>
        </div>
        <toggle-switch
          :value="confirmOnEstop"
          label="Emergency stop"
          @input="setConfirmOnEstop"
        />
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Saving the configuration
          </div>
          <div class="gs__s">
            Saving restarts the firmware, so it asks.
          </div>
        </div>
        <toggle-switch
          :value="confirmOnSaveConfigAndRestart"
          label="Saving the configuration"
          @input="savePersonal('general.confirmOnSaveConfigAndRestart', $event)"
        />
      </div>
      <div
        v-if="hasPowerDevices"
        class="gs__row"
        data-tid="setting-ask-power"
      >
        <div class="gs__grow">
          <div class="gs__t">
            Turning off a power switch
          </div>
          <div class="gs__s">
            It asks before one of the printer's power switches turns off, or on.
          </div>
        </div>
        <toggle-switch
          :value="confirmOnPowerDeviceChange"
          label="Turning off a power switch"
          @input="savePersonal('general.confirmOnPowerDeviceChange', $event)"
        />
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Printing straight after upload
          </div>
          <div class="gs__s">
            On: Upload &amp; print is in the top bar, and checks the plate before it starts. Off: there's only Upload.
          </div>
        </div>
        <toggle-switch
          :value="showUploadAndPrint"
          label="Printing straight after upload"
          @input="savePersonal('general.showUploadAndPrint', $event)"
        />
      </div>
    </div>

    <h2 class="gs__gt">
      Overview and the top bar
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Progress is measured by
          </div>
          <div class="gs__s">
            File position is steady; layers jump.
          </div>
        </div>
        <seg-picker
          :options="progressOptions"
          :value="progressChoice"
          label="Progress is measured by"
          data-tid="setting-progress"
          @input="setProgress"
        />
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Time left comes from
          </div>
        </div>
        <seg-picker
          :options="etaOptions"
          :value="etaChoice"
          label="Time left comes from"
          data-tid="setting-eta"
          @input="setEta"
        />
      </div>
      <div
        v-if="powerDevicesList.length"
        class="gs__row"
      >
        <div class="gs__grow">
          <div class="gs__t">
            Power switch in the printer chip
          </div>
        </div>
        <div class="gs__ctl gs__ctl--wide">
          <v-select
            v-model="topNavPowerToggle"
            outlined
            dense
            hide-details
            aria-label="Power switch in the printer chip"
            :items="[{ text: 'None', value: null }, ...powerDevicesList]"
          />
        </div>
      </div>
    </div>
    <router-link
      class="gs__xl"
      :to="{ path: settingsPath, hash: '#gcodePreview' }"
      data-tid="setting-link-gcode-preview"
    >
      <v-icon
        small
        class="gs__xl-ic"
      >
        $printer3d
      </v-icon>
      <span class="gs__grow">The <b>3D printer model</b> and the <b>camera on Overview</b> are set in G-code preview and 3D.</span>
      <span class="gs__go">Open ›</span>
    </router-link>

    <h2 class="gs__gt">
      Keyboard
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Shortcuts
          </div>
          <div class="gs__s">
            G then a letter to jump to a page; Ctrl K to search. Hold ? to see them all.
          </div>
        </div>
        <toggle-switch
          :value="enableKeyboardShortcuts"
          label="Shortcuts"
          @input="enableKeyboardShortcuts = $event"
        />
      </div>
    </div>

    <h2 class="gs__gt">
      These settings
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Save a copy
          </div>
          <div class="gs__s">
            All of your Control settings for {{ printerName }}, as one file.
          </div>
        </div>
        <button
          type="button"
          class="cbtn"
          data-tid="settings-save-copy"
          @click="handleBackupSettings"
        >
          Save
        </button>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Restore from a copy
          </div>
          <div class="gs__s">
            Shows what will change before it does.
          </div>
        </div>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          data-tid="settings-restore-copy"
          @click="uploadSettingsFile.click()"
        >
          Choose file…
        </button>
      </div>
    </div>

    <h2 class="gs__gt">
      More
    </h2>
    <div class="gs__list">
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Changes not to list
          </div>
          <div class="gs__s">
            Sections whose saved results Save doesn't show, such as the bed mesh.
          </div>
        </div>
        <div class="gs__ctl gs__ctl--wide">
          <v-combobox
            v-model="sectionsToIgnorePendingConfigurationChanges"
            :items="['bed_mesh default', 'bed_tilt']"
            multiple
            small-chips
            deletable-chips
            outlined
            dense
            hide-details
            append-icon=""
            aria-label="Changes not to list"
          />
        </div>
      </div>
      <div class="gs__row">
        <div class="gs__grow">
          <div class="gs__t">
            Charts page
          </div>
          <div class="gs__s">
            Records how busy each board is, for Charts. Uses a little more of the printer.
          </div>
        </div>
        <toggle-switch
          :value="enableDiagnostics"
          label="Charts page"
          @input="enableDiagnostics = $event"
        />
      </div>
    </div>

    <input
      ref="uploadSettingsFile"
      type="file"
      accept=".json"
      style="display: none"
      data-tid="settings-restore-file"
      @change="handleRestoreSettings"
    >

    <m3-dialog
      :value="!!restore"
      eyebrow="Restore"
      title="Restore these settings?"
      max-width="460"
      data-tid="settings-restore-dialog"
      @input="!$event && cancelRestore()"
      @close="cancelRestore"
    >
      <template v-if="restore">
        <p class="gs__sub">
          {{ restore.fileName }}<template v-if="restore.from">
            · saved from {{ restore.from }}
          </template>
        </p>
        <p
          v-if="restore.from && restore.from !== instanceName"
          class="gs__warn"
          data-tid="settings-restore-other"
        >
          This copy is from {{ restore.from }}, not {{ printerName }}. It can still be restored here.
        </p>
        <div class="gs__list gs__list--sheet">
          <div
            v-for="change in restore.changes"
            :key="change.label"
            class="gs__row"
            data-tid="settings-restore-change"
          >
            <div class="gs__grow">
              <div class="gs__t">
                {{ change.label }}
              </div>
            </div>
            <span class="gs__v">{{ change.value }}</span>
          </div>
          <div class="gs__row">
            <div class="gs__grow">
              <div class="gs__t">
                {{ restore.changes.length ? 'Everything else' : 'Everything' }}
              </div>
            </div>
            <span class="gs__v">Same</span>
          </div>
        </div>
      </template>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          data-tid="settings-restore-cancel"
          @click="cancelRestore"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="restoring"
          data-tid="settings-restore-apply"
          @click="applyRestore"
        >
          Restore
        </button>
      </template>
    </m3-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { VInput } from '@/types'
import { SupportedLocales, DateFormats } from '@/globals'
import type { OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import type { PrintEtaCalculation, PrintProgressCalculation, ThemeConfig, ThemeMode } from '@/store/config/types'
import { httpClientActions } from '@/api/httpClientActions'
import consola from 'consola'
import { printerNameParts } from '@/util/printer-name'
import { cloneDeep, merge } from 'lodash-es'
import { readFileAsTextAsync } from '@/util/file-system-entry'
import { EventBus } from '@/eventBus'
import { isFluiddContent, toFluiddContent } from '@/util/fluidd-content'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { slugify } from '@/services/printer-pages/slug'
import {
  ACCENTS, accentFor, copyFileName, etaChoiceOf, etaStoredFor, modelLine, progressChoiceOf, progressStoredFor,
  restoreChanges, serialFromIdentity, systemPrefersDark, themeModeOf,
  type EtaChoice, type ProgressChoice, type RestoreChange
} from '@/services/settings/general'

interface PendingRestore {
  fileName: string;
  from: string | null;
  data: Record<string, unknown>;
  changes: RestoreChange[];
}

@Component({
  components: { ToggleSwitch, SegPicker, M3Dialog }
})
export default class GeneralSettings extends Mixins(StateMixin) {
  accents = ACCENTS
  serial: string | null = null
  restore: PendingRestore | null = null
  restoring = false

  modeOptions: SegOption[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'auto', label: 'Auto' }
  ]

  timeOptions: SegOption[] = [
    { value: 'hours24', label: '24-hour' },
    { value: 'hours12', label: '12-hour' }
  ]

  progressOptions: SegOption[] = [
    { value: 'file', label: 'File' },
    { value: 'layers', label: 'Layers' },
    { value: 'slicer', label: 'Slicer' }
  ]

  etaOptions: SegOption[] = [
    { value: 'slicer', label: 'Slicer' },
    { value: 'file', label: 'File' },
    { value: 'average', label: 'Average' }
  ]

  @Ref('instanceName')
  readonly instanceNameElement!: VInput

  @Ref('uploadSettingsFile')
  readonly uploadSettingsFile!: HTMLInputElement

  mounted () {
    this.loadSerial()
  }

  async loadSerial () {
    if (!this.$store.getters['server/isMuonPrinter']) return
    try {
      const response = await httpClientActions.serverMuonIdentityGet()
      this.serial = serialFromIdentity(response.data)
    } catch {
      this.serial = null
    }
  }

  get general () {
    return this.$store.state.config.uiSettings.general
  }

  get theme (): ThemeConfig {
    return this.$store.state.config.uiSettings.theme
  }

  savePersonal (path: string, value: unknown) {
    return this.$store.dispatch('config/savePersonal', { path, value })
  }

  saveGeneral (key: string, value: unknown) {
    return this.$store.dispatch('config/saveByPath', { path: `uiSettings.general.${key}`, value, server: true })
  }

  get instanceName (): string {
    return this.general.instanceName
  }

  /** The printer as the top bar names it. */
  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string ?? '').name || 'this printer'
  }

  setInstanceName (value: string) {
    if (this.instanceNameElement.valid) this.$store.dispatch('config/updateInstance', value)
  }

  get model (): string {
    return modelLine(this.$store.getters['server/isMuonPrinter'] as boolean | null, this.serial)
  }

  get settingsPath (): string {
    return scopedPath('/settings', activeSlug())
  }

  get accentOn (): string | null {
    return accentFor(this.theme.color)?.color ?? null
  }

  setAccent (color: string) {
    this.savePersonal('theme.color', color)
  }

  get mode (): ThemeMode {
    return themeModeOf(this.theme)
  }

  async setMode (mode: ThemeMode) {
    await this.savePersonal('theme.mode', mode)
    await this.savePersonal('theme.isDark', mode === 'auto' ? systemPrefersDark() : mode === 'dark')
  }

  get locale () {
    return this.general.locale
  }

  get supportedLocales () {
    return [
      { name: 'Same as this device', code: 'default' },
      ...SupportedLocales
    ]
  }

  setLocale (value: string) {
    this.$store.dispatch('config/onLocaleChange', value)
  }

  get dateFormat () {
    return this.general.dateFormat
  }

  set dateFormat (value: string) {
    this.saveGeneral('dateFormat', value)
  }

  get availableDateFormats () {
    const date = new Date()

    return Object.entries(DateFormats)
      .map(([key, entry]) => ({
        value: key,
        text: `${date.toLocaleDateString(entry.locales ?? this.$filters.getAllLocales(), entry.options)}${entry.suffix ?? ''}`
      }))
  }

  get timeFormat (): string {
    return this.general.timeFormat
  }

  set timeFormat (value: string) {
    this.saveGeneral('timeFormat', value)
  }

  /** ISO times are 24-hour too: it stays ISO until someone picks. */
  get timeChoice (): string {
    return this.timeFormat === 'hours12' ? 'hours12' : 'hours24'
  }

  get enableKeyboardShortcuts (): boolean {
    return this.general.enableKeyboardShortcuts
  }

  set enableKeyboardShortcuts (value: boolean) {
    this.saveGeneral('enableKeyboardShortcuts', value)
  }

  get confirmOnEstop (): boolean {
    return !!this.general.confirmOnEstop
  }

  async setConfirmOnEstop (value: boolean) {
    if (value) {
      const sure = await this.$confirm(
        `Every emergency stop you start on ${this.printerName} will ask first, so it takes a second press. Anyone else here keeps their own setting.`,
        { title: 'E-STOP will need two presses', buttonTrueText: 'Ask first', buttonFalseText: 'Keep one press' }
      )
      if (!sure) return
    }
    this.savePersonal('general.confirmOnEstop', value)
  }

  get confirmOnSaveConfigAndRestart (): boolean {
    return !!this.general.confirmOnSaveConfigAndRestart
  }

  get confirmOnPowerDeviceChange (): boolean {
    return !!this.general.confirmOnPowerDeviceChange
  }

  get showUploadAndPrint (): boolean {
    return !!this.general.showUploadAndPrint
  }

  get hasPowerDevices (): boolean {
    return ((this.$store.getters['power/getDevices'] as Device[] | undefined) ?? []).length > 0
  }

  get progressChoice (): ProgressChoice | null {
    return progressChoiceOf(this.general.printProgressCalculation as PrintProgressCalculation[])
  }

  setProgress (choice: ProgressChoice) {
    this.saveGeneral('printProgressCalculation', progressStoredFor(choice))
  }

  get etaChoice (): EtaChoice | null {
    return etaChoiceOf(this.general.printEtaCalculation as PrintEtaCalculation[])
  }

  setEta (choice: EtaChoice) {
    this.saveGeneral('printEtaCalculation', etaStoredFor(choice))
  }

  get topNavPowerToggle () {
    return this.general.topNavPowerToggle
  }

  set topNavPowerToggle (value: string | null) {
    this.saveGeneral('topNavPowerToggle', value)
  }

  get powerDevicesList () {
    const devices = (this.$store.getters['power/getDevices'] as Device[] | undefined) ?? []
    const deviceEntries = devices.length
      ? [
          { header: 'Moonraker' },
          ...devices.map(device => ({ text: device.device, value: device.device }))
        ]
      : []

    const pins = (this.$store.getters['printer/getPins'] as OutputPin[] | undefined) ?? []
    const pinEntries = pins.length
      ? [
          { header: 'Klipper' },
          ...pins.map(outputPin => ({ text: outputPin.prettyName, value: `${outputPin.name}:klipper` }))
        ]
      : []

    return [
      ...deviceEntries,
      ...pinEntries
    ]
  }

  get sectionsToIgnorePendingConfigurationChanges (): string[] {
    return this.general.sectionsToIgnorePendingConfigurationChanges as string[]
  }

  set sectionsToIgnorePendingConfigurationChanges (value: string[]) {
    this.saveGeneral('sectionsToIgnorePendingConfigurationChanges', [...new Set(value)].sort((a, b) => a.localeCompare(b)))
  }

  get enableDiagnostics (): boolean {
    return this.general.enableDiagnostics
  }

  set enableDiagnostics (value: boolean) {
    this.saveGeneral('enableDiagnostics', value)
  }

  async currentSettings (): Promise<Record<string, unknown> | null> {
    const response = await httpClientActions.serverDatabaseItemGet('fluidd')
    const value = response.data?.result?.value
    return value && typeof value === 'object' ? value as Record<string, unknown> : null
  }

  /** What is in effect now: the saved settings over the defaults this page shows. */
  async diffBase (): Promise<Record<string, unknown>> {
    const saved = await this.currentSettings() ?? {}
    return { ...saved, uiSettings: merge(cloneDeep(this.$store.state.config.uiSettings), (saved.uiSettings as object | undefined) ?? {}) }
  }

  async handleBackupSettings () {
    try {
      const data = await this.currentSettings()

      if (data) {
        const backupDataAsString = JSON.stringify(toFluiddContent('settings-backup', data))
        const link = document.createElement('a')

        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(backupDataAsString)}`
        link.download = copyFileName(slugify(this.printerName))
        link.target = '_blank'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (e) {
      consola.error('[Settings] backup failed', e)

      EventBus.$emit(this.$t('app.general.msg.fluidd_settings_backup_failed').toString(), { type: 'error' })
    }
  }

  async handleRestoreSettings () {
    try {
      const file = this.uploadSettingsFile?.files?.length === 1 ? this.uploadSettingsFile.files[0] : null
      if (!file) return

      const backupDataAsString = await readFileAsTextAsync(file)
      if (!backupDataAsString) return

      const backupData = JSON.parse(backupDataAsString)

      if (!isFluiddContent<Record<string, unknown>>('settings-backup', backupData) || !backupData.data || typeof backupData.data !== 'object') {
        EventBus.$emit(this.$t('app.general.msg.not_valid_fluidd_backup_file').toString(), { type: 'error' })
        return
      }

      const data = backupData.data
      const ui = data.uiSettings as { general?: { instanceName?: unknown } } | undefined
      const from = typeof ui?.general?.instanceName === 'string' ? ui.general.instanceName : null

      this.restore = {
        fileName: file.name,
        from,
        data,
        changes: restoreChanges(await this.diffBase(), data)
      }
    } catch (e) {
      consola.error('[Settings] restore failed', e)

      EventBus.$emit(this.$t('app.general.msg.fluidd_settings_restore_failed').toString(), { type: 'error' })
    } finally {
      this.uploadSettingsFile.value = ''
    }
  }

  cancelRestore () {
    if (!this.restoring) this.restore = null
  }

  async applyRestore () {
    if (!this.restore) return
    this.restoring = true
    try {
      for (const key in this.restore.data) {
        await httpClientActions.serverDatabaseItemPost('fluidd', key, this.restore.data[key])
      }

      window.location.reload()
    } catch (e) {
      consola.error('[Settings] restore failed', e)
      this.restoring = false

      EventBus.$emit(this.$t('app.general.msg.fluidd_settings_restore_failed').toString(), { type: 'error' })
    }
  }
}
</script>

<style lang="scss" scoped>
  .gs {
    display: flex;
    flex-direction: column;
    color: var(--m3d-text);
  }

  .gs__gt {
    margin: 22px 16px 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;

    &:first-child {
      margin-top: 0;
    }
  }

  .gs__list {
    display: flex;
    flex-direction: column;
    padding: 0 18px;
    border-radius: 20px;
    background: var(--m3d-surface);
  }

  .gs__list--sheet {
    margin-top: 10px;
    background: var(--m3d-surface-2);
  }

  .gs__row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 56px;
    padding: 10px 0;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .gs__grow {
    flex: 1 1 auto;
    min-width: 0;
  }

  .gs__t {
    font-size: 15px;
    font-weight: 600;
  }

  .gs__s {
    margin-top: 2px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .gs__v {
    flex: none;
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: right;
  }

  .gs__ctl {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }

  .gs__ctl--wide {
    flex: 0 1 300px;
    width: 300px;
  }

  .gs__swatches {
    display: inline-flex;
    flex: none;
    gap: 10px;
  }

  .gs__swatch {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);

    &:focus-visible {
      outline: 2px solid var(--m3d-text);
      outline-offset: 2px;
    }
  }

  .gs__swatch--on {
    box-shadow: 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-text);
  }

  .gs__gh {
    margin: 8px 16px 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .gs__xl {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 14px 18px;
    border-radius: 20px;
    background: var(--m3d-surface);
    color: var(--m3d-text) !important;
    font-size: 14px;
    text-decoration: none;
  }

  .gs__xl-ic {
    color: var(--m3d-text-muted) !important;
  }

  .gs__go {
    flex: none;
    color: var(--v-primary-base);
    font-weight: 600;
  }

  .gs__sub {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .gs__warn {
    margin: 8px 0 0;
    color: var(--m3d-warning);
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .gs__row {
      flex-wrap: wrap;
    }

    .gs__ctl--wide {
      flex: 1 1 100%;
      width: auto;
    }
  }
</style>
