<template>
  <div
    class="sys"
    :class="{ 'sys--phone': isMobileViewport }"
    data-tid="system-page"
  >
    <div class="sys__top">
      <p
        class="sys__summary"
        data-tid="system-summary"
      >
        {{ summary ? `${printerName} · ${summary}` : printerName }}
      </p>
    </div>

    <div class="stiles">
      <section
        class="stile stile--12 sys__restart"
        data-tid="system-restart"
      >
        <header class="stile__head">
          <frame-icon name="refresh" />
          <h2>Restart or stop</h2>
        </header>
        <div class="slist">
          <div
            v-for="row in restartRows"
            :key="row.id"
            class="sys__rrow"
            :data-row="row.id"
          >
            <div class="srow">
              <span
                class="srow__ico"
                :class="{ 'sys__ico--danger': row.danger }"
              ><frame-icon :name="rowIcon(row.id)" /></span>
              <div class="srow__text">
                <span class="srow__t">{{ row.title }}</span>
                <span class="srow__s">{{ row.line }}</span>
                <span
                  v-if="refusal(row.id)"
                  class="srow__s sys__refused"
                  :data-tid="`system-refused-${row.id}`"
                >{{ refusal(row.id) }}</span>
              </div>
              <span class="srow__act">
                <button
                  type="button"
                  class="cbtn cbtn--sm sys__row-btn"
                  :class="{ 'cbtn--danger': row.danger }"
                  :disabled="!!refusal(row.id) || rowBusy(row.id)"
                  :aria-label="row.title"
                  :data-tid="rowTid(row.id)"
                  @click="runRow(row.id)"
                >
                  {{ row.button }}
                </button>
              </span>
            </div>
            <div
              v-if="runs[row.id]"
              class="sys__run"
              :class="`sys__run--${runs[row.id].phase}`"
              :data-tid="`system-run-${row.id}`"
              :data-phase="runs[row.id].phase"
              role="status"
            >
              <span class="sys__run-ico">
                <span
                  v-if="runs[row.id].phase === 'running' || runs[row.id].phase === 'cooling'"
                  class="sys__spin"
                />
                <frame-icon
                  v-else
                  :name="runs[row.id].phase === 'back' ? 'check' : 'alert'"
                  small
                />
              </span>
              <div class="srow__text">
                <span class="srow__t">{{ runs[row.id].title }}</span>
                <span class="srow__s">{{ runs[row.id].line }}</span>
              </div>
              <span class="srow__act">
                <button
                  v-if="runs[row.id].phase === 'cooling'"
                  type="button"
                  class="cbtn cbtn--sm cbtn--danger"
                  data-tid="system-shutdown-now"
                  @click="shutdownNow"
                >
                  Shut down now
                </button>
                <router-link
                  v-if="runs[row.id].phase === 'failed' && (row.id === 'klipper' || row.id === 'boards')"
                  class="cbtn cbtn--sm"
                  :to="consoleTo"
                  data-tid="system-open-console"
                >
                  Open Console
                </router-link>
                <button
                  v-if="runs[row.id].phase === 'failed' && row.id === 'klipper'"
                  type="button"
                  class="cbtn cbtn--sm"
                  data-tid="system-try-boards"
                  @click="runRow('boards')"
                >
                  Try boards too
                </button>
              </span>
            </div>
          </div>
          <div
            v-if="offAt"
            class="srow sys__off"
            data-tid="system-off"
          >
            <span class="srow__ico"><frame-icon name="power" /></span>
            <div class="srow__text">
              <span class="srow__t">{{ printerName }} is off</span>
              <span class="srow__s">Shut down {{ offClock }}. Switch it on at the printer.</span>
            </div>
          </div>
        </div>
        <p class="stile__note">
          While printing, a Klipper restart asks first and says the print will stop. Restart the computer and Shut down are refused while printing.
        </p>
      </section>

      <section
        class="stile stile--4"
        data-tid="system-host"
      >
        <header class="stile__head">
          <frame-icon name="chip" />
          <h2>Host</h2>
        </header>
        <dl class="slist sys__facts">
          <div
            v-for="fact in hostFacts"
            :key="fact.label"
            class="srow"
          >
            <dt class="srow__text">
              {{ fact.label }}
            </dt>
            <dd class="srow__v">
              {{ fact.value }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="stile stile--4"
        data-tid="system-usage"
      >
        <header class="stile__head">
          <frame-icon name="pulse" />
          <h2>Load</h2>
          <span class="stile__aside">
            <tone-pill :tone="health.tone">{{ health.text }}</tone-pill>
          </span>
        </header>
        <div class="sys__bars">
          <div
            v-for="bar in bars"
            :key="bar.key"
            :data-bar="bar.key"
          >
            <div class="sys__bar-head">
              <span>{{ bar.label }}</span>
              <b>{{ bar.value }} <small v-if="bar.sub">{{ bar.sub }}</small></b>
            </div>
            <div
              class="sbar"
              role="meter"
              :aria-valuenow="Math.round(bar.share * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="bar.label"
            >
              <i :style="{ width: `${Math.round(bar.share * 100)}%` }" />
            </div>
          </div>
        </div>
      </section>

      <section
        class="stile stile--4"
        data-tid="system-boards"
      >
        <header class="stile__head">
          <frame-icon name="chip" />
          <h2>Boards</h2>
        </header>
        <p
          v-if="!boards.length"
          class="stile__note"
        >
          No control boards reported yet.
        </p>
        <div
          v-else
          class="slist"
        >
          <div
            v-for="mcu in boards"
            :key="mcu.name"
            class="srow"
            :data-tid="`system-mcu-${mcu.name}`"
          >
            <div class="srow__text">
              <span class="srow__t">{{ mcu.title }}</span>
              <span class="srow__s">{{ mcu.line }}</span>
            </div>
            <tone-pill :tone="mcu.tone">
              {{ mcu.status }}
            </tone-pill>
            <button
              type="button"
              class="cbtn cbtn--sm"
              :data-tid="`system-mcu-details-${mcu.name}`"
              @click="mcuOpen = mcu.raw"
            >
              Details
            </button>
          </div>
        </div>
      </section>

      <section
        class="stile stile--8"
        data-tid="system-power"
      >
        <header class="stile__head">
          <frame-icon name="settings" />
          <h2>Services</h2>
        </header>
        <div class="slist">
          <template v-for="service in services">
            <div
              :key="service.name"
              class="srow sys__service"
              :data-service="service.name"
            >
              <span class="srow__ico"><frame-icon :name="service.icon" /></span>
              <div class="srow__text">
                <span class="srow__t">{{ service.name }}</span>
                <span
                  v-if="service.line"
                  class="srow__s"
                >{{ service.line }}</span>
              </div>
              <tone-pill :tone="service.state.tone">
                {{ service.state.text }}
              </tone-pill>
              <span class="srow__act">
                <button
                  v-if="service.inactive"
                  type="button"
                  class="cbtn cbtn--sm sys__svc-btn"
                  :aria-label="`Start ${service.name}`"
                  :data-tid="`system-svc-start-${service.name}`"
                  @click="start(service.name)"
                >
                  <frame-icon
                    name="power"
                    small
                  />
                  Start
                </button>
                <v-menu
                  v-else
                  offset-y
                  left
                >
                  <template #activator="{ on, attrs }">
                    <button
                      type="button"
                      class="cbtn cbtn--sm sys__more"
                      :aria-label="`More for ${service.name}`"
                      :disabled="rowBusy(`svc-${service.name}`)"
                      :data-tid="`system-svc-menu-${service.name}`"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <frame-icon
                        name="more"
                        small
                      />
                    </button>
                  </template>
                  <div
                    class="sys__menu"
                    role="menu"
                    :data-tid="`system-svc-items-${service.name}`"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      class="sys__menu-item"
                      :aria-label="`Restart ${service.name}`"
                      :data-tid="`system-svc-restart-${service.name}`"
                      @click="restart(service.name)"
                    >
                      <frame-icon
                        name="refresh"
                        small
                      />
                      Restart
                    </button>
                    <button
                      v-if="service.log"
                      type="button"
                      role="menuitem"
                      class="sys__menu-item"
                      :data-tid="`system-svc-log-${service.name}`"
                      @click="downloadFile(service.log, '')"
                    >
                      <frame-icon
                        name="files"
                        small
                      />
                      Its log
                    </button>
                    <button
                      v-if="service.canStop"
                      type="button"
                      role="menuitem"
                      class="sys__menu-item sys__menu-item--danger"
                      :aria-label="`Stop ${service.name}`"
                      :data-tid="`system-svc-stop-${service.name}`"
                      @click="stop(service.name)"
                    >
                      <frame-icon
                        name="x"
                        small
                      />
                      Stop…
                    </button>
                  </div>
                </v-menu>
              </span>
            </div>
            <div
              v-if="runs[svcKey(service.name)]"
              :key="`run-${service.name}`"
              class="sys__run"
              :class="`sys__run--${runs[svcKey(service.name)].phase}`"
              :data-tid="`system-run-${svcKey(service.name)}`"
              :data-phase="runs[svcKey(service.name)].phase"
              role="status"
            >
              <span class="sys__run-ico">
                <span
                  v-if="runs[svcKey(service.name)].phase === 'running' || runs[svcKey(service.name)].phase === 'cooling'"
                  class="sys__spin"
                />
                <frame-icon
                  v-else
                  :name="runs[svcKey(service.name)].phase === 'back' ? 'check' : 'alert'"
                  small
                />
              </span>
              <div class="srow__text">
                <span class="srow__t">{{ runs[svcKey(service.name)].title }}</span>
                <span class="srow__s">{{ runs[svcKey(service.name)].line }}</span>
              </div>
              <span class="srow__act">
                <button
                  v-if="runs[svcKey(service.name)].phase === 'cooling'"
                  type="button"
                  class="cbtn cbtn--sm cbtn--danger"
                  data-tid="system-shutdown-now"
                  @click="shutdownNow"
                >
                  Shut down now
                </button>
                <router-link
                  v-if="runs[svcKey(service.name)].phase === 'failed' && (service.name === 'klipper')"
                  class="cbtn cbtn--sm"
                  :to="consoleTo"
                  data-tid="system-open-console"
                >
                  Open Console
                </router-link>
                <button
                  v-if="runs[svcKey(service.name)].phase === 'failed' && svcKey(service.name) === 'klipper'"
                  type="button"
                  class="cbtn cbtn--sm"
                  data-tid="system-try-boards"
                  @click="runRow('boards')"
                >
                  Try boards too
                </button>
              </span>
            </div>
          </template>
        </div>
      </section>

      <section
        class="stile stile--4"
        data-tid="system-logs"
      >
        <header class="stile__head">
          <frame-icon name="download" />
          <h2>Logs</h2>
        </header>
        <div class="slist">
          <div
            v-for="log in logs"
            :key="log"
            class="srow"
          >
            <span class="srow__ico"><frame-icon name="download" /></span>
            <div class="srow__text">
              <span class="srow__t">{{ log }}</span>
            </div>
            <button
              type="button"
              class="cbtn cbtn--sm"
              :data-tid="`system-log-${log}`"
              @click="downloadFile(log, '')"
            >
              Download
            </button>
          </div>
          <div class="srow">
            <span class="srow__ico"><frame-icon name="devices" /></span>
            <div class="srow__text">
              <span class="srow__t">Devices plugged in</span>
            </div>
            <button
              type="button"
              class="cbtn cbtn--sm"
              data-tid="system-devices"
              @click="devicesOpen = true"
            >
              Show
            </button>
          </div>
          <div
            v-if="canRollover"
            class="srow"
          >
            <span class="srow__ico"><frame-icon name="refresh" /></span>
            <div class="srow__text">
              <span class="srow__t">Start new log files</span>
            </div>
            <button
              type="button"
              class="cbtn cbtn--sm"
              data-tid="system-rollover"
              @click="rolloverOpen = true"
            >
              Start
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="powerDevices.length"
        class="stile stile--4"
        data-tid="system-power-devices"
      >
        <header class="stile__head">
          <frame-icon name="bolt" />
          <h2>Power</h2>
        </header>
        <div class="slist">
          <div
            v-for="device in powerDevices"
            :key="device.device"
            class="srow"
          >
            <div class="srow__text">
              <span class="srow__t">{{ device.device }}</span>
              <span class="srow__s">{{ device.status }}</span>
            </div>
            <toggle-switch
              :value="device.status === 'on'"
              :label="device.device"
              :disabled="device.status === 'error' || device.status === 'init' || (printerPrinting && device.locked_while_printing)"
              @input="togglePower(device)"
            />
          </div>
        </div>
      </section>

      <section
        v-if="activity.length"
        class="stile"
        data-tid="system-activity"
      >
        <header class="stile__head">
          <frame-icon name="pulse" />
          <h2>Activity</h2>
          <span class="stile__aside stile__note">the last 10 minutes</span>
        </header>
        <div class="sys__tiles">
          <div
            v-for="tile in activity"
            :key="tile.key"
            class="sys__tile"
          >
            <span class="sys__tile-label">{{ tile.label }}</span>
            <b>{{ tile.value }}</b>
            <svg
              v-if="tile.path"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              class="sys__spark"
              aria-hidden="true"
            >
              <path :d="tile.path" />
            </svg>
            <span class="sys__tile-sub">{{ tile.sub }}</span>
          </div>
        </div>
      </section>
    </div>

    <router-link
      :to="updatesTo"
      class="sys__updates-link"
      data-tid="system-updates-link"
    >
      <frame-icon name="download" />
      <span>Software versions and installing updates: <b>Updates</b>.</span>
      <span class="sys__updates-go">Updates ›</span>
    </router-link>

    <peripherals-dialog
      v-if="devicesOpen"
      v-model="devicesOpen"
    />
    <rollover-logs-dialog
      v-if="rolloverOpen"
      v-model="rolloverOpen"
    />
    <mcu-information-dialog
      v-if="mcuOpen"
      :value="!!mcuOpen"
      :mcu="mcuOpen"
      @input="!$event && (mcuOpen = null)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import ServicesMixin from '@/mixins/services'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { Device } from '@/store/power/types'
import type { MCU, Heater } from '@/store/printer/types'
import type { ServiceInfo, SystemInfo } from '@/store/server/types'
import { chartLines } from '@/services/overview/model'
import { fileSize } from '@/services/jobs/model'
import { diskUse, frequency, latest, loadBars, loadHealth, networkLines, osName, servicesLine, serviceState } from '@/services/system/model'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TonePill from '@/components/printers/TonePill.vue'
import PeripheralsDialog from '@/components/common/PeripheralsDialog.vue'
import RolloverLogsDialog from '@/components/common/RolloverLogsDialog.vue'
import McuInformationDialog from '@/components/widgets/system/McuInformationDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import {
  RESTART_ROWS, canStopService, clock, hostPower, hostRefusal, markHostOff, needsCooling, printStopWarning, runningLine, serviceLog, shutdownHeatLine, took,
  type RestartRow, type RestartRowId, type RowRun
} from '@/services/system/restart'
import { HOT_C } from '@/services/updates/policy'

