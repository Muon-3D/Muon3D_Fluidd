<template>
  <section
    v-if="uploads.length"
    class="upload-progress"
    aria-label="Uploads"
    data-tid="upload-progress"
  >
    <div
      v-for="file in uploads"
      :key="file.filepath"
      class="upload-progress__file"
    >
      <strong>{{ file.filepath }}</strong>
      <progress
        :value="file.percent"
        max="100"
        :aria-label="`Uploading ${file.filepath}`"
      />
      <div role="status">
        {{ file.percent }}% · {{ $filters.getReadableFileSizeString(file.loaded) }} / {{ $filters.getReadableFileSizeString(file.size) }}
        <span v-if="file.percent === 100"> · Verifying and saving…</span>
        <span
          v-else-if="remaining(file)"
          data-tid="upload-eta"
        > · {{ remaining(file) }}</span>
      </div>
      <button
        v-if="file.percent < 100"
        type="button"
        class="upload-progress__cancel"
        data-tid="upload-cancel"
        :aria-label="`Cancel uploading ${file.filepath}`"
        @click="cancel(file)"
      >
        Cancel
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { FilesUpload } from '@/store/files/types'

@Component
export default class UploadProgress extends Vue {
  // When each file's bytes first started moving (not reactive on purpose).
  private started: Record<string, { at: number, loaded: number }> = {}

  get uploads (): FilesUpload[] {
    return this.$store.state.files.uploads.filter((file: FilesUpload) => !file.cancelled)
  }

  /** "about 3 min left", from the bytes moved so far; nothing until it is a fair guess. */
  remaining (file: FilesUpload): string {
    if (!file.loaded) return ''
    const start = this.started[file.filepath] ??= { at: Date.now(), loaded: file.loaded }
    const elapsed = (Date.now() - start.at) / 1000
    const moved = file.loaded - start.loaded
    if (elapsed < 5 || moved <= 0) return ''
    const seconds = Math.ceil((file.size - file.loaded) / (moved / elapsed))
    if (seconds < 20) return ''
    return seconds < 90 ? `about ${seconds} s left` : `about ${Math.ceil(seconds / 60)} min left`
  }

  cancel (file: FilesUpload) {
    this.$store.dispatch('files/updateFileUpload', { filepath: file.filepath, cancelled: true })
    file.abortController?.abort()
  }
}
</script>

<style lang="scss" scoped>
.upload-progress {
  position: fixed;
  z-index: 1000;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
  width: min(400px, calc(100vw - 32px));
  padding: 16px;
  border: 1px solid var(--m3d-border-strong);
  border-radius: 12px;
  background: var(--m3d-surface, #202329);
  box-shadow: var(--m3d-shadow-float);
  overflow-wrap: anywhere;
}
.upload-progress__file + .upload-progress__file { margin-top: 12px; }
.upload-progress__cancel { margin-top: 4px; padding: 4px 12px; border: 1px solid var(--m3d-border-strong); border-radius: 8px; color: inherit; }
progress { display: block; width: 100%; margin: 8px 0; accent-color: var(--m3d-accent); }
</style>
