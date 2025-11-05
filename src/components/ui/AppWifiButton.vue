<template>
  <div>
    <!-- v-if="ap_current?.state === 'connected'" -->
    <v-menu
      v-model="hotspotMenu"
      offset-y
      max-width="450"
      min-width="400"
      content-class="full-width-menu"
      :close-on-content-click="false"
    >
      <!-- activator slot wraps your existing app-btn -->
      <template #activator="{ on, attrs }">
        <app-btn
          fab
          small
          :elevation="0"
          class="mr-1 bg-transparent"
          color="transparent"
          :loading="!ap_device_status || ap_toggling"
          v-bind="attrs"
          v-on="isWifiPage ? {} : on"
        >
          <v-icon>{{ ap_device_status?.state === 'connected' ? "$accessPoint" : "$accessPointOff" }}</v-icon>
        </app-btn>
      </template>

      <!-- dropdown panel: your HotspotManagerCard -->

      <hotspot-manager-card
        class="mt-1"
        style="z-index: 20;"
        @update:device-status="onDeviceStatus"
        @update:toggling="onToggling"
      />
    </v-menu>

    <!-- <app-btn fab small :elevation="0" class="mr-1 bg-transparent" color="transparent" :loading="!wifi_current"
      @click="goToWifiPage">
      <v-icon>
        {{ getWifiIconName() }}
      </v-icon>
    </app-btn> -->

    <v-menu
      v-model="wifiMenu"
      offset-y
      max-width="450"
      min-width="300"
      content-class="full-width-menu"
      :close-on-content-click="false"
    >
      <!-- activator slot wraps your existing app-btn -->
      <template #activator="{ on, attrs }">
        <app-btn
          fab
          small
          :elevation="0"
          class="mr-1 bg-transparent"
          color="transparent"
          :loading="!wifi_current"
          v-bind="attrs"
          v-on="isWifiPage ? {} : on"
        >
          <v-icon>{{ getWifiIconName() }}</v-icon>
        </app-btn>
      </template>

      <!-- dropdown panel: your HotspotManagerCard -->

      <wifi-manager-card
        class="mt-1"
        style="z-index: 20;"
        @update:device-status="onDeviceStatus"
        @update:toggling="onToggling"
      />
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { DeviceWifi } from '@/aux_api/models/device-wifi'
import type { Device } from '@/aux_api'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
// No need to import v-skeleton-loader if globally available

@Component({
  components: {
    HotspotManagerCard,
    WifiManagerCard
  }
})
export default class AppWifiButton extends Vue {
  hotspotMenu: boolean = false
  wifiMenu: boolean = false

  goToWifiPage () {
    // If you’ve named your route "wifi" in your router/index.ts:
    this.$router.push({ name: 'Wifi' })
    // Or by path:
    // this.$router.push('/wifi')
  }

  // reactive data
  wifi_current: DeviceWifi | null = null
  ap_device_status: Device | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null

  knownSsids = new Set<string>()

  async fetchCurrent () {
    try {
      const res = await useAuxApi().wifi.wifiCurrentWifiCurrentGet(true)
      this.wifi_current = res.data
      this.ap_device_status = (await useAuxApi().ap.wifiStatusWifiApDeviceStatusGet()).data
    } catch (e) {
      this.wifi_current = null
      console.error('Wi-Fi scan failed', e)
    }
  }

  ap_toggling = false
  onDeviceStatus (newVal: Device | null) {
    this.ap_device_status = newVal
  }

  onToggling (newVal:boolean) {
    this.ap_toggling = newVal
  }

  mounted () {
    this.fetchCurrent()
    this.intervalId = setInterval(() => this.fetchCurrent(), 5_000)
  }

  beforeDestroy () {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  private getSignalLevel (signal: number): 1 | 2 | 3 | 4 {
    if (signal >= 75) return 4
    if (signal >= 50) return 3
    if (signal >= 25) return 2
    return 1
  }

  getWifiIconName (): string {
    if (this.wifi_current == null) return '$wifi-strength-off'
    const lvl = this.getSignalLevel(this.wifi_current.signal)
    return `$wifi-strength-${lvl}`
    // const sec = net.security?.toLowerCase() || ''
    // const lockSuffix = (!sec || sec.includes('open')) ? '' : '-lock'
    // return `$wifi-strength-${lvl}${lockSuffix}`
  }

  getSignalColor (): string {
    if (this.wifi_current == null) return ''
    const lvl = this.getSignalLevel(this.wifi_current.signal)
    return lvl === 4 ? 'green' : lvl === 3 ? 'lime' : lvl === 2 ? 'orange' : 'red'
  }

  get isWifiPage (): boolean {
  // either by name…
    return this.$route.name === 'Wifi'
  // …or by path:
  // return this.$route.path.startsWith('/wifi')
  }
}
</script>

<style scoped lang="scss">
.full-width-menu {
  width: 100% !important;
}
</style>