/** An icon and a line for the services people know; any other has neither. */
function serviceLook (name: string): { icon: string, line: string } {
  const n = name.toLowerCase()
  if (n.includes('klipper')) return { icon: 'settings', line: 'Runs the printer' }
  if (n.includes('moonraker')) return { icon: 'cloud', line: 'The API Control talks to' }
  if (n.includes('crowsnest') || n.includes('webcam') || n.includes('camera')) return { icon: 'camera', line: 'Streams the camera' }
  if (n.includes('link') || n.includes('iroh')) return { icon: 'wifi', line: 'Remote access' }
  return { icon: 'code', line: '' }
}

type Points = Array<Record<string, unknown> & { date: Date }>

/**
 * System (Settings), as tiles: the host, its load as four bars, the control
 * boards, services with a Restart on each row, the logs, Klipper's restart,
 * power devices, and how busy Klipper, Moonraker and each board have been.
 * Reboot and Shut down are red pills at the top and each asks to confirm.
 */
@Component({ components: { ToggleSwitch, TonePill, PeripheralsDialog, RolloverLogsDialog, McuInformationDialog } })
export default class System extends Mixins(OverviewMixin, ServicesMixin, BrowserMixin) {
  devicesOpen = false
  rolloverOpen = false
  mcuOpen: MCU | null = null
  /** Each restart's progress line, by row id or `svc-<name>`. */
  runs: Record<string, RowRun> = {}
  timers: Record<string, number> = {}

