<template>
  <div>
    <!-- Expand / Contract -->
    <app-btn
      color=""
      class="ml-1"
      fab
      x-small
      text
      @click="collapsedModel = !collapsedModel"
    >
      <v-icon :class="{ 'rotate-180': collapsedModel }">
        $chevronUp
      </v-icon>
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync } from 'vue-property-decorator'

@Component({})
export default class AppBtnCollapse extends Vue {
  @PropSync('collapsed', { type: Boolean })
    collapsedModel?: boolean
}
</script>
