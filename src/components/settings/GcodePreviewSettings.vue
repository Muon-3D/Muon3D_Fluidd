<template>
  <div>
    <v-subheader id="gcodePreview">
      {{ $t('app.setting.title.gcode_preview') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        title="3D model detail"
        sub-title="The printer's 3D model and this preview: lower draws fewer pixels and shadows, for a slower device"
      >
        <v-btn-toggle
          :value="modelDetail"
          mandatory
          dense
          data-tid="model-detail"
        >
          <v-btn
            v-for="d in modelDetails"
            :key="d.value"
            small
            :value="d.value"
            :data-tid="`model-detail-${d.value}`"
            @click="modelDetail = d.value"
          >
            {{ d.label }}
          </v-btn>
        </v-btn-toggle>
      </app-setting>

      <v-divider />

      <app-setting
        title="Show the printer's 3D model"
        sub-title="Off, the Overview shows the printer's picture"
      >
        <v-switch
          v-model="showPrinterModel"
          hide-details
          class="mb-5"
          aria-label="Show the printer's 3D model"
          data-tid="show-printer-model"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        title="Animations"
        :sub-title="modelAnimationsHint"
      >
        <v-switch
          v-model="modelAnimations"
          hide-details
          class="mb-5"
          aria-label="Animations"
          data-tid="model-animations"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_animations')">
        <v-switch
          v-model="showAnimations"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

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
import { MODEL_DETAILS, modelAnimates, modelDetail, type ModelDetail } from '@/services/m1-3d/render-options'

@Component({
  components: {}
})
export default class GcodePreviewSettings extends Vue {
  readonly modelDetails = MODEL_DETAILS
  reducedMotion = false

  mounted () {
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }

  get modelDetail (): ModelDetail {
    return modelDetail(this.$store.state.config.uiSettings.gcodePreview.modelDetail)
  }

  set modelDetail (value: ModelDetail) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.modelDetail',
      value,
      server: true
    })
  }

  get showPrinterModel (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.showPrinterModel !== false
  }

  set showPrinterModel (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showPrinterModel',
      value,
      server: true
    })
  }

  get modelAnimations (): boolean {
    return modelAnimates(this.$store.state.config.uiSettings.gcodePreview.modelAnimations, this.reducedMotion)
  }

  set modelAnimations (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.modelAnimations',
      value,
      server: true
    })
  }

  get modelAnimationsHint (): string {
    const set = typeof this.$store.state.config.uiSettings.gcodePreview.modelAnimations === 'boolean'
    return set
      ? 'The 3D printer turns and moves smoothly; off, it jumps'
      : `The 3D printer turns and moves smoothly; until set, it follows your system's reduce-motion choice (${this.reducedMotion ? 'reduced' : 'full'})`
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

  get showAnimations () {
    return this.$store.state.config.uiSettings.gcodePreview.showAnimations
  }

  set showAnimations (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showAnimations',
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
