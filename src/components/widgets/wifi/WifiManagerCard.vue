<template>
  <collapsable-card
    :title="$t('app.general.title.wifi')"
    icon="$wifi"
  >
    <!-- Table of available networks -->
    <v-card>
      <v-simple-table class="temperature-table">
        <thead>
          <tr>
            <th class="tick" />
            <th width="100%">
              SSID
            </th>
            <th />
          </tr>
        </thead>

        <v-fade-transition mode="out-in">
          <!-- skeleton state -->
          <tbody
            v-if="!wifi_available_networks.length"
            key="skel"
          >
            <tr
              v-for="n in 5"
              :key="`avail-skel-${n}`"
            >
              <td class="tick" />
              <td><v-skeleton-loader type="text" /></td>
              <td /><td /><td />
            </tr>
          </tbody>

          <!-- real rows -->
          <tbody
            v-else
            key="real"
          >
            <tr
              v-for="network in sortedNetworks"
              :key="network.ssid"
              v-ripple
              :class="{ 'card-heading': network.in_use }"
              @click="onNetworkClick(network)"
            >
              <td class="tick">
                <v-icon
                  v-if="network.in_use"
                  dense
                >
                  $check
                </v-icon>
              </td>
              <td class="ssid">
                {{ network.ssid }}
              </td>
              <td>
                <v-icon
                  dense
                  :color="getSignalColor(network.signal)"
                >
                  {{ getWifiIconName(network) }}
                </v-icon>
              </td>
              <td>
                <v-tooltip bottom>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      icon
                      small
                      v-bind="attrs"
                      class="primary--text"
                      v-on="on"
                    >
                      <v-icon small>
                        $infoOutline
                      </v-icon>
                    </v-btn>
                  </template>
                  <div
                    class="px-2 py-1"
                    style="max-width: 200px; white-space: normal;"
                  >
                    <div>
                      <strong>{{ $t('app.wifi.security') }}:</strong> {{ !network.security ?
                        $t('app.chart.label.unsecured') : network.security }}
                    </div>
                    <div><strong>{{ $t('app.wifi.signal') }}:</strong> {{ network.signal }}%</div>
                    <div><strong>{{ $t('app.wifi.data_rate') }}:</strong> {{ network.rate }} Mbps</div>
                    <div><strong>{{ $t('app.wifi.channel') }}:</strong> {{ network.chanList || network.chan }}</div>
                    <div><strong>{{ $t('app.wifi.freqency') }}:</strong> {{ network.freqList || network.freq }} MHz</div>
                  </div>
                </v-tooltip>
              </td>
              <td class="pr-2">
                <v-menu
                  v-if="network.in_use || knownSsids.has(network.ssid)"
                  v-model="menuOpen[network.bssid]"
                  offset-y
                  open-on-click
                  close-on-content-click
                  :nudge-width="300"
                  transition="fade-transition"
                  max-width="200"
                >
                  <template #activator="{ on, attrs }">
                    <v-btn
                      icon
                      small
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon dense>
                        $menu
                      </v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-if="network.in_use"
                      @click="disconnectConfirmDialog = true"
                    >
                      <v-list-item-icon>
                        <v-icon
                          dense
                          color="warning"
                        >
                          $linkOff
                        </v-icon>
                      </v-list-item-icon>
                      <v-list-item-title>{{ $t('app.general.btn.disconnect') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="forget(network)">
                      <v-list-item-icon>
                        <v-icon
                          dense
                          color="error"
                        >
                          $delete
                        </v-icon>
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
      <!-- <app-btn-collapse-group :collapsed="menuCollapsed">

      </app-btn-collapse-group> -->
      <v-btn
        fab
        x-small
        text
        :loading="fetching"
        @click="fetchDevices"
      >
        <v-icon>$refresh</v-icon>
      </v-btn>
    </template>

    <!-- DISCONNECT CONFIRM DIALOG -->
    <v-dialog
      v-model="disconnectConfirmDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.wifi.modal.disconnect.title') }}
        </v-card-title>
        <v-card-text v-if="!onHotspot">
          {{ $t('app.wifi.modal.disconnect.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="disconnectConfirmDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            @click="disconnect"
          >
            {{ $t('app.general.btn.disconnect') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- WARNING DIALOG WHEN NOT ON HOTSPOT -->
    <v-dialog
      v-model="showWarningDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.wifi.modal.warning.title') }}
        </v-card-title>
        <v-card-text v-if="!onHotspot">
          {{ $t('app.wifi.modal.warning.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="acceptWarning_loading"
            @click="showWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            :loading="acceptWarning_loading"
            @click="acceptWarning"
          >
            {{ $t('app.general.btn.Proceed') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- PASSWORD PROMPT DIALOG -->
    <v-dialog
      v-model="showPasswordDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.confirm.enter_password', { ssid: selectedNetwork?.ssid }) }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="password"
            :label="$t('app.general.label.password')"
            type="password"
            @keyup.enter="connectToSelected"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="showPasswordDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="connectToSelected"
          >
            {{ $t('app.general.btn.connect') }}
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
import { EventBus } from '@/eventBus'

const { onHotspot } = useHotspotCheck()

type AggWifi = DeviceWifi & { chanList?: string; freqList?: string }

@Component
export default class WifiManagerCard extends Vue {
  @Prop({ type: Boolean }) readonly menuCollapsed?: boolean

  // Dialog & connection state
  disconnectConfirmDialog = false
  showWarningDialog = false
  showPasswordDialog = false
  selectedNetwork: DeviceWifi | null = null
  password = ''

  // Menu state
  menuOpen: Record<string, boolean> = {}

  // Wi-Fi scan data
  wifi_available_networks: DeviceWifi[] = []
  knownSsids = new Set<string>()
  testedSsids = new Set<string>()
  wifiOrder: string[] = []
  private intervalId: ReturnType<typeof setInterval> | null = null

  refresh () {
    this.wifi_available_networks = []
    this.knownSsids.clear()
    this.testedSsids.clear()
    this.wifiOrder = []
  }

  get onHotspot () {
    return onHotspot.value
  }

  auxApi = useAuxApi()

  // Lifecycle
  mounted () {
    this.fetchDevices()
    this.intervalId = setInterval(() => this.fetchDevices(), 5000)
  }

  beforeDestroy () {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  fetching: boolean = false

  // Fetch and mark known SSIDs
  async fetchDevices () {
    if (this.fetching) return
    this.fetching = true
    try {
      const res = await this.auxApi.wifi.wifiScanWifiScanGet(true)
      this.wifi_available_networks = res.data

      // Skip hidden SSIDs when probing for "known" status
      for (const net of this.wifi_available_networks) {
        const ssid = (net.ssid || '').trim() // NEW
        if (!ssid) continue // NEW: hide hidden networks at source
        if (!this.knownSsids.has(ssid) && !this.testedSsids.has(ssid)) {
          try {
            await this.auxApi.wifi.getDetailsWifiShowGet(ssid)
            console.log('Known SSID:', ssid)
            this.knownSsids.add(ssid)
          } catch {
            this.testedSsids.add(ssid)
          }
        }
      }

      // —— CHANGED: “first-come” ordering now tracked by SSID (after grouping) ——
      const groups = this.groupedNetworks // NEW
      const current = new Set(groups.map(g => g.ssid)) // NEW
      const bySignal = [...groups].sort((a, b) => b.signal - a.signal)
      for (const net of bySignal) {
        if (!this.wifiOrder.includes(net.ssid)) {
          this.wifiOrder.push(net.ssid)
        }
      }
      this.wifiOrder = this.wifiOrder.filter(ssid => current.has(ssid))
      // ————————————————————————————————————————————————————————————————
    } catch (e) {
      console.error('Wi-Fi scan failed', e)
    }
    this.fetching = false
  }

  // NEW: one row per SSID with merged details
  get groupedNetworks (): AggWifi[] {
    const bySsid = new Map<string, AggWifi & { _chans: Set<string>, _freqs: Set<string> }>()
    for (const n of this.wifi_available_networks) {
      const ssid = (n.ssid || '').trim()
      if (!ssid) continue // hide hidden networks altogether

      const isSecured = !!(n.security && !/^\s*open\s*$/i.test(n.security))
      if (!bySsid.has(ssid)) {
        bySsid.set(ssid, {
          ...n,
          ssid, // normalized
          in_use: !!n.in_use,
          signal: n.signal,
          rate: n.rate,
          security: isSecured ? n.security : '', // empty => “unsecured” label
          chanList: String(n.chan),
          freqList: String(n.freq),
          _chans: new Set([String(n.chan)]),
          _freqs: new Set([String(n.freq)])
        } as any)
      } else {
        const g = bySsid.get(ssid)!
        g.in_use = g.in_use || !!n.in_use
        // Prefer any secured label over “open”
        if (isSecured && (!g.security || /^\s*open\s*$/i.test(g.security))) {
          g.security = n.security
        }
        if (n.signal > g.signal) g.signal = n.signal
        if (n.rate > g.rate) g.rate = n.rate
        g._chans.add(String(n.chan))
        g._freqs.add(String(n.freq))
      }
    }

    // finalize readable lists
    for (const g of bySsid.values()) {
      g.chanList = Array.from(g._chans).join(', ')
      g.freqList = Array.from(g._freqs).join(', ')
      delete (g as any)._chans
      delete (g as any)._freqs
    }
    return Array.from(bySsid.values())
  }

  // Sorting
  get sortedNetworks (): AggWifi[] {
    const groups = this.groupedNetworks
    const connectedSsid = this.wifi_available_networks.find(n => n.in_use)?.ssid?.trim() || null
    const map = new Map(groups.map(n => [n.ssid, n]))
    const others = this.wifiOrder
      .filter(ssid => map.has(ssid) && ssid !== connectedSsid)
      .map(ssid => map.get(ssid)!)

    return connectedSsid && map.has(connectedSsid)
      ? [map.get(connectedSsid)!, ...others]
      : others
  }

  // Signal icon logic
  private getSignalLevel (signal: number): 1 | 2 | 3 | 4 {
    if (signal >= 75) return 4
    if (signal >= 50) return 3
    if (signal >= 25) return 2
    return 1
  }

  getWifiIconName (net: DeviceWifi): string {
    const lvl = this.getSignalLevel(net.signal)
    if (net.in_use) return `$wifi-strength-${lvl}`
    const sec = net.security?.toLowerCase() || ''
    const lockSuffix = (!sec || sec.includes('open')) ? '' : '-lock'
    return `$wifi-strength-${lvl}${lockSuffix}`
  }

  getSignalColor (signal: number): string {
    const lvl = this.getSignalLevel(signal)
    return lvl === 4 ? 'green' : lvl === 3 ? 'lime' : lvl === 2 ? 'orange' : 'red'
  }

  // Existing menu toggle
  openMenu (ssid: string) {
    Object.keys(this.menuOpen).forEach(k => {
      if (k !== ssid) this.menuOpen[k] = false
    })
    this.$set(this.menuOpen, ssid, true)
  }

  // Unchanged signature *usage*, but pass SSID now
  onNetworkClick (network: DeviceWifi) {
    if (network.in_use) {
      this.openMenu(network.ssid) // CHANGED (was network.bssid)
    } else {
      this.selectedNetwork = network
      if (!this.onHotspot) {
        this.showWarningDialog = true
      } else {
        this.promptOrConnect()
      }
    }
  }

  acceptWarning_loading = false
  async acceptWarning () {
    this.acceptWarning_loading = true
    this.showWarningDialog = false
    try {
      await this.promptOrConnect()
    } catch {

    }
    this.acceptWarning_loading = false
  }

  async promptOrConnect () {
    if (!this.selectedNetwork) return
    const sec = this.selectedNetwork.security?.toLowerCase() || ''
    if (this.knownSsids.has(this.selectedNetwork.ssid)) {
      await this.auxApi.wifi.wifiSwitchWifiUpPost(this.selectedNetwork.ssid)
      this.refresh()
      await this.fetchDevices()
    } else if (!sec || sec.includes('open')) {
      this.connectToSelected()
    } else {
      this.password = ''
      this.showPasswordDialog = true
    }
  }

  async connectToSelected () {
    if (!this.selectedNetwork) return
    this.showPasswordDialog = false
    try {
      await this.auxApi.wifi.wifiConnectWifiConnectPost({
        ssid: this.selectedNetwork.ssid,
        password: this.password || undefined
      })
      EventBus.$emit(this.$t('app.wifi.msg.connect.success') + ' ' + this.selectedNetwork.ssid, { type: 'success', timeout: 2000 })
      await this.fetchDevices()
    } catch (err: any) {
      EventBus.$emit(this.$t('app.wifi.msg.connect.error') + ' ' + err.response?.data?.detail || err.response?.statusText || err.message, { type: 'error', timeout: 5000 })
    }
  }

  // Existing disconnect & forget
  async disconnect () {
    try {
      const resp = await this.auxApi.wifi.wifiDisconnectWifiDisconnectPost()
      if (resp.status === 200) {
        await this.fetchDevices()
      }
    } catch (err: any) {
      EventBus.$emit(this.$t('app.wifi.msg.disconnect.error') + ' ' + err.response?.data?.detail || err.response?.statusText || err.message, { type: 'error', timeout: 5000 })
    }
    this.disconnectConfirmDialog = false
  }

  async forget (network: DeviceWifi) {
    try {
      await this.auxApi.wifi.wifiForgetWifiForgetDelete(network.ssid)
      this.knownSsids.delete(network.ssid)
      this.testedSsids.delete(network.ssid)
      await this.fetchDevices()
    } catch (e) {
      console.error('Forget failed', e)
    }
  }
}
</script>

<style scoped lang="scss">
.current-ssid {
  font-size: 1.25rem;
  font-weight: 600;
}

.ssid {
  font-size: 1rem !important;
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition-duration: 0.4s !important;
}

.connected-network {
  transition: filter 0.3s ease;
}

.v-card--link::before {
  border-radius: inherit;
}

.v-card--link:focus::before {
  opacity: 0 !important;
}

.v-card--link:hover::before {
  opacity: 0.08 !important;
}

.temperature-table tbody tr {
  transition: background-color 0.3s ease;
  &:hover {
    cursor: pointer;
  }
}

.temperature-table thead {
  visibility: collapse !important;
  height: 0 !important;
}

td.tick {
  padding-right: 0 !important;
}
</style>