  beforeDestroy () {
    Object.keys(this.timers).forEach(key => this.untrack(key))
  }

  /** Moonraker reports the disk's use with a folder's listing; the G-code folder's is cheap. */
  mounted () {
    if (!(this.$store.getters['files/getUsage'] as { total?: number } | undefined)?.total) {
      SocketActions.serverFilesGetDirectory('gcodes', 'gcodes')
    }
  }

  get systemInfo (): SystemInfo | null {
    return this.$store.getters['server/getSystemInfo'] as SystemInfo | null
  }

  get canControlHost (): boolean {
    return this.systemInfo?.virtualization?.virt_type !== 'container'
  }

  get canRollover (): boolean {
    return this.$store.getters['server/getIsMinApiVersion']('1.0.5') as boolean
  }

  // -- power and services -------------------------------------------------------

  get powerDevices (): Device[] {
    if (!this.$store.getters['server/componentSupport']('power')) return []
    return (this.$store.getters['power/getDevices'] as Device[]) ?? []
  }

  get services () {
    return ((this.$store.getters['server/getServices'] as ServiceInfo[]) ?? [])
      .filter(s => s.name !== 'klipper_mcu')
      .map(s => ({
        name: s.name,
        state: serviceState(s.active_state, s.sub_state),
        inactive: s.active_state === 'inactive',
        log: serviceLog(s.name),
        canStop: canStopService(s.name, this.away),
        ...serviceLook(s.name)
      }))
  }

