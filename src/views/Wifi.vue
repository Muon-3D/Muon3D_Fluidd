<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <!-- <printer-stats-card class="mb-2 mb-sm-4" />
      <printer-history-card /> -->
      <wifi-manager-card/>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'

@Component({
  components: {
    WifiManagerCard,
  }
})
export default class Wifi extends Vue {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }
}
</script>
