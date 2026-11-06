<template>
  <div
    class="hist"
    :class="{ 'hist--phone': isMobileViewport }"
    data-tid="history-page"
  >
    <div
      v-if="items.length"
      class="hist__bar"
    >
      <label class="hist__find">
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="query"
          type="search"
          placeholder="Find a print"
          aria-label="Find a print"
          data-tid="history-find"
        >
      </label>
      <span class="hist__grow" />
      <seg-picker
        :options="filterOptions"
        :value="filter"
        label="Show"
        @input="filter = $event"
      />
      <v-menu
        offset-y
        left
        content-class="hist__menu"
      >
        <template #activator="{ on, attrs }">
          <button
            type="button"
            class="cbtn cbtn--ghost hist__range"
            data-tid="history-range"
            aria-haspopup="menu"
            v-bind="attrs"
            v-on="on"
          >
            <frame-icon
              name="history"
              small
            />
            {{ rangeText }}
          </button>
        </template>
        <div
          class="hist__menu-list"
          role="menu"
        >
          <button
            v-for="days in rangeDays"
            :key="days"
            type="button"
            role="menuitemradio"
            :aria-checked="days === range ? 'true' : 'false'"
            :class="{ on: days === range }"
            :data-tid="`history-range-${days}`"
            @click="range = days"
          >
            {{ rangeLabel(days) }}
          </button>
        </div>
      </v-menu>
    </div>

    <dl
      v-if="items.length"
      class="hist__tiles"
      data-tid="history-totals"
    >
      <div class="hist__tile">
        <dt>Prints</dt>
        <dd>{{ rollup.prints }}</dd>
        <span>{{ range ? `in the last ${range} days` : 'all time' }}</span>
      </div>
      <div class="hist__tile">
        <dt>Success rate</dt>
        <dd v-if="rollup.successPercent !== null">
          {{ rollup.successPercent }}<small> %</small>
        </dd>
        <dd v-else>
          —
        </dd>
        <span v-if="rollup.successPercent !== null">{{ rollup.done }} done · {{ rollup.notDone }} not</span>
      </div>
      <div class="hist__tile">
        <dt>Print time</dt>
        <dd>{{ time.value }}<small> {{ time.unit }}</small></dd>
        <span v-if="rollup.prints">avg {{ longDuration(rollup.averageSeconds) }}</span>
      </div>
      <div class="hist__tile">
        <dt>Filament</dt>
        <dd>{{ weight.value }}<small> {{ weight.unit }}</small></dd>
        <span
          v-if="rollup.material"
          title="Worked out from the length of filament used"
        >
          <i
            class="hist__dot"
            :style="dotStyle(rollup.material.colour)"
          />{{ rollup.material.name }}{{ materialCount > 1 ? ' mostly' : '' }}
        </span>
      </div>
    </dl>

    <section
      v-if="!items.length"
      class="hist__tile hist__empty"
      data-tid="history-empty"
    >
      <span class="hist__empty-icon"><frame-icon name="history" /></span>
      <b>No prints yet</b>
      <p>Finished, failed and cancelled prints land here.</p>
      <router-link
        :to="pagePath('/jobs')"
        class="cbtn cbtn--primary"
      >
        Go to Jobs
      </router-link>
    </section>

    <section
      v-else-if="!rows.length"
      class="hist__tile hist__empty"
      data-tid="history-no-match"
    >
      <span class="hist__empty-icon"><frame-icon name="filter" /></span>
      <b>{{ noMatch }}</b>
      <p>{{ query ? 'Check the spelling, or try another name.' : 'Try a wider date range.' }}</p>
      <button
        type="button"
        class="cbtn"
        data-tid="history-clear-filters"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </section>

    <section
      v-else-if="!isMobileViewport"
      class="hist__tile hist__tile--flush"
    >
      <table
        class="hist__table"
        data-tid="history-table"
      >
        <thead>
          <tr>
            <th>File</th>
            <th>Result</th>
            <th>Material</th>
            <th>Duration</th>
            <th>Filament</th>
            <th>Finished</th>
            <th><span class="hist__sr">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'hist__item--gone': !row.exists }"
            :data-job="row.id"
            data-tid="history-row"
          >
            <td>
              <button
                type="button"
                class="hist__name"
                :aria-label="`Details of ${row.title}`"
                @click="detailId = row.id"
              >
                <span class="hist__thumb">
                  <img
                    v-if="row.thumbnail"
                    :src="row.thumbnail"
                    alt=""
                    loading="lazy"
                    @error="dropThumbnail(row.id)"
                  >
                  <frame-icon
                    v-else
                    name="jobs"
                    small
                  />
                </span>
                <b>{{ row.title }}</b>
              </button>
            </td>
            <td>
              <tone-pill
                :tone="row.result.tone"
                :dot="false"
                :title="row.result.detail"
              >
                {{ row.result.text }}
              </tone-pill>
            </td>
            <td>
              <template v-if="row.material">
                <i
                  class="hist__dot"
                  :style="dotStyle(row.material.colour)"
                />{{ row.material.name }}
              </template>
              <template v-else>
                —
              </template>
            </td>
            <td>{{ row.took }}</td>
            <td>{{ row.used }}</td>
            <td>{{ row.finished }}</td>
            <td class="hist__end">
              <v-menu
                offset-y
                left
                content-class="hist__menu"
              >
                <template #activator="{ on, attrs }">
                  <button
                    type="button"
                    class="hist__dots"
                    :aria-label="`More for ${row.title}`"
                    data-tid="history-row-menu"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <frame-icon
                      name="dots"
                      small
                    />
                  </button>
                </template>
                <div
                  class="hist__menu-list"
                  role="menu"
                >
                  <button
                    v-if="row.exists"
                    type="button"
                    role="menuitem"
                    :disabled="!klippyReady || busy"
                    data-tid="history-print-again"
                    @click="printAgain(row.filename)"
                  >
                    Print again
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-tid="history-details"
                    @click="detailId = row.id"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="hist__menu-danger"
                    data-tid="history-remove"
                    @click="remove(row)"
                  >
                    Remove from history
                  </button>
                </div>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div
      v-else
      class="hist__list"
      data-tid="history-list"
    >
      <button
        v-for="row in rows"
        :key="row.id"
        type="button"
        class="hist__row"
        :class="{ 'hist__item--gone': !row.exists }"
        :data-job="row.id"
        data-tid="history-row"
        @click="detailId = row.id"
      >
        <span class="hist__thumb">
          <img
            v-if="row.thumbnail"
            :src="row.thumbnail"
            alt=""
            loading="lazy"
            @error="dropThumbnail(row.id)"
          >
          <frame-icon
            v-else
            name="jobs"
            small
          />
        </span>
        <span class="hist__names">
          <b>{{ row.title }}</b>
          <span>{{ row.day }} · {{ row.took }} · {{ row.used }}</span>
        </span>
        <tone-pill
          :tone="row.result.tone"
          :dot="false"
        >
          {{ row.result.text }}
        </tone-pill>
      </button>
    </div>

    <div
      v-if="items.length"
      class="hist__foot"
    >
      <span v-if="items.length < saved">
        Showing the last {{ items.length }} of {{ saved }}.
        <button
          type="button"
          class="hist__link"
          data-tid="history-load-all"
          @click="loadAll"
        >
          Load them all
        </button>
      </span>
      <span v-if="rollup_all.total_jobs">
        All time on {{ printerName }}: {{ rollup_all.total_jobs }} prints,
        {{ duration(rollup_all.total_print_time) }}, {{ length(rollup_all.total_filament_used) }} of filament.
      </span>
      <span class="hist__grow" />
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="history-clear"
        @click="clearAll"
      >
        Clear history
      </button>
      <button
        v-if="rollup_all.total_jobs"
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="history-reset-totals"
        @click="resetTotals"
      >
        Reset the totals
      </button>
    </div>

    <v-dialog
      :value="!!detail"
      max-width="520"
      @input="detailId = null"
    >
      <div
        v-if="detail"
        class="hist__panel"
        data-tid="history-detail"
      >
        <div class="hist__panel-head">
          <span class="hist__thumb">
            <img
              v-if="detail.thumbnail"
              :src="detail.thumbnail"
              alt=""
            >
            <frame-icon
              v-else
              name="jobs"
              small
            />
          </span>
          <span class="hist__names">
            <b>{{ detail.title }}</b>
            <span>{{ detail.file }}</span>
          </span>
          <tone-pill
            :tone="detail.result.tone"
            :dot="false"
          >
            {{ detail.result.text }}
          </tone-pill>
        </div>
        <p
          v-if="detail.result.detail !== detail.result.text && detail.result.detail !== 'Done'"
          class="hist__gone"
        >
          {{ detail.result.detail }}
        </p>
        <dl class="hist__facts">
          <div
            v-for="fact in detail.facts"
            :key="fact.label"
          >
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <p
          v-if="!detail.exists"
          class="hist__gone"
        >
          The file is no longer on {{ printerName }}, so it can't print again from here.
        </p>
        <div class="hist__actions">
          <button
            v-if="detail.exists"
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!klippyReady || busy"
            data-tid="history-detail-print-again"
            @click="printAgain(detail.filename)"
          >
            Print again
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            data-tid="history-detail-remove"
            @click="remove(detail)"
          >
            Remove from history
          </button>
          <span class="hist__grow" />
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="detailId = null"
          >
            Close
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { HistoryItem } from '@/store/history/types'
import { jobTitle } from '@/services/jobs/model'
import { longDuration } from '@/services/overview/model'
import { fileFilament } from '@/services/control/model'
import {
  RANGE_DAYS, filterHistory, finishedAt, grams, historyResult, historyRollup, inRange, metres, rangeLabel, slicerFacts, tileDuration, tileWeight,
  type HistoryFilter
} from '@/services/history/model'
import getFilePaths from '@/util/get-file-paths'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import TonePill from '@/components/printers/TonePill.vue'

