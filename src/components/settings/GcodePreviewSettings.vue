<template>
  <div>
    <v-subheader id="gcodePreview">
      The 3D printer
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
      data-tid="model-settings"
    >
      <app-setting
        title="Show the 3D printer"
        sub-title="Off: Overview shows the camera, or a picture of the printer when there's no camera."
      >
        <v-switch
          :input-value="model.show"
          hide-details
          class="mb-5"
          aria-label="Show the 3D printer"
          data-tid="show-printer-model"
          @change="set('show', !!$event)"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        title="Detail"
        sub-title="Auto draws the full model with shadows, makes the glass plain on a small or weak device or when frames run slow, and uses the simple model if the full one takes over 20 seconds to load."
      >
        <v-btn-toggle
          :value="model.detail"
          mandatory
          dense
          role="group"
          aria-label="Detail"
          data-tid="model-detail"
        >
          <v-btn
            v-for="o in modelDetails"
            :key="String(o.value)"
            small
            :value="o.value"
            :aria-pressed="model.detail === o.value ? 'true' : 'false'"
            :data-tid="`model-detail-${optionKey(o)}`"
            @click="set('detail', o.value)"
          >
            {{ o.label }}
          </v-btn>
        </v-btn-toggle>
      </app-setting>

      <v-divider />

      <app-setting
        title="Glass panels on the model"
        sub-title="Real glass is the costliest part to draw."
      >
        <v-btn-toggle
          :value="model.glass"
          mandatory
          dense
          role="group"
          aria-label="Glass panels on the model"
          data-tid="model-glass"
        >
          <v-btn
            v-for="o in modelGlasses"
            :key="String(o.value)"
            small
            :value="o.value"
            :aria-pressed="model.glass === o.value ? 'true' : 'false'"
            :data-tid="`model-glass-${optionKey(o)}`"
            @click="set('glass', o.value)"
          >
            {{ o.label }}
          </v-btn>
        </v-btn-toggle>
      </app-setting>

      <v-divider />

      <app-setting
        title="Show the print growing on the model"
        sub-title="The layers printed so far, on the 3D plate."
      >
        <v-switch
          :input-value="model.printGrowing"
          hide-details
          class="mb-5"
          aria-label="Show the print growing on the model"
          data-tid="print-growing"
          @change="set('printGrowing', !!$event)"
          @click.native.stop
        />
      </app-setting>
    </v-card>

    <v-subheader>
      Animation
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        title="Animations"
        :sub-title="animationsHint"
      >
        <v-btn-toggle
          :value="model.animations"
          mandatory
          dense
          role="group"
          aria-label="Animations"
          data-tid="model-animations"
        >
          <v-btn
            v-for="o in animationChoices"
            :key="String(o.value)"
            small
            :value="o.value"
            :aria-pressed="model.animations === o.value ? 'true' : 'false'"
            :data-tid="`model-animations-${optionKey(o)}`"
            @click="set('animations', o.value)"
          >
            {{ o.label }}
          </v-btn>
        </v-btn-toggle>
      </app-setting>
    </v-card>

    <v-subheader>
      Camera on the stage
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        title="Camera button on Overview"
        sub-title="Switches the stage between the 3D printer and the camera."
      >
        <v-switch
          :input-value="overviewCameraToggle"
          hide-details
          class="mb-5"
          aria-label="Camera button on Overview"
          data-tid="overview-camera-toggle"
          @change="overviewCameraToggle = !!$event"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting title="Opens on">
        <v-btn-toggle
          :value="model.opensOn"
          mandatory
          dense
          role="group"
          aria-label="Opens on"
          data-tid="opens-on"
        >
          <v-btn
            v-for="o in opensOnChoices"
            :key="String(o.value)"
            small
            :value="o.value"
            :aria-pressed="model.opensOn === o.value ? 'true' : 'false'"
            :data-tid="`opens-on-${optionKey(o)}`"
            @click="set('opensOn', o.value)"
          >
            {{ o.label }}
          </v-btn>
        </v-btn-toggle>
      </app-setting>

      <v-divider />

      <app-setting
        title="Which cameras exist and their order"
        sub-title="Cameras"
      >
        <v-btn
          small
          text
          :to="camerasTo"
          data-tid="cameras-link"
        >
          Cameras ›
        </v-btn>
      </app-setting>
    </v-card>

    <v-subheader>
      {{ $t('app.setting.title.gcode_preview') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-2"
      data-tid="gcode-preview-settings"
    >
      <app-setting title="Open the preview when a print starts">
        <v-switch
          v-model="autoLoadOnPrintStart"
          hide-details
          class="mb-5"
          aria-label="Open the preview when a print starts"
          data-tid="preview-auto-open"
          @click.native.stop
        />
      </app-setting>

      <template v-if="autoLoadOnPrintStart">
        <v-divider />

        <app-setting
          title="On a phone too"
          sub-title="Drawing a big file is slow on a phone."
        >
          <v-switch
            v-model="autoLoadMobileOnPrintStart"
            hide-details
            class="mb-5"
            aria-label="Open the preview when a print starts, on a phone too"
            data-tid="preview-auto-open-phone"
            @click.native.stop
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting title="Follow the head while printing">
        <v-switch
          v-model="autoFollowOnFileLoad"
          hide-details
          class="mb-5"
          aria-label="Follow the head while printing"
          data-tid="preview-follow-head"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting title="Show travel moves">
        <v-switch
          v-model="showMoves"
          hide-details
          class="mb-5"
          aria-label="Show travel moves"
          data-tid="preview-show-moves"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting title="Show retractions">
        <v-switch
          v-model="showRetractions"
          hide-details
          class="mb-5"
          aria-label="Show retractions"
          data-tid="preview-show-retractions"
          @click.native.stop
        />
      </app-setting>

      <template v-if="showRetractions">
        <v-divider />

        <app-setting
          title="Retraction marker size"
          sub-title="The size of the dot drawn where the filament pulls back."
        >
          <v-text-field
            :value="retractionIconSize"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThan(0)
            ]"
            filled
            dense
            single-line
            hide-details="auto"
            suffix="mm"
            aria-label="Retraction marker size"
            data-tid="preview-retraction-size"
            @change="setRetractionIconSize"
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting
        title="Draw the plate and origin"
        sub-title="The plate behind the print, and the 0,0 mark."
      >
        <div
          class="gps__pair"
          role="group"
          aria-label="Draw the plate and origin"
        >
          <v-btn
            small
            :class="{ 'v-btn--active': drawBackground }"
            :aria-pressed="drawBackground ? 'true' : 'false'"
            data-tid="preview-draw-plate"
            @click="drawBackground = !drawBackground"
          >
            Plate {{ drawBackground ? 'on' : 'off' }}
          </v-btn>
          <v-btn
            small
            :class="{ 'v-btn--active': drawOrigin }"
            :aria-pressed="drawOrigin ? 'true' : 'false'"
            data-tid="preview-draw-origin"
            @click="drawOrigin = !drawOrigin"
          >
            Origin {{ drawOrigin ? 'on' : 'off' }}
          </v-btn>
        </div>
      </app-setting>

      <v-divider />

      <app-setting
        title="Line thickness"
        sub-title="Extrusion, then travel."
      >
        <div class="gps__pair">
          <v-text-field
            :value="extrusionLineWidth"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThan(0)
            ]"
            filled
            dense
            single-line
            hide-details="auto"
            suffix="mm"
            aria-label="Extrusion line thickness"
            data-tid="preview-extrusion-width"
            @change="setExtrusionLineWidth"
          />
          <v-text-field
            :value="moveLineWidth"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThan(0)
            ]"
            filled
            dense
            single-line
            hide-details="auto"
            suffix="mm"
            aria-label="Travel line thickness"
            data-tid="preview-travel-width"
            @change="setMoveLineWidth"
          />
        </div>
      </app-setting>

      <v-divider />

      <app-setting
        title="Flip"
        sub-title="For printers whose origin is in another corner."
      >
        <div
          class="gps__pair"
          role="group"
          aria-label="Flip"
        >
          <v-btn
            small
            :class="{ 'v-btn--active': flipVertical }"
            :aria-pressed="flipVertical ? 'true' : 'false'"
            :aria-label="`Flip top to bottom: ${flipVertical ? 'on' : 'off'}`"
            data-tid="preview-flip-vertical"
            @click="flipVertical = !flipVertical"
          >
            ↕ {{ flipVertical ? 'on' : 'off' }}
          </v-btn>
          <v-btn
            small
            :class="{ 'v-btn--active': flipHorizontal }"
            :aria-pressed="flipHorizontal ? 'true' : 'false'"
            :aria-label="`Flip left to right: ${flipHorizontal ? 'on' : 'off'}`"
            data-tid="preview-flip-horizontal"
            @click="flipHorizontal = !flipHorizontal"
          >
            ↔ {{ flipHorizontal ? 'on' : 'off' }}
          </v-btn>
        </div>
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          data-tid="preview-settings-reset"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
    <p
      class="gps__note"
      data-tid="preview-one-file-note"
    >
      "Hide the bounding box" and "Minimum layer height" are in the preview's own ··· menu: they're about one file, not a setting.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { defaultState } from '@/store/config/state'
