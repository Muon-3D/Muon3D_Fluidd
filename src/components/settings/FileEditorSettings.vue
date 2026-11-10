<template>
  <section
    id="editor"
    class="m3-set fes"
    data-tid="editor-settings"
  >
    <h2 class="m3-set__title">
      The editor
    </h2>
    <p class="m3-set__intro">
      How config files open, save and restart.
    </p>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Save and restart</b>
        <span data-tid="editor-save-restart-line">{{ saveAndRestartLine }}</span>
      </div>
      <div class="m3-set__control">
        <seg-picker
          :options="saveAndRestartOptions"
          :value="saveAndRestart"
          label="Save and restart"
          data-tid="editor-save-restart"
          @input="saveAndRestart = $event"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Save and restart in the top bar</b>
        <span>A button that appears when a calibration has results to keep.</span>
      </div>
      <div class="m3-set__control">
        <toggle-switch
          :value="showSaveConfigAndRestart"
          label="Save and restart in the top bar"
          data-tid="editor-top-bar-save"
          @input="showSaveConfigAndRestart = $event"
        />
      </div>
    </div>

    <div class="m3-set__row fes__size">
      <div class="m3-set__label">
        <b>Text size</b>
        <span
          class="fes__preview"
          :style="{ fontSize: `${textSizePx}px` }"
          data-tid="editor-text-size-preview"
        >[extruder] max_temp: 265</span>
      </div>
      <div class="m3-set__control">
        <seg-picker
          :options="textSizeOptions"
          :value="textSize"
          label="Text size"
          data-tid="editor-text-size"
          @input="textSize = $event"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>{{ $t('app.setting.label.confirm_dirty_editor_close') }}</b>
      </div>
      <div class="m3-set__control">
        <toggle-switch
          :value="confirmDirtyEditorClose"
          :label="$t('app.setting.label.confirm_dirty_editor_close')"
          @input="confirmDirtyEditorClose = $event"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>{{ $t('app.setting.label.auto_edit_extensions') }}</b>
      </div>
      <div class="m3-set__control m3-set__control--wide">
        <v-combobox
          v-model="autoEditExtensions"
          outlined
          dense
          hide-selected
          hide-details="auto"
          multiple
          small-chips
          append-icon=""
          deletable-chips
          :aria-label="$t('app.setting.label.auto_edit_extensions')"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>{{ $t('app.setting.label.save_and_restore_view_state') }}</b>
      </div>
      <div class="m3-set__control m3-set__control--wide">
        <v-select
          v-model="restoreViewState"
          outlined
          dense
          hide-details="auto"
          :items="availableRestoreViewState"
          :aria-label="$t('app.setting.label.save_and_restore_view_state')"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>{{ $t('app.setting.label.show_code_lens') }}</b>
      </div>
      <div class="m3-set__control">
        <toggle-switch
          :value="codeLens"
          :label="$t('app.setting.label.show_code_lens')"
          @input="codeLens = $event"
        />
      </div>
    </div>

    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>{{ $t('app.setting.label.reset') }}</b>
      </div>
      <div class="m3-set__control">
        <button
          type="button"
          class="cbtn cbtn--sm"
          data-tid="editor-reset"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { defaultState } from '@/store/config/state'
import type { RestoreViewState } from '@/store/config/types'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import {
  SAVE_AND_RESTART_OPTIONS, TEXT_SIZE_OPTIONS, editorFontPx, editorTextSize, saveAndRestartLine, saveAndRestartMode,
  type EditorTextSize, type SaveAndRestart
} from '@/services/settings/editor'

/**
 * Settings › Files and editor, the editor's rows: what Save and restart does
 * (Ask / Always / Never), the top bar's Save and restart (moved here from
 * General, same saved value), the text size, and Fluidd's own editor rows.
 */
@Component({ components: { ToggleSwitch, SegPicker } })
export default class FileEditorSettings extends Mixins(StateMixin) {
  saveAndRestartOptions = SAVE_AND_RESTART_OPTIONS
  textSizeOptions = TEXT_SIZE_OPTIONS

  save (path: string, value: unknown) {
    this.$store.dispatch('config/saveByPath', { path, value, server: true })
  }

  get saveAndRestart (): SaveAndRestart {
    return saveAndRestartMode(this.$store.state.config.uiSettings.editor.saveAndRestart)
  }

  set saveAndRestart (value: SaveAndRestart) {
    this.save('uiSettings.editor.saveAndRestart', saveAndRestartMode(value))
  }

  get saveAndRestartLine (): string {
    return saveAndRestartLine(this.saveAndRestart)
  }

  get showSaveConfigAndRestart (): boolean {
    return !!this.$store.state.config.uiSettings.general.showSaveConfigAndRestart
  }

  set showSaveConfigAndRestart (value: boolean) {
    this.save('uiSettings.general.showSaveConfigAndRestart', value)
  }

  get textSize (): EditorTextSize {
    return editorTextSize(this.$store.state.config.uiSettings.editor.textSize)
  }

  set textSize (value: EditorTextSize) {
    this.save('uiSettings.editor.textSize', editorTextSize(value))
  }

  get textSizePx (): number {
    return editorFontPx(this.textSize)
  }

  get confirmDirtyEditorClose (): boolean {
    return this.$store.state.config.uiSettings.editor.confirmDirtyEditorClose
  }

  set confirmDirtyEditorClose (value: boolean) {
    this.save('uiSettings.editor.confirmDirtyEditorClose', value)
  }

  get autoEditExtensions (): string[] {
    return this.$store.state.config.uiSettings.editor.autoEditExtensions
  }

  set autoEditExtensions (value: string[]) {
    this.save('uiSettings.editor.autoEditExtensions', [
      ...new Set(value.map(ext => ext.startsWith('.') ? ext : `.${ext}`))
    ].sort((a, b) => a.localeCompare(b)))
  }

  get restoreViewState (): RestoreViewState {
    return this.$store.state.config.uiSettings.editor.restoreViewState
  }

  set restoreViewState (value: RestoreViewState) {
    this.save('uiSettings.editor.restoreViewState', value)
  }

  get availableRestoreViewState (): { value: RestoreViewState, text: string }[] {
    return [
      { value: 'never', text: this.$tc('app.setting.label.never') },
      { value: 'session', text: this.$tc('app.setting.label.to_browser_session_storage') },
      { value: 'local', text: this.$tc('app.setting.label.to_browser_local_storage') }
    ]
  }

  get codeLens (): boolean {
    return this.$store.state.config.uiSettings.editor.codeLens
  }

  set codeLens (value: boolean) {
    this.save('uiSettings.editor.codeLens', value)
  }

  handleReset () {
    this.save('uiSettings.editor', defaultState().uiSettings.editor)
  }
}
</script>

<style lang="scss" scoped>
  .fes {
    margin-bottom: 16px;
  }

  .m3-set__label .fes__preview {
    margin-top: 4px;
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    line-height: 1.4;
  }
</style>