interface Row {
  id: string;
  filename: string;
  file: string;
  title: string;
  exists: boolean;
  result: ReturnType<typeof historyResult>;
  thumbnail: string;
  material: { name: string, colour: string | null } | null;
  took: string;
  used: string;
  finished: string;
  day: string;
  facts: Array<{ label: string, value: string }>;
}

/**
 * History: how the printer has been doing (prints, success rate, time and
 * filament over the date range), then every print as a table (rows on a
 * phone). The result and the date range filter it, a name finds one. A print's
 * ··· (or a tap on a phone) offers Print again, its details and Remove from
 * history.
 */
@Component({ components: { SegPicker, TonePill } })
export default class History extends Mixins(OverviewMixin, BrowserMixin) {
  filter: HistoryFilter = 'all'
  query = ''
  range = 30
  detailId: string | null = null

  readonly rangeDays = RANGE_DAYS
  readonly rangeLabel = rangeLabel
  readonly longDuration = longDuration

  get items (): HistoryItem[] {
    return (this.$store.getters['history/getHistory'] as HistoryItem[]) ?? []
  }

  /** How many prints Moonraker keeps, loaded or not. The totals can be reset apart from it. */
  get saved (): number {
    return Number(this.$store.state.history.count ?? 0) || this.items.length
  }