import { MODEL_DETAILS, MODEL_GLASSES, modelAnimates } from '@/services/m1-3d/render-options'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { modelSettings, setModelSetting, type ModelDeviceSettings } from '@/services/m1-3d/device-settings'

@Component({
  components: {}
})
export default class GcodePreviewSettings extends Vue {
  readonly modelDetails = MODEL_DETAILS
  readonly modelGlasses = MODEL_GLASSES
  readonly animationChoices = [
    { value: null, key: 'device', label: 'Like this device' },
    { value: true, key: 'on', label: 'On' },
    { value: false, key: 'off', label: 'Off' }
  ]

  readonly opensOnChoices: ReadonlyArray<{ value: ModelDeviceSettings['opensOn'], label: string }> = [
    { value: '3d', label: '3D' },
    { value: 'camera', label: 'Camera' }
  ]

  optionKey (o: { value: unknown, key?: string }): string {
    return o.key ?? String(o.value)
  }

  readonly model = modelSettings
  reducedMotion = false

  mounted () {
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }

  /** Saved on this device, for this person: not on the printer. */
  set<K extends keyof ModelDeviceSettings> (key: K, value: ModelDeviceSettings[K]) {
    setModelSetting(key, value)
  }

  get animationsHint (): string {
    const now = modelAnimates(this.model.animations, this.reducedMotion) ? 'on' : 'off'
    return `The moving head, tile springs and page transitions. "Like this device" follows its reduce-motion setting (${now} here).`
  }

