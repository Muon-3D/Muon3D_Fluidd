<template>
  <v-sheet
    :elevation="0"
    class="camera-container"
    v-on="$listeners"
  >
    <div
      v-if="outOfReach"
      class="camera-remote"
      role="status"
      data-tid="camera-remote"
    >
      <b>{{ camera.name || 'The camera' }} shows on the printer's network</b>
      <span>Muon3D doesn't carry camera pictures yet. Open this printer on the same network to watch it.</span>
    </div>
    <template v-else-if="cameraComponent">
      <component
        :is="cameraComponent"
        ref="component-instance"
        :camera="camera"
        :crossorigin="crossorigin"
        class="camera-image"
        @raw-camera-url="rawCameraUrl = $event"
        @frames-per-second="framesPerSecond = $event"
        @playback="setupFrameEvents()"
      />
    </template>
    <div v-else>
      Camera service not supported!
    </div>

    <div
      v-if="camera.name"
      class="camera-name"
    >
      {{ camera.name }}
    </div>
    <div
      v-if="framesPerSecond"
      class="camera-frames"
    >
      fps: {{ framesPerSecond }}
    </div>

    <div
      v-if="!fullscreen && (fullscreenMode === 'embed' || !rawCameraUrl) && camera.service !== 'device'"
      class="camera-fullscreen"
    >
      <router-link :to="fullscreenPath">
        <v-icon>$fullScreen</v-icon>
      </router-link>
    </div>
    <div
      v-else-if="rawCameraUrl"
      class="camera-fullscreen"
    >
      <a
        :href="rawCameraUrl"
        target="_blank"
      >
        <v-icon>$openInNew</v-icon>
      </a>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import type { WebcamConfig } from '@/store/webcams/types'
import type { CameraFullscreenAction } from '@/store/config/types'
import { CameraComponents } from '@/dynamicImports'
import CameraMixin from '@/mixins/camera'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { cameraOutOfReach } from '@/services/camera/route'

@Component({})
export default class CameraItem extends Vue {
  /** This camera's own page, on the printer Fluidd is on. */
  get fullscreenPath (): string {
    return scopedPath(`/camera/${encodeURI(this.camera.uid)}`, activeSlug())
  }

  @Prop({ type: Object, required: true })
  readonly camera!: WebcamConfig

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Prop({ type: String })
  readonly crossorigin?: 'anonymous' | 'use-credentials' | ''

  @Ref('component-instance')
  readonly componentInstance!: CameraMixin

  rawCameraUrl: string | null = null
  framesPerSecond : string | null = null

  mounted () {
    this.setupFrameEvents()
  }

  setupFrameEvents () {
    if (this.$listeners?.frame && this.componentInstance) {
      if (this.componentInstance.streamingElement instanceof HTMLImageElement) {
        this.componentInstance.streamingElement.addEventListener('load', () => this.handleFrame())
      } else if (this.componentInstance.streamingElement instanceof HTMLVideoElement) {
        this.handleFrame(true)
      }
    }
  }

  handleFrame (animate = false) {
    const element = this.componentInstance?.streamingElement as HTMLImageElement | HTMLVideoElement
    if (element) {
      this.$emit('frame', element)
    }

    if (animate) {
      requestAnimationFrame(() => this.handleFrame(this.componentInstance.animating))
    }
  }

  @Watch('camera')
  onCamera () {
    this.rawCameraUrl = ''
    this.framesPerSecond = ''
  }

  /** Through Muon3D, a camera whose picture the gateway doesn't carry. */
  get outOfReach (): boolean {
    return cameraOutOfReach(this.camera, printerTransportBinding.remote, window.location.protocol)
  }

  get fullscreenMode (): CameraFullscreenAction {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction
  }

  get cameraComponent () {
    if (this.camera.service) {
      const componentName = `${this.$filters.startCase(this.camera.service).replace(/ /g, '')}Camera`

      if (componentName in CameraComponents) {
        return CameraComponents[componentName]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .camera-image {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 130px);
    max-height: calc(100svh - 130px);
    white-space: nowrap;
    margin: auto;
    pointer-events: none;
  }

  .camera-remote {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 180px;
    padding: 24px;
    text-align: center;
  }

  .camera-remote span {
    opacity: 0.7;
  }

  .camera-container {
    position: relative;
    background: rgba(0, 0, 0, 1);
  }

  .camera-name,
  .camera-frames {
    position: absolute;
    bottom: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    font-weight: 100;
  }

  .theme--light .camera-name,
  .theme--light .camera-frames {
    background: rgba(255, 255, 255, 0.75);
  }

  .camera-fullscreen {
    position: absolute;
    text-align: right;
    top: 0;
    right: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    border-bottom-left-radius: 4px;
  }

  .theme--light .camera-fullscreen {
    background: rgba(255, 255, 255, 0.75);
  }

  .camera-name {
    left: 0;
    border-top-right-radius: 4px;
  }

  .camera-frames {
    text-align: right;
    right: 0;
    border-top-left-radius: 4px;
  }
</style>
