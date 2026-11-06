<template>
  <v-dialog
    v-model="open"
    :loading="loading"
    hide-overlay
    fullscreen
    persistent
    transition="dialog-bottom-transition"
    content-class="config-editor-overlay"
  >
    <v-card
      d-flex
      class="fill-height"
      style="overflow: hidden;"
    >
      <v-toolbar
        dense
        :elevation="6"
        style="z-index: 1"
      >
        <app-btn
          icon
          :disabled="!ready"
          color=""
          aria-label="Close the file"
          data-tid="files-close"
          @click="emitClose()"
        >
          <v-icon>$close</v-icon>
        </app-btn>
        <v-toolbar-title data-tid="files-editor-title">
          {{ filename }}
          <v-icon
            v-if="readonly"
            small
            class="ml-1"
          >
            $lock
          </v-icon>
          <v-icon
            v-else-if="updatedContent !== lastSavedContent"
            small
            class="ml-1"
          >
            $circle
          </v-icon>
          <span
            v-if="!$vuetify.breakpoint.smAndDown"
            class="text--secondary ml-3 text-body-2"
          >{{ path.split('/').join(' / ') }}</span>
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <app-btn
            v-if="!$vuetify.breakpoint.smAndDown"
            @click="peripheralsDialogOpen = true"
          >
            <v-icon
              small
              left
            >
              $devices
            </v-icon>
            <span>{{ $t('app.file_system.title.devices') }}</span>
          </app-btn>
          <app-btn
            v-if="!useTextOnlyEditor"
            @click="handleCommandPalette"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $consoleLine
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.file_system.title.command_palette') }}</span>
          </app-btn>
          <app-btn
            v-if="!printerPrinting && configMap.link"
            :href="configMap.link"
            target="_blank"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $help
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.config_reference') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly && !printerPrinting && configMap.serviceSupported"
            :disabled="!ready"
            :aria-label="$t('app.general.btn.save_restart')"
            @click="emitSave(true)"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $restart
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save_restart') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly"
            :disabled="!ready"
            :aria-label="$t('app.general.btn.save')"
            @click="emitSave(false)"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $save
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save') }}</span>
          </app-btn>
        </v-toolbar-items>
      </v-toolbar>

      <file-editor
        v-if="contents !== undefined && !useTextOnlyEditor"
        ref="editor"
        v-model="updatedContent"
        :path="path"
        :filename="filename"
        :readonly="readonly"
        :code-lens="codeLens"
        :line="line"
        @ready="editorReady = true"
        @save="emitSave(false)"
        @emergency-stop="emergencyStop"
      />

      <file-editor-text-only
        v-if="contents !== undefined && useTextOnlyEditor"
        v-model="updatedContent"
        :filename="filename"
        :readonly="readonly"
        @ready="editorReady = true"
      />

      <peripherals-dialog
        v-if="peripheralsDialogOpen"
        v-model="peripheralsDialogOpen"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, VModel, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import FileEditor from './FileEditor.vue'
import FileEditorTextOnly from './FileEditorTextOnly.vue'
import isWebAssemblySupported from '@/util/is-web-assembly-supported'

@Component({
  components: {
    FileEditor,
    FileEditorTextOnly
  }
})
export default class FileEditorDialog extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: String, required: true })
  readonly path!: string

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: String, required: true })
  readonly contents!: string

  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  /** A line to open at, 1-based. */
  @Prop({ type: Number, default: 0 })
  readonly line!: number

  @Ref('editor')
  readonly editor?: FileEditor

  updatedContent: string | null = null
  lastSavedContent: string | null = null
  editorReady = false
  peripheralsDialogOpen = false

  get ready () {
    return (
      !this.loading &&
      this.editorReady &&
      !this.isUploading
    )
  }

  @Watch('ready')
  onReady (value: boolean) {
    if (value) {
      this.editor?.focus()
    }
  }

  get isWebAssemblySupported () {
    return isWebAssemblySupported()
  }

  get useTextOnlyEditor () {
    return this.isMobileUserAgent || !this.isWebAssemblySupported
  }

  get isUploading (): boolean {
    return this.$store.state.files.uploads.length > 0
  }

  get configMap () {
    return this.$store.getters['server/getConfigMapByFilename'](this.filename)
  }

  get codeLens () {
    return this.$store.state.config.uiSettings.editor.codeLens
  }

  created () {
    this.updatedContent = this.contents
    this.lastSavedContent = this.contents
  }

  mounted () {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  beforeDestroy () {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  get showDirtyEditorWarning () {
    return this.$store.state.config.uiSettings.editor.confirmDirtyEditorClose && this.updatedContent !== this.lastSavedContent
  }

  async emitClose () {
    const result = (
      !this.showDirtyEditorWarning ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.unsaved_changes'),
        { title: this.$tc('app.general.label.unsaved_changes'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      this.open = false
    }
  }

  handleBeforeUnload (event: Event) {
    if (this.showDirtyEditorWarning) {
      event.preventDefault() // show browser-native "Leave site?" modal
      return ((event || window.event).returnValue = true) // fallback
    }
  }

  emitSave (restart: boolean) {
    if (this.editorReady) {
      if (this.configMap.serviceSupported && restart) {
        this.$emit('save', this.updatedContent, this.configMap.service)
        this.open = false
      } else {
        this.$emit('save', this.updatedContent)
      }

      this.lastSavedContent = this.updatedContent
    }
  }

  handleCommandPalette () {
    this.editor?.showCommandPalette()
  }
}
</script>