  get camerasTo (): string {
    return `${scopedPath('/settings', activeSlug())}#camera`
  }

  get overviewCameraToggle (): boolean {
    return this.$store.state.config.uiSettings.general.overviewCameraToggle !== false
  }

  set overviewCameraToggle (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.overviewCameraToggle',
      value,
      server: true
    })
  }

  get extrusionLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.extrusionLineWidth
  }

  setExtrusionLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.extrusionLineWidth',
      value: +value,
      server: true
    })
  }

  get moveLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.moveLineWidth
  }

  setMoveLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.moveLineWidth',
      value: +value,
      server: true
    })
  }

  get retractionIconSize () {
    return this.$store.state.config.uiSettings.gcodePreview.retractionIconSize
  }

  setRetractionIconSize (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.retractionIconSize',
      value: +value,
      server: true
    })
  }

  get flipHorizontal () {
    return this.$store.state.config.uiSettings.gcodePreview.flip.horizontal
  }

  set flipHorizontal (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.horizontal',
      value,
      server: true
    })
  }

  get flipVertical () {
    return this.$store.state.config.uiSettings.gcodePreview.flip.vertical
  }

  set flipVertical (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.vertical',
      value,
      server: true
    })
  }

  get drawOrigin () {
    return this.$store.state.config.uiSettings.gcodePreview.drawOrigin
  }

  set drawOrigin (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.drawOrigin',
      value,
      server: true
    })
  }

  get drawBackground () {
    return this.$store.state.config.uiSettings.gcodePreview.drawBackground
  }

  set drawBackground (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.drawBackground',
      value,
      server: true
    })
  }

  get autoLoadOnPrintStart () {
    return this.$store.state.config.uiSettings.gcodePreview.autoLoadOnPrintStart
  }

  set autoLoadOnPrintStart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoLoadOnPrintStart',
      value,
      server: true
    })

    if (!value) {
      this.autoLoadMobileOnPrintStart = false
    }
  }

  get autoLoadMobileOnPrintStart () {
    return this.$store.state.config.uiSettings.gcodePreview.autoLoadMobileOnPrintStart
  }

  set autoLoadMobileOnPrintStart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoLoadMobileOnPrintStart',
      value,
      server: true
    })
  }

  get autoFollowOnFileLoad () {
    return this.$store.state.config.uiSettings.gcodePreview.autoFollowOnFileLoad
  }

  set autoFollowOnFileLoad (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoFollowOnFileLoad',
      value,
      server: true
    })
  }

  get showMoves (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.showMoves !== false
  }

  set showMoves (value: boolean) {
    this.saveViewerDefault('showMoves', value)
  }

  get showRetractions (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.showRetractions !== false
  }

  set showRetractions (value: boolean) {
    this.saveViewerDefault('showRetractions', value)
  }

  /** Saved on the printer as what a preview starts out showing, and the preview open now follows it. */
  saveViewerDefault (key: 'showMoves' | 'showRetractions', value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: `uiSettings.gcodePreview.${key}`,
      value,
      server: true
    })
    this.$store.commit('gcodePreview/setViewerState', { [key]: value })
  }

  handleReset () {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview',
      value: defaultState().uiSettings.gcodePreview,
      server: true
    })
    this.$store.dispatch('gcodePreview/applyViewerDefaults')
  }
}
</script>

<style lang="scss" scoped>
  .gps__pair {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;

    .v-text-field {
      max-width: 120px;
    }
  }

  .gps__note {
    margin: 0 4px 16px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }
</style>