  /** The line under the title: the printer's name, then whether its services run. */
  get summary (): string {
    return servicesLine(this.services)
  }

  logs = ['klippy.log', 'moonraker.log']

  async ask (text: string, title: string, button: string, danger = true, cancel?: string): Promise<boolean> {
    return !!(await this.$confirm(text, { title, buttonTrueText: button, danger, ...(cancel ? { buttonFalseText: cancel } : {}) }))
  }

  // -- restart or stop ------------------------------------------------------------

  /** This page reaches the printer through Muon link, from away. */
  get away (): boolean {
    return !!cloudState.activePrinterId
  }

  get restartRows (): RestartRow[] {
    return RESTART_ROWS.filter(row => this.canControlHost || row.id === 'klipper' || row.id === 'boards')
  }

  get updatesTo (): string {
    return `${scopedPath('/settings', activeSlug())}#versions`
  }

  get consoleTo (): string {
    return scopedPath('/console', activeSlug())
  }

  get offAt (): number | null {
    return this.socketConnected ? null : hostPower.offAt
  }

  get offClock (): string {
    return this.offAt ? clock(this.offAt) : ''
  }

  get hotendTemp (): number | null {
    const heater = ((this.$store.getters['printer/getHeaters'] as Heater[]) ?? []).find(h => h.name === 'extruder')
    return typeof heater?.temperature === 'number' ? heater.temperature : null
  }