  /** The printer's own totals over its whole life (they can be reset apart from the list). */
  get rollup_all () {
    return this.$store.getters['history/getRollUp'] as { total_jobs: number, total_print_time: number, total_filament_used: number }
  }

  get ranged (): HistoryItem[] {
    return inRange(this.items, this.range)
  }

  get rollup () {
    return historyRollup(this.ranged)
  }

  get time () {
    return tileDuration(this.rollup.printSeconds)
  }

  get weight () {
    return tileWeight(this.rollup.grams)
  }

  /** More than one kind of material in the range, so "PLA mostly". */
  get materialCount (): number {
    return new Set(this.ranged.map(i => fileFilament(i.metadata as never)?.name).filter(Boolean)).size
  }

  get rangeText (): string {
    return rangeLabel(this.range)
  }

  get filterOptions (): SegOption[] {
    return [
      { value: 'all', label: 'All' },
      { value: 'finished', label: 'Done' },
      { value: 'failed', label: 'Failed' },
      { value: 'stopped', label: 'Cancelled' }
    ]
  }

  get rows (): Row[] {
    return filterHistory(this.ranged, this.filter, this.query).map(item => this.row(item))
  }

  get detail (): Row | null {
    const item = this.detailId ? this.items.find(i => i.job_id === this.detailId) : null
    return item ? this.row(item) : null
  }

