<template>
  <tile-shell
    tile="job"
    title="Print job"
    :state="stateText"
    :tone="stateTone"
    :menu="menu"
    class="jt"
  >
    <template v-if="busy">
      <div class="jt__who">
        <span class="jt__thumb">
          <img
            v-if="jobThumbnail"
            :src="jobThumbnail"
            alt=""
          >
          <frame-icon
            v-else
            name="plate"
            large
          />
        </span>
        <span class="jt__text">
          <b data-tid="job-name">{{ jobName || jobFile }}</b>
          <span v-if="detail">{{ detail }}</span>
        </span>
      </div>
      <div class="jt__numbers">
        <span
          class="jt__pct"
          :class="{ 'jt__pct--paused': printerPaused }"
          data-tid="job-percent"
        >{{ percent }}<small>%</small></span>
        <span
          v-if="layerText"
          class="jt__layer"
        >{{ layerText }}</span>
      </div>
      <span class="ot__bar jt__bar"><i :style="{ width: `${Math.min(100, progress)}%` }" /></span>
      <div class="jt__stats">
        <div>
          <span>Elapsed</span><b data-tid="job-elapsed">{{ elapsed }}</b>
        </div>
        <div>
          <span>Remaining</span><b data-tid="job-remaining">{{ remaining }}</b>
        </div>
        <div>
          <span>Done at</span><b data-tid="job-done">{{ doneAt || '—' }}</b>
        </div>
      </div>
      <first-layer-nudges />
      <div class="jt__actions">
        <button
          type="button"
          class="cbtn cbtn--grow"
          :disabled="!controlReady"
          data-tid="job-pause"
          @click="pauseCurrent"
        >
          <frame-icon
            :name="printerPaused ? 'refresh' : 'minus'"
            small
          />{{ printerPaused ? 'Resume' : 'Pause' }}
        </button>
        <button
          type="button"
          class="cbtn cbtn--grow cbtn--danger"
          :disabled="!controlReady"
          data-tid="job-stop"
          @click="stopCurrent"
        >
          Stop print
        </button>
      </div>
    </template>
    <template v-else>
      <p class="jt__idle">
        Nothing is printing. Pick something to print again, or drop a file here.
      </p>
      <div
        v-if="recentJobs.length"
        class="jt__recent"
      >
        <div
          v-for="(job, i) in recentJobs"
          :key="job.filename"
          class="jt__job"
        >
          <span class="jt__thumb jt__thumb--small">
            <img
              v-if="job.thumbnail"
              :src="job.thumbnail"
              alt=""
            >
            <frame-icon
              v-else
              name="jobs"
            />
          </span>
          <span class="jt__text">
            <b>{{ job.name }}</b>
            <span>{{ job.facts }}</span>
          </span>
          <button
            type="button"
            class="cbtn"
            :class="{ 'cbtn--primary': i === 0 }"
            :disabled="!klippyReady || busy"
            :data-tid="`print-again-${i}`"
            @click="printAgain(job.filename)"
          >
            Print
          </button>
        </div>
      </div>
      <router-link
        class="jt__link"
        :to="pagePath('/jobs')"
      >
        All jobs
      </router-link>
    </template>

    <tile-dialog
      :value="dialog === 'live'"
      title="Live numbers"
      @close="dialog = ''"
    >
      <dl class="jt__facts">
        <div
          v-for="fact in liveFacts"
          :key="fact.label"
        >
          <dt>{{ fact.label }}</dt><dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </tile-dialog>
    <tile-dialog
      :value="dialog === 'objects'"
      title="Objects on the plate"
      @close="dialog = ''"
    >
      <objects-list />
    </tile-dialog>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { SocketActions } from '@/api/socketActions'
import { spanText, type TileMenuItem } from '@/services/overview/tiles'
import type { HistoryItem } from '@/store/history/types'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'
import ObjectsList from './ObjectsList.vue'
import FirstLayerNudges from '@/components/overview/FirstLayerNudges.vue'

/**
 * The print running now, with nothing wasted under it: the part and its
 * facts, how far, the three times, and Pause and Stop. Idle, it offers the
 * last jobs to print again. Live numbers, the plate objects, the queue and
 * history are behind the three dots.
 */
@Component({ components: { TileShell, TileDialog, ObjectsList, FirstLayerNudges } })
export default class JobTile extends Mixins(OverviewMixin) {
  dialog: '' | 'live' | 'objects' = ''

  get stateText (): string {
    if (this.printerPaused) return 'Paused'
    return this.busy ? 'Printing' : ''
  }

  get stateTone (): string { return this.printerPaused ? 'warm' : 'run' }

  get percent (): number { return Math.floor(this.progress) }

  get layerText (): string | null {
    if (this.layer && this.layers) return `Layer ${this.layer} of ${this.layers}`
    return this.layer ? `Layer ${this.layer}` : null
  }

  get elapsed (): string { return spanText(this.printStats.total_duration as number | undefined) }
  get remaining (): string { return spanText(this.secondsLeft) }

  /** "PLA · 0.4 nozzle · 0.20 mm layers", whatever the file says. */
  get detail (): string {
    const f = this.currentFile as Record<string, unknown>
    const type = Array.isArray(f.filament_type) ? f.filament_type[0] : f.filament_type
    const bits: string[] = []
    if (typeof type === 'string' && type) bits.push(type.split(';')[0])
    if (typeof f.nozzle_diameter === 'number') bits.push(`${f.nozzle_diameter} nozzle`)
    if (typeof f.layer_height === 'number') bits.push(`${f.layer_height.toFixed(2)} mm layers`)
    return bits.join(' · ')
  }