  rowIcon (id: RestartRowId): string {
    return id === 'shutdown' ? 'power' : id === 'boards' ? 'chip' : 'refresh'
  }

  rowTid (id: RestartRowId): string {
    return { klipper: 'system-restart-klipper', boards: 'system-firmware-restart', computer: 'system-reboot', shutdown: 'system-shutdown' }[id]
  }

  refusal (id: RestartRowId): string | null {
    if (id === 'computer' || id === 'shutdown') return hostRefusal(this.printerPrinting, this.printerPaused)
    return null
  }

  svcKey (name: string): string {
    return `svc-${name}`
  }

  rowBusy (key: string): boolean {
    const phase = this.runs[key]?.phase
    return phase === 'running' || phase === 'cooling'
  }

  /** While printing a Klipper restart stops the print: ask, in the storyboard's words. */
  async confirmPrintStop (what: string): Promise<boolean> {
    const stats = this.$store.state.printer.printer.print_stats ?? {}
    const progress = this.$store.getters['printer/getPrintProgress'] as number | undefined
    return this.ask(printStopWarning(stats.filename || null, typeof progress === 'number' ? progress : null), `${what} during the print?`, 'Stop print and restart', true, 'Keep printing')
  }

  get klippyFailure (): string | null {
    const state = ((this.$store.state.server.info?.klippy_state as string | undefined) ?? '').toLowerCase()
    if (state !== 'error' && state !== 'shutdown') return null
    return (this.$store.getters['printer/getKlippyStateMessage'] as string) || `Klipper reports ${state}.`
  }

  async runRow (id: RestartRowId) {
    if (this.refusal(id) || this.rowBusy(id)) return
    if (id === 'klipper' || id === 'boards') {
      const what = id === 'klipper' ? 'Restart Klipper' : 'Restart Klipper and the boards'
      if ((this.printerPrinting || this.printerPaused) && !(await this.confirmPrintStop(what))) return
      if (id === 'klipper') {
        if (this.klippyConnected) this.restartKlippy()
        else this.serviceRestartKlipper()
      } else {
        this.firmwareRestartKlippy()
      }
      const subject = id === 'klipper' ? 'Klipper' : 'Klipper and the boards'
      this.track(id, {
        running: `Restarting ${subject}…`,
        back: `${subject} ${id === 'klipper' ? 'is' : 'are'} back`,
        failed: `${subject} didn't come back`,
        eta: id === 'klipper' ? 10 : 20,
        isUp: () => this.socketConnected && this.klippyReady,
        failure: () => this.klippyFailure
      })
    } else if (id === 'computer') {
      if (!(await this.ask('This page loses touch with it for a minute or two, then reconnects by itself.', `Restart ${this.printerName}'s computer?`, 'Restart'))) return
      if (this.refusal(id)) return
      this.hostReboot()
      this.track(id, {
        running: 'Restarting the computer…',
        back: `${this.printerName} is back`,
        failed: `${this.printerName} didn't come back`,
        eta: 120,
        timeout: 300,
        needsDown: true,
        isUp: () => this.socketConnected
      })
    } else {
      await this.shutDown()
    }
  }