  get noMatch (): string {
    if (this.query) return `No print matches "${this.query}"`
    const kind = { finished: 'done', failed: 'failed', stopped: 'cancelled', all: '' }[this.filter]
    const when = this.range ? `in the last ${this.range} days` : 'yet'
    return kind ? `No ${kind} prints ${when}` : `No prints ${when}`
  }

  row (item: HistoryItem): Row {
    const meta = item.metadata as (Record<string, unknown> & { thumbnails?: unknown[], modified?: number, filament_total?: number, size?: number }) | undefined
    const start = new Date(item.start_time * 1000)
    const end = item.end_time ? new Date(Number(item.end_time) * 1000) : null
    const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    const facts = [
      { label: 'Started', value: `${start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ${clock(start)}` },
      ...(end ? [{ label: 'Ended', value: clock(end) }] : []),
      { label: 'Printing', value: longDuration(item.print_duration) },
      { label: 'With the warm-up', value: longDuration(item.total_duration) },
      { label: 'Filament used', value: `${metres(item.filament_used)} · about ${tileWeight(grams(item.filament_used, meta as never)).value} ${tileWeight(grams(item.filament_used, meta as never)).unit}` },
      ...slicerFacts(meta),
      ...(meta?.size ? [{ label: 'File', value: `${(meta.size / 1e6).toFixed(1)} MB` }] : [])
    ]
    const finished = finishedAt(item)
    const weight = grams(item.filament_used || 0, meta as never)
    return {
      id: item.job_id,
      filename: item.filename,
      file: item.filename.split('/').pop() ?? item.filename,
      title: jobTitle(item.filename),
      exists: item.exists,
      result: historyResult(item.status, item.filament_used, meta?.filament_total),
      thumbnail: meta?.thumbnails?.length
        ? this.getThumbUrl(meta as never, 'gcodes', getFilePaths(item.filename, 'gcodes').path, false, meta.modified) || ''
        : '',
      material: fileFilament(meta),
      took: this.compact(item.print_duration),
      used: item.filament_used ? `${tileWeight(weight).value} ${tileWeight(weight).unit}` : '—',
      finished,
      day: finished.replace(/ \d\d:\d\d$/, ''),
      facts
    }
  }

  /** "38 m", "2 h 45 m", "1 h". */
  compact (seconds: number): string {
    const minutes = Math.round((seconds || 0) / 60)
    if (minutes < 60) return `${minutes} m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} h ${m} m` : `${h} h`
  }

  dotStyle (colour: string | null): Record<string, string> {
    return colour ? { background: colour } : {}
  }

  duration (seconds?: number): string {
    return seconds ? longDuration(seconds) : '—'
  }

  length (mm?: number): string {
    return mm ? metres(mm) : '—'
  }

  dropThumbnail (id: string) {
    this.$store.dispatch('history/clearHistoryThumbnails', id)
  }

  clearFilters () {
    this.filter = 'all'
    this.query = ''
    this.range = 0
  }

  async remove (row: Row) {
    const ok = await this.$confirm('The file stays on the printer, and so do the totals.', { title: `Remove ${row.title} from ${this.printerName}'s history?`, buttonTrueText: 'Remove', danger: true })
    if (!ok) return
    SocketActions.serverHistoryDeleteJob(row.id)
    if (this.detailId === row.id) this.detailId = null
  }

  loadAll () {
    SocketActions.serverHistoryList({ limit: 0 })
  }

