<template>
  <div v-if="!forceMove">
    <toolhead-control-bars-axis axis="X" />
    <toolhead-control-bars-axis axis="Y" />
    <toolhead-control-bars-axis axis="Z" />

    <v-row
      no-gutters
      class="mb-2"
    >
      <v-col class="text-center">
        <app-btn
          :disabled="!klippyReady || printerPrinting"
          :loading="hasWait($waits.onHomeAll)"
          :color="!allHomed ? 'primary' : undefined"
          class="px-2 mr-2"
          @click="homeAll"
        >
          <v-icon
            small
            class="mr-1"
          >
            $home
          </v-icon>
          {{ $t('app.tool.btn.home_all') }}
        </app-btn>

        <app-btn
          :disabled="!klippyReady || printerPrinting"
          :loading="hasWait($waits.onHomeAll)"
          :color="!xyHomed ? 'primary' : undefined"
          class="px-2"
          @click="homeAll"
        >
          <v-icon
            small
            class="mr-1"
          >
            $home
          </v-icon>
          Home all
        </app-btn>
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <toolhead-control-bars-stepper
      v-for="stepper in steppers"
      :key="stepper.key"
      :stepper="stepper"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ToolheadControlBarsAxis from './ToolheadControlBarsAxis.vue'
import ToolheadControlBarsStepper from './ToolheadControlBarsStepper.vue'
import StateMixin from '@/mixins/state'
import DevGuardMixin from '@/mixins/dev-guard'
import ToolheadMixin from '@/mixins/toolhead'
import type { Stepper } from '@/store/printer/types'

@Component({
  components: {
    ToolheadControlBarsAxis,
    ToolheadControlBarsStepper
  }
})
export default class ToolheadControlBars extends Mixins(StateMixin, ToolheadMixin, DevGuardMixin) {
  get steppers (): Stepper[] {
    const steppers = this.$store.getters['printer/getSteppers'] as Stepper[]

    return steppers
      .filter(stepper => stepper.key.startsWith('stepper_'))
  }

  get forceMove (): boolean {
    // FORCE_MOVE is developer-mode only (Klipper#112): outside it the axis bars show.
    return !this.devOnlyLocked && this.$store.state.config.uiSettings.toolhead.forceMove as boolean
  }
}
</script>
