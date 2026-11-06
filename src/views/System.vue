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
      <div
        v-if="canControlHost"
        class="sys__acts"
      >
        <button
          type="button"
          class="cbtn cbtn--danger"
          :disabled="printerPrinting"
          data-tid="system-reboot"
          @click="reboot"
        >
          <frame-icon
            name="refresh"
            small
          />
          Reboot
        </button>
        <button
          type="button"
          class="cbtn cbtn--danger"
          :disabled="printerPrinting"
          data-tid="system-shutdown"
          @click="shutDown"
        >
          <frame-icon
            name="power"
            small
          />
          Shut down
        </button>
      </div>
      <p
        v-if="canControlHost && printerPrinting"
        class="stile__note sys__printing"
      >
        Not while printing.
      </p>
    </div>

    <div class="stiles">
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
          <div
            v-for="service in services"
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
              <button
                v-else
                type="button"
                class="cbtn cbtn--sm sys__svc-btn"
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
                v-if="!service.inactive && service.name !== moonrakerServiceName"
                type="button"
                class="cbtn cbtn--sm cbtn--danger sys__svc-btn"
                :aria-label="`Stop ${service.name}`"
                :data-tid="`system-svc-stop-${service.name}`"
                @click="stop(service.name)"
              >
                <frame-icon
                  name="x"
                  small
                />
                Stop
              </button>
            </span>
          </div>
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
        class="stile stile--4"
        data-tid="system-klipper"
      >
        <header class="stile__head">
          <frame-icon name="settings" />
          <h2>Klipper</h2>
        </header>
        <div class="sys__buttons">
          <button
            type="button"
            class="cbtn"
            data-tid="system-restart-klipper"
            @click="klippyConnected ? restartKlippy() : serviceRestartKlipper()"
          >
            Restart Klipper
          </button>
          <button
            v-if="klippyConnected"
            type="button"
            class="cbtn"
            data-tid="system-firmware-restart"
            @click="firmwareRestartKlippy"
          >
            Restart the firmware too
          </button>
        </div>
        <p class="stile__note">
          A restart reads printer.cfg again. Restarting the firmware also resets the control boards, after an error that needs it.
        </p>
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
import type { MCU } from '@/store/printer/types'
import type { ServiceInfo, SystemInfo } from '@/store/server/types'
import { chartLines } from '@/services/overview/model'
import { fileSize } from '@/services/jobs/model'
import { diskUse, frequency, latest, loadBars, loadHealth, networkLines, osName, servicesLine, serviceState } from '@/services/system/model'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TonePill from '@/components/printers/TonePill.vue'
import PeripheralsDialog from '@/components/common/PeripheralsDialog.vue'
import RolloverLogsDialog from '@/components/common/RolloverLogsDialog.vue'
import McuInformationDialog from '@/components/widgets/system/McuInformationDialog.vue'

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
      .map(s => ({ name: s.name, state: serviceState(s.active_state, s.sub_state), inactive: s.active_state === 'inactive', ...serviceLook(s.name) }))
  }

  /** The line under the title: the printer's name, then whether its services run. */
  get summary (): string {
    return servicesLine(this.services)
  }

  logs = ['klippy.log', 'moonraker.log']

  async ask (text: string, title: string, button: string, danger = true): Promise<boolean> {
    return !!(await this.$confirm(text, { title, buttonTrueText: button, danger }))
  }

  async reboot () {
    if (await this.ask('This page loses touch with it for a minute or two.', `Restart ${this.printerName}'s computer?`, 'Restart')) this.hostReboot()
  }

  async shutDown () {
    if (await this.ask("It stays off until it's switched off and on at the printer.", `Shut down ${this.printerName}'s computer?`, 'Shut down')) this.hostShutdown()
  }

  async restart (name: string) {
    const printing = this.printerPrinting ? 'It is printing: restarting Klipper or Moonraker stops the print.' : 'It is back in a few seconds.'
    if (await this.ask(printing, `Restart ${name}?`, 'Restart', this.printerPrinting)) await this.serviceRestartByName(name)
  }

  async start (name: string) {
    await this.serviceStartByName(name)
  }

  async stop (name: string) {
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

  .sys__acts,
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
  .sys--phone {
    .sys__acts {
      flex: 1 1 100%;

      .cbtn {
        flex: 1 1 0;
      }
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