  async clearAll () {
    const ok = await this.$confirm('The files stay, and so do the totals.', { title: `Remove all ${this.items.length} prints from ${this.printerName}'s history?`, buttonTrueText: 'Clear history', danger: true })
    if (ok) SocketActions.serverHistoryDeleteJob('all')
  }

  async resetTotals () {
    const ok = await this.$confirm('The prints listed here stay.', { title: `Set ${this.printerName}'s totals back to zero?`, buttonTrueText: 'Reset the totals', danger: true })
    if (ok) SocketActions.serverHistoryResetTotals()
  }
}
</script>

<style lang="scss" scoped>
  .hist {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .hist__bar,
  .hist__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .hist__foot {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .hist__grow {
    flex: 1 1 auto;
  }

  .hist__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .hist__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 240px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }

    input:focus-visible {
      outline: none;
    }

    &:focus-within {
      box-shadow: 0 0 0 2px var(--m3d-accent);
    }
  }

  .hist__range {
    gap: 8px;
  }

  .hist__tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin: 0;
  }

  .hist__tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    dd {
      margin: 4px 0 0;
      font-size: 30px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.15;

      small {
        color: var(--m3d-text-muted);
        font-size: 14px;
        font-weight: 500;
      }
    }

    > span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .hist__tile--flush {
    padding: 0;
    overflow: hidden;
  }

  .hist__dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    margin-right: 6px;
    border-radius: 50%;
    background: #f2f2f2;
    box-shadow: 0 0 0 1px var(--m3d-border);
  }

  .hist__empty {
    align-items: center;
    gap: 8px;
    padding: 40px 18px;
    text-align: center;

    b {
      font-size: 16px;
    }

    p {
      margin: 0 0 8px;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .hist__empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 4px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .hist__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th {
      padding: 14px 12px;
      color: var(--m3d-text-subtle);
      font-size: 12px;
      font-weight: 600;
      text-align: left;
    }

    td {
      height: 62px;
      padding: 0 12px;
      border-top: 1px solid var(--m3d-border);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    th:first-child,
    td:first-child {
      padding-left: 18px;
    }

    tbody tr:hover {
      background: var(--m3d-hover, rgba(255, 255, 255, 0.03));
    }
  }

  .hist__name {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 380px;
    color: var(--m3d-text);
    text-align: left;

    b {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
    }
  }

  .hist__end {
    width: 48px;
    text-align: right;
  }

  .hist__dots {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }

  .hist__thumb {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: 10px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);
    color: var(--m3d-text-subtle);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }

  .hist__list {
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);

    > .hist__row + .hist__row {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .hist__row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 62px;
    padding: 10px 14px;
    color: var(--m3d-text);
    text-align: left;
  }

  .hist__names {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;

    b,
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      font-size: 15px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .hist__item--gone .hist__names b,
  .hist__item--gone .hist__name b {
    color: var(--m3d-text-muted);
  }

  .hist__panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
    border: 1px solid var(--m3d-border);
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .hist__panel-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hist__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
    }

    dd {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .hist__gone {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .hist__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hist__link {
    color: var(--m3d-accent);
    font-weight: 600;
  }

  @media (max-width: 1100px) {
    .hist__tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .hist--phone {
    .hist__bar {
      > .hist__grow {
        display: none;
      }
    }

    .hist__find {
      flex: 1 1 100%;
      width: auto;
    }

    .hist__tiles {
      gap: 12px;
    }
  }
</style>

<style lang="scss">
  .hist__menu {
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
    background: var(--m3d-surface) !important;
  }

  .hist__menu-list {
    display: flex;
    flex-direction: column;
    min-width: 180px;
    padding: 6px;

    button {
      padding: 10px 12px;
      border-radius: 10px;
      color: var(--m3d-text);
      font-size: 14px;
      text-align: left;

      &:hover:not(:disabled),
      &.on {
        background: var(--m3d-surface-2);
      }

      &:disabled {
        opacity: 0.45;
      }
    }

    .hist__menu-danger {
      color: var(--m3d-danger, #ff6b6b);
    }
  }
</style>