  async shutDown () {
    const temp = this.hotendTemp
    const text = ['It stays off until someone switches it off and on at the printer. Nobody can turn it on from here.', shutdownHeatLine(temp)].filter(Boolean).join(' ')
    if (!(await this.ask(text, `Shut down ${this.printerName}?`, 'Shut down'))) return
    if (this.refusal('shutdown')) return
    if (!needsCooling(temp)) return this.shutdownNow()

    // Hot: heaters off, the hotend fan cools it, then the computer powers off.
    const heaters = (this.$store.getters['printer/getHeaters'] as Heater[]) ?? []
    if (heaters.some(h => (h.target ?? 0) > 0)) this.sendGcode('TURN_OFF_HEATERS')
    const startedAt = Date.now()
    const cooling = () => {
      const now = this.hotendTemp
      if (!needsCooling(now) || this.refusal('shutdown')) {
        if (this.refusal('shutdown')) this.$delete(this.runs, 'shutdown')
        else this.shutdownNow()
        return
      }
      this.$set(this.runs, 'shutdown', {
        phase: 'cooling',
        title: `Cooling the hotend: ${Math.round(now ?? 0)} °C`,
        line: `It shuts down at ${HOT_C} °C. The fan is cooling it.`,
        startedAt
      })
    }
    this.untrack('shutdown')
    cooling()
    if (this.runs.shutdown) this.timers.shutdown = window.setInterval(cooling, 1000)
  }

  shutdownNow () {
    this.untrack('shutdown')
    this.$delete(this.runs, 'shutdown')
    this.hostShutdown()
    markHostOff()
  }

  untrack (key: string) {
    if (this.timers[key]) window.clearInterval(this.timers[key])
    delete this.timers[key]
  }

  /**
   * The row turns into its progress line: running, then back (when it
   * answers again) or failed, with the reason in Klipper's words.
   */
  track (key: string, run: { running: string, back: string, failed: string, eta: number, isUp: () => boolean, failure?: () => string | null, needsDown?: boolean, timeout?: number }) {
    this.untrack(key)
    const startedAt = Date.now()
    const timeout = (run.timeout ?? Math.max(60, run.eta * 4)) * 1000
    let sawDown = false
    this.$set(this.runs, key, { phase: 'running', title: run.running, line: runningLine(run.eta), startedAt })
    const finish = (phase: 'back' | 'failed', title: string, line: string) => {
      this.untrack(key)
      this.$set(this.runs, key, { phase, title, line, startedAt })
    }
    const tick = () => {
      const elapsed = Date.now() - startedAt
      const up = run.isUp()
      if (!up) sawDown = true
      const why = elapsed > 2000 && sawDown ? run.failure?.() : null
      if (why) return finish('failed', run.failed, why)
      if (up && (sawDown || (!run.needsDown && elapsed > 2500))) return finish('back', run.back, `Restarted ${clock(Date.now())} · ${took(elapsed)}`)
      if (elapsed > timeout) finish('failed', run.failed, `No answer after ${took(elapsed).replace('took ', '')}.`)
    }
    this.timers[key] = window.setInterval(tick, 500)
  }

  async restart (name: string) {
    const key = this.svcKey(name)
    if (this.rowBusy(key)) return
    const stopsPrint = name === 'klipper' || name === this.moonrakerServiceName
    if ((this.printerPrinting || this.printerPaused) && stopsPrint) {
      if (!(await this.confirmPrintStop(`Restart ${name}`))) return
    } else if (this.away && !canStopService(name, true)) {
      if (!(await this.ask('This page reaches the printer through it, so it drops for a few seconds.', `Restart ${name}?`, 'Restart', false))) return
    }
    await this.serviceRestartByName(name)
    const service = () => ((this.$store.getters['server/getServices'] as ServiceInfo[]) ?? []).find(s => s.name === name)
    const klippy = name === 'klipper'
    const socket = name === this.moonrakerServiceName
    this.track(key, {
      running: `Restarting ${name}…`,
      back: `${name} is back`,
      failed: `${name} didn't come back`,
      eta: 10,
      isUp: () => socket ? this.socketConnected : klippy ? this.socketConnected && this.klippyReady : service()?.active_state === 'active',
      failure: () => klippy ? this.klippyFailure : service()?.active_state === 'failed' ? `It failed to start (${service()?.sub_state || 'failed'}).` : null
    })
  }

  async start (name: string) {
    await this.serviceStartByName(name)
  }

  async stop (name: string) {
    if (!canStopService(name, this.away)) return
    if (await this.ask("It stays stopped until it's started here or the computer restarts.", `Stop ${name}?`, 'Stop')) await this.serviceStopByName(name)
  }

  async togglePower (device: Device) {
    const confirm = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange
    const next = device.status === 'on' ? 'off' : 'on'
    if (confirm && !(await this.ask(next === 'off' ? 'Whatever runs from it loses power at once.' : 'It switches on straight away.', `Turn ${device.device} ${next}?`, `Turn ${next}`, next === 'off'))) return
    SocketActions.machineDevicePowerToggle(device.device, next, `${this.$waits.onDevicePowerToggle}${device.device}`)
  }

