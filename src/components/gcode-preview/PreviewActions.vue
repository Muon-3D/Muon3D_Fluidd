<template>
  <div
    class="prev-actions"
    data-tid="preview-actions"
  >
    <preview-open-menu
      v-if="!isMobileViewport"
      @pick="open"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="cbtn"
          data-tid="preview-open-another"
          :disabled="!socketConnected"
          v-bind="attrs"
          v-on="on"
        >
          {{ previewFile ? 'Open another' : 'Open a file' }}
        </button>
      </template>
    </preview-open-menu>
    <button
      v-if="previewFile"
      type="button"
      class="cbtn cbtn--primary"
      data-tid="preview-print"
      :disabled="!!printBlocked"
      :title="printBlocked || undefined"
      @click="print"
    >
      Print this
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobsMixin from '@/mixins/jobs'
import BrowserMixin from '@/mixins/browser'
import type { AppFile } from '@/store/files/types'
import { previewPage } from '@/services/gcode-preview/page-state'
import PreviewOpenMenu from './PreviewOpenMenu.vue'

/** The G-code preview's header: Open another, and the one primary action, Print this. */
@Component({ components: { PreviewOpenMenu } })
export default class PreviewActions extends Mixins(JobsMixin, BrowserMixin) {
  get previewFile (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile'] as AppFile | undefined
  }

  get printPath (): string {
    const f = this.previewFile
    return f ? [f.path, f.filename].filter(Boolean).join('/') : ''
  }

  /** Why Print this can't start now, or '' when it can. */
  get printBlocked (): string {
    if (!this.socketConnected) return `${this.printerName} is offline`
    if (this.busy) return `${this.printerName} is already printing`
    if (!this.controlReady) return `${this.printerName} isn't ready`
    return ''
  }

  open (file: AppFile) {
    previewPage.requested = file
  }

  print () {
    if (this.printPath) this.printAgain(this.printPath)
  }
}
</script>

<style lang="scss" scoped>
  .prev-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
