<template>
    <collapsable-card :title="$t('app.general.title.wifi')" icon="$wifi">
        <!-- Table of available networks -->
        <v-card>
            <v-simple-table class="temperature-table">
                <thead>
                    <tr>
                        <th class="tick" />
                        <th width="100%">SSID</th>
                        <th />
                    </tr>
                </thead>
                <v-fade-transition mode="out-in">
                    <!-- skeleton state -->
                    <tbody v-if="!wifi_avaliable_networks.length" key="skel">
                        <tr v-for="n in 5" :key="`avail-skel-${n}`">
                            <td class="tick"></td>
                            <td><v-skeleton-loader type="text" /></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>

                    <!-- real rows -->
                    <tbody v-else key="real">
                        <tr v-for="network in sortedNetworks" :key="network.bssid"
                            :class="{ 'card-heading': network.in_use }" v-ripple @click="openMenu(network.bssid)">
                            <td class="tick">
                                <v-icon dense v-if="network.in_use">$check</v-icon>
                            </td>
                            <td class="ssid">{{ network.ssid }}</td>
                            <td>
                                <v-icon dense :color="getSignalColor(network.signal)">
                                    {{ getWifiIconName(network) }}
                                </v-icon>
                            </td>
                            <td>
                                <v-tooltip bottom>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon small v-bind="attrs" v-on="on" class="primary--text">
                                            <v-icon small>$infoOutline</v-icon>
                                        </v-btn>
                                    </template>
                                    <div class="px-2 py-1" style="max-width: 200px; white-space: normal;">
                                        <div><strong>Security:</strong> {{ !network.security ?
                                            $t('app.chart.label.unsecured') : network.security }}</div>
                                        <div><strong>Signal:</strong> {{ network.signal }}%</div>
                                        <div><strong>Data rate:</strong> {{ network.rate }} Mbps</div>
                                        <div><strong>Channel:</strong> {{ network.chan }}</div>
                                        <div><strong>Frequency:</strong> {{ network.freq }} MHz</div>
                                    </div>
                                </v-tooltip>
                            </td>
                            <td class="pr-2">
                                <v-menu offset-y v-model="menuOpen[network.bssid]" open-on-click close-on-content-click
                                    :nudge-width="300" transition="fade-transition" max-width="200"
                                    v-if="network.in_use || knownSsids.has(network.ssid)">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon small v-bind="attrs" v-on="on">
                                            <v-icon dense>$menu</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list>
                                        <v-list-item @click="disconnectConfirmDialog = true" v-if="network.in_use">
                                            <v-list-item-icon>
                                                <v-icon dense color="warning">$linkOff</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>{{ $t('app.general.btn.disconnect')
                                                }}</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="forget(network)">
                                            <v-list-item-icon>
                                                <v-icon dense color="error">$delete</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>{{ $t('app.general.btn.forget') }}</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </td>

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

        <v-dialog v-model="disconnectConfirmDialog" max-width="400">
            <v-card>
                <v-card-title class="headline">
                    {{ $t('app.general.confirm.disconnect_title') }}
                </v-card-title>

                <v-card-text v-if="!onHotspot">
                    {{ $t('app.general.confirm.disconnect_message') }}
                </v-card-text>

                <v-card-actions>
                    <v-spacer />

                    <v-btn text @click="disconnectConfirmDialog = false">
                        {{ $t('app.general.btn.cancel') }}
                    </v-btn>

                    <v-btn color="error" @click="disconnect">
                        {{ $t('app.general.btn.disconnect') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { DeviceWifi } from '@/aux_api/models/device-wifi'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
const { onHotspot } = useHotspotCheck()
// No need to import v-skeleton-loader if globally available

@Component
export default class WifiManagerCard extends Vue {
    get onHotspot() {
        return onHotspot.value
    }
    @Prop({ type: Boolean })
    readonly menuCollapsed?: boolean;

    disconnectConfirmDialog: boolean = false

    menuOpen: Record<string, boolean> = {}

    // called when the row is clicked
    openMenu(bssid: string) {
        // close any others if you want single-open behavior:
        Object.keys(this.menuOpen).forEach(k => {
            if (k !== bssid) this.menuOpen[k] = false
        })
        // toggle or open
        this.$set(this.menuOpen, bssid, true)
    }

    auxApi = useAuxApi()

    // reactive data
    wifi_avaliable_networks: DeviceWifi[] = []
    private intervalId: ReturnType<typeof setInterval> | null = null

    knownSsids = new Set<string>()
    testedSsids = new Set<string>()

    async fetchDevices() {

        try {
            const res = await this.auxApi.api.wifiScanWifiScanGet(true)
            this.wifi_avaliable_networks = res.data

            for (const net of this.wifi_avaliable_networks) {
                if (!this.knownSsids.has(net.ssid) && !this.testedSsids.has(net.ssid)) {
                    try {
                        const details = await this.auxApi.api.getDetailsWifiShowGet(net.ssid)
                        console.debug('Known SSID:', net.ssid, 'Details:', details)
                        //error will get thrown if the SSID is not found
                        this.knownSsids.add(net.ssid)
                        
                        // if 404, leave it out
                    } catch (e: any) {
                        console.debug('SSID not found in known list:', net.ssid, e)
                        // network error → treat as unknown
                        this.testedSsids.add(net.ssid)
                    }
                }
            }
        } catch (e) {
            console.error('Wi-Fi scan failed', e)
        }
    }

    mounted() {
        this.fetchDevices()
        this.intervalId = setInterval(() => this.fetchDevices(), 5_000)
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


    async disconnect(network: DeviceWifi) {
        // your logic here
        try {
            const resp = await this.auxApi.api.wifiDisconnectWifiDisconnectPost()
            // AxiosResponse has `status`
            if (resp.status === 200) {
                // this.$toast.success(
                //     this.$t('Disconnected from {ssid}.', { ssid: this.toDisconnect.ssid })
                // )
                await this.fetchDevices()
            } else {
                // this.$toast.error(
                //     this.$t('Unexpected response status: {code}.', { code: resp.status })
                // )
            }
        } catch (err: any) {
            // AxiosError: err.response.data.detail or err.message
            const msg =
                err.response?.data?.detail ||
                err.response?.statusText ||
                err.message ||
                this.$t('app.general.msg.disconnect_failed')
            // this.$toast.error(
            //     this.$t('Disconnect failed: {msg}', { msg })
            // )
        }
    } //todo test properly



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
    font-size: 1rem !important;
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
    /* adjust duration here */
    transition-duration: 0.4s !important;
}

.connected-network {
    transition: filter 0.3s ease;
}


.v-card--link::before {
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

.temperature-table thead {
    /* collapse the header row, but keep its layout hints */
    visibility: collapse !important;
    /* Some browsers need this: */
    height: 0 !important;
}

td.tick {
    padding-right: 0px !important;
}
</style>