  // -- the computer -----------------------------------------------------------------

  get hostFacts (): Array<{ label: string, value: string }> {
    const cpu = this.systemInfo?.cpu_info
    const facts: Array<{ label: string, value: string | null | undefined }> = [
      { label: 'Name on the network', value: this.$store.state.printer.printer.info?.hostname },
      { label: 'Board', value: cpu?.model || cpu?.hardware_desc },
      { label: 'Processor', value: [cpu?.processor, cpu?.cpu_count ? `${cpu.cpu_count} cores` : '', cpu?.bits].filter(Boolean).join(' · ') || cpu?.cpu_desc },
      { label: 'Memory', value: cpu?.total_memory ? fileSize(cpu.total_memory * 1024) : null },
      { label: 'Operating system', value: osName(this.systemInfo?.distribution) },
      { label: 'Network', value: networkLines(this.systemInfo?.network).join('\n') || null },
      { label: 'Klipper', value: this.$store.state.printer.printer.info?.software_version },
      { label: 'Moonraker', value: this.$store.state.server.info?.moonraker_version },
      { label: 'Runs in', value: this.systemInfo?.virtualization?.virt_type && this.systemInfo.virtualization.virt_type !== 'none' ? `${this.systemInfo.virtualization.virt_type} (${this.systemInfo.virtualization.virt_identifier})` : null }
    ]
    return [...facts.filter((f): f is { label: string, value: string } => !!f.value), ...this.sdFacts]
  }

  get disk () {
    return diskUse(this.$store.getters['files/getUsage'], fileSize)
  }

  get sdFacts (): Array<{ label: string, value: string }> {
    const sd = (this.systemInfo?.sd_info ?? {}) as Record<string, string | number | undefined>
    const facts = [
      { label: 'Card', value: [sd.manufacturer, sd.product_name].filter(Boolean).join(' ') },
      { label: 'Size', value: sd.capacity ? String(sd.capacity) : '' },
      { label: 'Made', value: sd.manufacturer_date ? String(sd.manufacturer_date) : '' }
    ]
    return facts.filter(f => f.value)
  }

  // -- how busy ---------------------------------------------------------------------

  series (name: string): Points {
    return ((this.$store.state.charts[name] as Points | undefined) ?? [])
  }

  spark (points: Points, key: string): string | null {
    if (points.length < 2) return null
    const data = points.map(p => ({ date: p.date, [key]: Number(p[key]) || 0 }))
    const span = (data[data.length - 1].date.getTime() - data[0].date.getTime()) / 1000
    return chartLines(data as never, [key], Math.max(10, span), data[data.length - 1].date.getTime(), 200, 40).lines[0]?.path ?? null
  }

  /** The four bars of the Load tile. */
  get bars () {
    const memory = latest(this.series('memory'), 'memused')
    return loadBars({
      load: latest(this.series('klipper'), 'load'),
      cores: this.systemInfo?.cpu_info?.cpu_count || 1,
      memoryPercent: memory,
      memoryTotalKb: this.systemInfo?.cpu_info?.total_memory,
      disk: this.disk,
      temperature: (this.$store.state.server.cpu_temp as number | null) ?? null
    }, fileSize)
  }

  get health () {
    return loadHealth(this.bars)
  }

