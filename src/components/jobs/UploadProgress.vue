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
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { FilesUpload } from '@/store/files/types'

@Component
export default class UploadProgress extends Vue {
  get uploads (): FilesUpload[] {
    return this.$store.state.files.uploads.filter((file: FilesUpload) => !file.cancelled)
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
progress { display: block; width: 100%; margin: 8px 0; accent-color: var(--m3d-accent); }
</style>
