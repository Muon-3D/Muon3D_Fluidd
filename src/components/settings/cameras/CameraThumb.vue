<template>
  <div
    class="cthumb"
    :class="{ 'cthumb--off': off }"
    data-tid="camera-thumb"
  >
    <img
      v-if="src && !failed && !off"
      :src="src"
      :style="{ transform }"
      alt=""
      @load="loaded = true"
      @error="failed = true"
    >
    <span
      v-if="off"
      class="cthumb__note"
    >Off</span>
    <span
      v-else-if="failed"
      class="cthumb__note cthumb__note--none"
      data-tid="camera-thumb-none"
    >
      <frame-icon name="camera" />
      No picture
    </span>
    <span
      v-if="loaded && !failed && !off"
      class="cthumb__live"
    ><i /> Live</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { WebcamConfig } from '@/store/webcams/types'

/** How often a thumbnail asks for a new picture. */
const REFRESH_MS = 5000

/**
 * A camera's thumbnail: its snapshot address, drawn with the camera's own
 * rotation and flips, refreshed now and then. An address that doesn't answer
 * shows "No picture" instead of a broken image.
 */
@Component({})
export default class CameraThumb extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: WebcamConfig

  @Prop({ type: Boolean })
  readonly off?: boolean

  tick = 0
  failed = false
  loaded = false
  timer: number | undefined

  get src (): string {
    const address = this.camera.snapshot_url
    if (!address) return ''
    try {
      const url = new URL(address, document.URL)
      url.searchParams.set('cacheBust', String(this.tick))
      return url.toString()
    } catch {
      return ''
    }
  }

  get transform (): string {
    const parts: string[] = []
    if (this.camera.flip_horizontal) parts.push('scaleX(-1)')
    if (this.camera.flip_vertical) parts.push('scaleY(-1)')
    if (this.camera.rotation) parts.push(`rotate(${this.camera.rotation}deg)`)
    return parts.join(' ') || 'none'
  }

  @Watch('camera.snapshot_url')
  onAddress () {
    this.failed = false
    this.loaded = false
  }

  mounted () {
    this.tick = Date.now()
    this.timer = window.setInterval(() => {
      if (document.hidden || this.off) return
      this.tick = Date.now()
    }, REFRESH_MS)
  }

  beforeDestroy () {
    window.clearInterval(this.timer)
  }
}
</script>

<style lang="scss" scoped>
  .cthumb {
    position: relative;
    flex: none;
    width: 132px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 10px;
    background: #16171a;
    box-shadow: inset 0 0 0 1px var(--m3d-border);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .cthumb--off img {
    filter: grayscale(1) brightness(0.45);
  }

  .cthumb__note {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .cthumb__note--none {
    align-content: center;
    justify-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 600;
  }

  .cthumb__live {
    position: absolute;
    top: 6px;
    left: 6px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--m3d-success) 24%, rgb(0 0 0 / 40%));
    color: var(--m3d-success);
    font-size: 10px;
    font-weight: 700;

    i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentcolor;
    }
  }

  @media (max-width: 700px) {
    .cthumb {
      width: 96px;
    }
  }
</style>
