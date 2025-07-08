<template>
    <collapsable-card :title="$t('app.general.title.wifi')" icon="$wifi">
        <v-fade-transition mode="out-in">
            <!-- Skeleton loader for connected networks -->
            <template v-if="!wifi_avaliable_networks.length">
                <v-skeleton-loader type="image" class="ma-4" :height="65" />
            </template>
            <!-- Actual connected networks -->

            <template v-else>
                <v-card v-for="network in sortedNetworks" v-if="network.in_use" :key="network.bssid"
                    class="connected-network ma-4" outlined link @click="toggleActions(network.bssid)" color="card-heading">
                    <div class="d-flex align-center pa-4">
                        <!-- Icon -->
                        <v-icon large class="me-4" :color="getSignalColor(network.signal)">
                            {{ getWifiIconName(network) }}
                        </v-icon>

                        <!-- SSID -->
                        <span class="me-6 font-weight-medium ssid">
                            {{ network.ssid }}
                        </span>


                        <!-- ↓ this part swaps out ↓ -->
                        <div class="actions-container flex-grow-1 text-right d-flex justify-end">
                            <v-fade-transition mode="out-in">
                                <template v-if="expandedBssid === network.bssid">
                                    <div class="d-flex align-center justify-space-between" style="width: 220px;">
                                        <v-btn @click.stop="disconnect(network)" color="warning" text>
                                            {{ $t('app.general.btn.disconnect') }}
                                        </v-btn>
                                        <v-btn @click.stop="forget(network)" color="error" text>
                                            {{ $t('app.general.btn.forget') }}
                                        </v-btn>
                                    </div>
                                </template>
                                <template v-else>
                                    <!-- Frequency @ Rate -->
                                    <span class="me-6 subtitle-2 text--secondary">
                                        {{ network.freq }} MHz @ {{ network.rate }} Mbps
                                    </span>
                                    <v-chip small color="default" icon="$lock">
                                        {{ network.security || $t('app.chart.label.unsecured') }}
                                    </v-chip>
                                </template>
                            </v-fade-transition>
                        </div>
                    </div>
                </v-card>
            </template>
        </v-fade-transition>

        <!-- Divider -->
        <v-divider />

        <!-- Table of available networks -->
        <v-card>
            <v-simple-table class="temperature-table">
                <thead>
                    <tr>
                        <th />
                        <th width="100%">SSID</th>
                        <th>{{ $t('app.chart.label.security') }}</th>
                        <th />
                    </tr>
                </thead>
                <v-fade-transition mode="out-in">
                    <!-- skeleton state -->
                    <tbody v-if="!wifi_avaliable_networks.length" key="skel">
                        <tr v-for="n in 5" :key="`avail-skel-${n}`">
                            <td><v-skeleton-loader type="icon" /></td>
                            <td><v-skeleton-loader type="text" /></td>
                            <td><v-skeleton-loader type="text" /></td>
                            <td></td>
                        </tr>
                    </tbody>

                    <!-- real rows -->
                    <tbody v-else key="real">
                        <tr v-for="network in sortedNetworks" :key="network.bssid" :class="{ 'in-use': network.in_use }"
                            v-if="!network.in_use" v-ripple>
                            <td>
                                <v-icon small :color="getSignalColor(network.signal)">
                                    {{ getWifiIconName(network) }}
                                </v-icon>
                            </td>
                            <td class="ssid">{{ network.ssid }}</td>
                            <td class="security">
                                <span>{{ network.security || $t('app.chart.label.unsecured') }}</span>
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </v-fade-transition>
            </v-simple-table>
        </v-card>



        <template #menu>
            <app-btn-collapse-group :collapsed="menuCollapsed">
                <!-- menu buttons -->
            </app-btn-collapse-group>
        </template>
    </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { DeviceWifi } from '@/aux_api/models/device-wifi'
// No need to import v-skeleton-loader if globally available

@Component
export default class WifiManagerCard extends Vue {
    @Prop({ type: Boolean })
    readonly menuCollapsed?: boolean

    auxApi = useAuxApi()

    // reactive data
    wifi_avaliable_networks: DeviceWifi[] = []
    private intervalId: ReturnType<typeof setInterval> | null = null

    async fetchDevices() {

        try {
            const res = await this.auxApi.api.wifiScanWifiScanGet(true)
            this.wifi_avaliable_networks = res.data
        } catch (e) {
            console.error('Wi-Fi scan failed', e)
        }
    }

    mounted() {
        this.fetchDevices()
        this.intervalId = setInterval(() => this.fetchDevices(), 10_000)
    }

    beforeDestroy() {
        if (this.intervalId) clearInterval(this.intervalId)
    }

    get sortedNetworks(): DeviceWifi[] {
        return [...this.wifi_avaliable_networks].sort((a, b) => {
            if (a.in_use && !b.in_use) return -1
            if (!a.in_use && b.in_use) return 1
            return b.signal - a.signal
        })
    }

    private getSignalLevel(signal: number): 1 | 2 | 3 | 4 {
        if (signal >= 75) return 4
        if (signal >= 50) return 3
        if (signal >= 25) return 2
        return 1
    }

    getWifiIconName(net: DeviceWifi): string {
        const lvl = this.getSignalLevel(net.signal)
        if (net.in_use) return `$wifi-strength-${lvl}`
        const sec = net.security?.toLowerCase() || ''
        const lockSuffix = (!sec || sec.includes('open')) ? '' : '-lock'
        return `$wifi-strength-${lvl}${lockSuffix}`
    }

    getSignalColor(signal: number): string {
        const lvl = this.getSignalLevel(signal)
        return lvl === 4 ? 'green' : lvl === 3 ? 'lime' : lvl === 2 ? 'orange' : 'red'
    }

    expandedBssid: string | null = null

    toggleActions(bssid: string | null) {
        this.expandedBssid = this.expandedBssid === bssid ? null : bssid
    }

    disconnect(network: DeviceWifi) {
        // your logic here
        console.log('disconnect', network)
    }

    forget(network: DeviceWifi) {
        // your logic here
        console.log('forget', network)
    }
}
</script>

<style scoped lang="scss">
.current-ssid {
    font-size: 1.25rem;
    font-weight: 600;
}

.temperature-table {}

.ssid {
    font-size: 1rem;
}

.security {
    font-size: 1rem;

    span {
        opacity: 0.45;
    }
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
    /* adjust duration here */
    transition-duration: 0.4s !important;
}

.connected-network {
    transition: filter 0.3s ease;
}


.v-card--link::before{
    border-radius: inherit
}

/* disable the focus‐overlay */
.v-card--link:focus::before {
  opacity: 0 !important;
}

/* re-enable it on hover */
.v-card--link:hover::before {
  opacity: 0.08 !important;
}

/* give your “available networks” rows a pointer cursor and light background on hover */
.temperature-table tbody tr {
    transition: background-color 0.3s ease;

    &:hover {
        cursor: pointer;
    }
}
</style>