  get hasObjects (): boolean { return !!this.$store.state.printer.printer.exclude_object?.objects?.length }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = []
    if (this.busy) items.push({ id: 'live', label: 'Live numbers…', action: () => { this.dialog = 'live' } })
    if (this.hasObjects) items.push({ id: 'objects', label: 'Exclude objects…', action: () => { this.dialog = 'objects' } })
    items.push({ id: 'queue', label: `Job queue${this.queue.length ? ` (${this.queue.length})` : ''}`, to: this.pagePath('/jobs') })
    items.push({ id: 'history', label: 'Reprint from history…', to: this.pagePath('/history') })
    if (this.$store.getters['server/componentSupport']?.('timelapse')) items.push({ id: 'timelapse', label: 'Timelapse…', to: this.pagePath('/timelapse') })
    return items
  }

  get liveFacts (): Array<{ label: string, value: string }> {
    const facts = [{ label: 'Progress', value: `${this.progress.toFixed(3)}%` }]
    const printer = this.$store.state.printer.printer
    const motion = printer.motion_report ?? {}
    if (Number.isFinite(motion.live_velocity)) facts.push({ label: 'Speed now', value: `${motion.live_velocity.toFixed(2)} mm/s` })
    if (Number.isFinite(motion.live_extruder_velocity)) facts.push({ label: 'Flow now', value: `${(motion.live_extruder_velocity * Math.PI * (this.filamentDiameter / 2) ** 2).toFixed(2)} mm³/s` })
    const position = printer.toolhead?.position
    if (Array.isArray(position) && position.slice(0, 3).every(Number.isFinite)) facts.push({ label: 'Position', value: position.slice(0, 3).map((v: number, i: number) => `${'XYZ'[i]} ${v.toFixed(3)}`).join(' · ') })
    const running = printer.print_stats?.print_duration
    if (Number.isFinite(running)) facts.push({ label: 'Printing time', value: `${running.toFixed(1)} s` })
    if (typeof printer.virtual_sdcard?.file_position === 'number') facts.push({ label: 'File position', value: `${printer.virtual_sdcard.file_position} bytes` })
    facts.push({ label: 'Homed', value: this.homedAxes || 'Not reported' })
    return facts
  }

  pauseCurrent () {
    if (this.controlReady && (this.printerPrinting || this.printerPaused)) this.printerPaused ? this.resumePrint() : this.pausePrint()
  }

  async stopCurrent () {
    if (!this.controlReady || !(this.printerPrinting || this.printerPaused)) return
    const target = this.panelTarget
    const file = this.jobFile
    const duration = this.printStats.total_duration ?? 0
    const job = this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === file)?.job_id
    const ok = await this.$confirm('The print stops and cannot be picked up again. Remove it from the plate before the next print.', { title: 'Stop this print?', buttonTrueText: 'Stop print', danger: true })
    const sameJob = job === this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile)?.job_id
    if (ok && sameJob && target === this.panelTarget && file === this.jobFile && (this.printStats.total_duration ?? 0) >= duration && this.controlReady && (this.printerPrinting || this.printerPaused)) SocketActions.printerPrintCancel()
  }
}
</script>

<style lang="scss">
.jt__who { display: flex; align-items: center; gap: 14px; }
.jt__thumb { display: flex; flex: none; align-items: center; justify-content: center; width: 64px; height: 64px; overflow: hidden; border-radius: 16px; background: var(--m3d-surface-2); color: var(--m3d-accent); }
.jt__thumb img { width: 88%; height: 88%; object-fit: contain; }
.jt__thumb .frame-icon { color: var(--m3d-accent); }
.jt__thumb--small { width: 48px; height: 48px; border-radius: 14px; }
.jt__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.jt__text b { overflow: hidden; font-size: 15px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.jt__text span { overflow: hidden; color: var(--m3d-text-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.jt__numbers { display: flex; align-items: baseline; justify-content: space-between; margin-top: 4px; }
.jt__pct { color: var(--m3d-accent); font-family: var(--m3d-font-rounded); font-size: 40px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
.jt__pct small { font-size: 20px; }
.jt__pct--paused { color: var(--m3d-warning); }
.jt__layer { color: var(--m3d-text-muted); font-size: 13px; }
.jt__bar { height: 6px; }
.jt__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.jt__stats span { display: block; color: var(--m3d-text-subtle); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.jt__stats b { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.jt__actions { display: flex; gap: 8px; margin-top: 6px; }
.jt__actions .cbtn { min-height: 44px; }
.jt__idle { margin: 0; color: var(--m3d-text-muted); font-size: 13.5px; }
.jt__recent { display: flex; flex-direction: column; }
.jt__recent > * + * { border-top: 1px solid var(--m3d-border); }
.jt__job { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.jt__job .jt__text { flex: 1 1 auto; }
.jt__link { color: var(--m3d-accent) !important; font-size: 13px; text-decoration: none; }
.jt__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin: 0; }
.jt__facts dt { color: var(--m3d-text-muted); font-size: 13px; }
.jt__facts dd { margin: 0; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