  /** What Klipper, Moonraker and each board have been doing, as lines over time. */
  get activity () {
    const klipper = this.series('klipper')
    const moonraker = this.series('moonraker')
    const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`)
    const cores = this.systemInfo?.cpu_info?.cpu_count || 1
    const computer = this.series('klipper')
    const load = latest(computer, 'load')
    const memory = this.series('memory')
    return [
      { key: 'load', label: 'The computer', value: load === null ? '—' : load.toFixed(2), sub: `load, of ${cores} ${cores === 1 ? 'core' : 'cores'}`, path: this.spark(computer, 'load') },
      { key: 'memory', label: 'Memory', value: pct(latest(memory, 'memused')), sub: 'in use', path: this.spark(memory, 'memused') },
      { key: 'klipper', label: 'Klipper', value: pct(latest(klipper, 'cputime_change')), sub: 'of a core', path: this.spark(klipper, 'cputime_change') },
      { key: 'moonraker', label: 'Moonraker', value: pct(latest(moonraker, 'load')), sub: 'of a core', path: this.spark(moonraker, 'load') },
      ...this.mcus.map(m => {
        const points = this.series(m.name)
        return { key: m.name, label: this.boardName(m.name), value: pct(latest(points, 'load') !== null ? latest(points, 'load')! * 100 : null), sub: 'busy', path: this.spark(points, 'load') }
      })
    ]
  }

  // -- control boards ---------------------------------------------------------------

  get mcus (): MCU[] {
    return (this.$store.getters['printer/getMcus'] as MCU[]) ?? []
  }

  boardName (name: string): string {
    if (name === 'mcu') return 'Main board'
    return name.replace(/^mcu\s+/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
  }

  get boards () {
    return this.mcus.map(m => {
      const c = (m.mcu_constants ?? {}) as Record<string, string | number>
      const facts = [
        { label: 'Chip', value: String(c.MCU ?? '') },
        { label: 'Speed', value: c.CLOCK_FREQ ? frequency(Number(c.CLOCK_FREQ)) : '' },
        { label: 'Firmware', value: m.mcu_version ?? '' }
      ].filter(f => f.value)
      const line = [c.MCU, c.CLOCK_FREQ ? frequency(Number(c.CLOCK_FREQ)) : '', m.mcu_version].filter(Boolean).join(' · ')
      const ready = !!m.mcu_version
      return { name: m.name, title: this.boardName(m.name), facts, line, status: ready ? 'Ready' : 'Not reporting', tone: ready ? 'ok' as const : 'off' as const, raw: m }
    })
  }
}
</script>

<style lang="scss" scoped>
  .sys__top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .sys__summary {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .sys__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sys__printing {
    flex-basis: 100%;
    text-align: right;
  }

  .sys__facts {
    margin: 0;

    dd {
      margin: 0;
    }

    dt {
      color: var(--m3d-text-muted);
      font-weight: 400;
    }

    .srow__v {
      white-space: pre-line;
    }
  }

  .sys__svc-btn {
    min-width: 92px;
    gap: 6px;
  }

  .sys__bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sys__bar-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 14px;

    b {
      font-variant-numeric: tabular-nums;
    }

    small {
      color: var(--m3d-text-muted);
      font-weight: 400;
    }
  }

  .sys__tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .sys__updates-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font-size: 14px;
    text-decoration: none;

    .sys__updates-go {
      margin-left: auto;
      color: var(--m3d-accent, #7fd6cf);
      white-space: nowrap;
    }
  }

  .sys__tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);

    b {
      font-size: 20px;
      font-variant-numeric: tabular-nums;
    }
  }

  .sys__tile-label {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .sys__tile-sub {
    color: var(--m3d-text-subtle);
    font-size: 11px;
  }

  .sys__spark {
    width: 100%;
    height: 32px;

    path {
      fill: none;
      stroke: var(--m3d-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
  }

  // A phone: a row that holds a state and buttons wraps them under its name.
  .sys__rrow + .sys__rrow,
  .sys__off {
    border-top: 1px solid var(--m3d-border);
  }

  .sys__ico--danger {
    color: var(--m3d-danger, #ff5a5a);
  }

  .sys__refused {
    color: var(--m3d-warn, #f0b429) !important;
  }

  .sys__row-btn {
    min-width: 92px;
  }

  .sys__more {
    min-width: 40px;
    padding: 0 10px;
  }

  .sys__run {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
  }

  .sys__run--back .sys__run-ico {
    color: var(--m3d-ok, #46c37b);
  }

  .sys__run--failed {
    background: color-mix(in srgb, var(--m3d-danger, #ff5a5a) 14%, var(--m3d-surface-2));

    .sys__run-ico {
      color: var(--m3d-danger, #ff5a5a);
    }
  }

  .sys__run-ico {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 20px;
  }

  .sys__spin {
    width: 16px;
    height: 16px;
    border: 2px solid var(--m3d-border);
    border-top-color: var(--m3d-accent, #3cc5b5);
    border-radius: 50%;
    animation: sys-spin 0.9s linear infinite;
  }

  @keyframes sys-spin {
    to { transform: rotate(360deg); }
  }

  .sys__menu {
    display: flex;
    flex-direction: column;
    min-width: 180px;
    padding: 6px;
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
    background: var(--m3d-surface);
  }

  .sys__menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    color: var(--m3d-text);
    font-size: 14px;
    text-align: left;

    &:hover,
    &:focus-visible {
      background: var(--m3d-surface-2);
    }
  }

  .sys__menu-item--danger {
    color: var(--m3d-danger, #ff5a5a);
  }

  .sys--phone {
    // Tap targets of 44px on a phone.
    .cbtn,
    .sys__more,
    .sys__menu-item {
      min-height: 44px;
    }

    .sys__more {
      min-width: 44px;
    }

    .sys__printing {
      text-align: left;
    }

    .sys__service {
      flex-wrap: wrap;

      .srow__text {
        flex-basis: calc(100% - 60px);
      }

      .srow__act {
        margin-left: auto;
      }
    }
  }
</style>
