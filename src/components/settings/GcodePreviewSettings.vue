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
        sub-title="Auto picks Low on slow or small screens."
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
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.draw_origin')">
        <v-switch
          v-model="drawOrigin"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.draw_background')">
        <v-switch
          v-model="drawBackground"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_min_layer_height')">
        <v-text-field
          :value="minLayerHeight"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0.1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          @change="setMinLayerHeight"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.extrusion_line_width')">
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
          @change="setExtrusionLineWidth"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.move_line_width')">
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
          @change="setMoveLineWidth"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.retraction_icon_size')">
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
          @change="setRetractionIconSize"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.flip_horizontal')">
        <v-switch
          v-model="flipHorizontal"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.flip_vertical')">
        <v-switch
          v-model="flipVertical"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.auto_load_on_print_start')">
        <v-switch
          v-model="autoLoadOnPrintStart"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <template v-if="autoLoadOnPrintStart">
        <v-divider />

        <app-setting :title="$t('app.setting.label.auto_load_mobile_on_print_start')">
          <v-switch
            v-model="autoLoadMobileOnPrintStart"
            hide-details
            class="mb-5"
            @click.native.stop
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting :title="$t('app.setting.label.auto_follow_on_file_load')">
        <v-switch
          v-model="autoFollowOnFileLoad"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.hide_single_part_bounding_box')">
        <v-switch
          v-model="hideSinglePartBoundingBox"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
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

  get minLayerHeight () {
    return this.$store.state.config.uiSettings.gcodePreview.minLayerHeight
  }

  setMinLayerHeight (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.minLayerHeight',
      value: +value,
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

  get hideSinglePartBoundingBox () {
    return this.$store.state.config.uiSettings.gcodePreview.hideSinglePartBoundingBox
  }

  set hideSinglePartBoundingBox (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.hideSinglePartBoundingBox',
      value,
      server: true
    })
  }

  handleReset () {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview',
      value: defaultState().uiSettings.gcodePreview,
      server: true
    })
  }
}
</script>
