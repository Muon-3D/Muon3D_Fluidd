<template>
  <div
    class="cprev"
    data-tid="camera-preview"
  >
    <component
      :is="viewer"
      v-if="viewer"
      :key="viewerKey"
      :camera="camera"
      class="cprev__view"
    />
    <p
      v-else
      class="cprev__none"
    >
      This stream type can't be previewed here.
    </p>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { NewWebcamConfig } from '@/store/webcams/types'
import { CameraComponents } from '@/dynamicImports'

/**
 * The camera's own viewer, as the Camera page uses it, in a 16:9 frame. The
 * viewer applies rotation and flips from the camera it is given, so they
 * show as they change; a new address or stream type starts it over.
 */
@Component({})
export default class CameraPreview extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: NewWebcamConfig

  get viewer () {
    if (!this.camera.service) return undefined
    const name = `${this.$filters.startCase(this.camera.service).replace(/ /g, '')}Camera`
    return name in CameraComponents ? CameraComponents[name] : undefined
  }

  get viewerKey (): string {
    return [this.camera.service, this.camera.stream_url, this.camera.snapshot_url].join('|')
  }
}
</script>

<style lang="scss" scoped>
  .cprev {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 22px;
    background: #0b0b0c;
    box-shadow: inset 0 0 0 1px var(--m3d-border);
  }

  .cprev__view {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border: 0;
  }

  .cprev__none {
    display: grid;
    height: 100%;
    margin: 0;
    place-items: center;
    color: var(--m3d-text-muted);
  }
</style>
