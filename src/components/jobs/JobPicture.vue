<template>
  <img
    v-if="shown"
    :src="shown"
    alt=""
    loading="lazy"
    data-tid="job-picture"
    data-state="image"
    @error="failed = src"
  >
  <frame-icon
    v-else
    name="jobs"
    :large="large"
    :small="!large"
    class="job-picture__placeholder"
    data-tid="job-picture"
    data-state="placeholder"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { cancelQueuedThumbnail } from '@/services/jobs/thumbnail'

/**
 * A job's picture. A file with no thumbnail, or one whose thumbnail can't be
 * loaded, shows the plain job icon rather than an empty box or a broken image.
 */
@Component
export default class JobPicture extends Vue {
  @Prop({ type: String, default: '' })
  readonly src!: string

  /** Names a picture read over the remote route: dropped from the queue if this goes before its turn. */
  @Prop({ type: String, default: '' })
  readonly thumbKey!: string

  @Prop({ type: Boolean })
  readonly large!: boolean

  /** The address that failed to load, so a new one is tried afresh. */
  failed = ''

  get shown (): string {
    return this.src && this.src !== this.failed ? this.src : ''
  }

  beforeDestroy () {
    if (this.thumbKey && !this.src) cancelQueuedThumbnail(this.thumbKey)
  }
}
</script>
