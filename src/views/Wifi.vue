<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12" md="6">
      <!-- <printer-stats-card class="mb-2 mb-sm-4" />
      <printer-history-card /> -->

      <wifi-manager-card />
    </v-col>
    <v-col cols="12" md="6">
      <hotspot-manager-card/>
    </v-col>

  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue';

@Component({
  components: {
    WifiManagerCard,
    HotspotManagerCard
  }
})
export default class Wifi extends Vue {
  get breakpoint() {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }
}
</script>
