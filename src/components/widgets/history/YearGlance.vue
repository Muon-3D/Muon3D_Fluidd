<template>
  <section
    class="yr"
    :class="{ 'yr--enter': enter }"
    aria-labelledby="yr-title"
    data-tid="year-glance"
  >
    <header class="yr__head">
      <h2
        id="yr-title"
        class="yr__title"
      >
        Your year of printing
      </h2>
      <seg-picker
        v-if="status === 'ready'"
        :options="metricOptions"
        :value="metric"
        label="Show"
        data-tid="year-metric"
        @input="metric = $event"
      />
    </header>

    <p
      v-if="status === 'idle' || status === 'loading'"
      class="yr__state"
      role="status"
      aria-busy="true"
      data-tid="year-loading"
    >
      Loading your year of printing…
    </p>

    <div
      v-else-if="status === 'error'"
      class="yr__state"
      role="alert"
      data-tid="year-error"
    >
      <p>Couldn't load your year of printing from the printer.</p>
      <button
        type="button"
        class="cbtn"
        data-tid="year-retry"
        @click="retry"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="!jobs.length"
      class="yr__state"
      data-tid="year-empty"
    >
      <p>No prints in the last year yet.</p>
      <button
        type="button"
        class="cbtn"
        data-tid="year-retry"
        @click="retry"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <dl
        class="yr__stats"
        data-tid="year-summary"
      >
        <div>
          <dt>Prints</dt>
          <dd data-tid="year-prints">
            {{ totals.prints }}
          </dd>
        </div>
        <div>
          <dt>Printing</dt>
          <dd data-tid="year-hours">
            {{ hoursText }}
          </dd>
        </div>
        <div>
          <dt>Filament</dt>
          <dd data-tid="year-filament">
            {{ gramsText }}
          </dd>
        </div>
        <div>
          <dt>Longest streak</dt>
          <dd data-tid="year-longest">
            {{ dayCount(totals.longestStreak) }}
          </dd>
        </div>
        <div>
          <dt>Current streak</dt>
          <dd data-tid="year-current">
            {{ dayCount(totals.currentStreak) }}
          </dd>
        </div>
      </dl>

      <div class="yr__body">
        <div class="yr__grid">
          <div
            ref="scroller"
            class="yr__scroller"
          >
            <div
              class="yr__heat"
              role="grid"
              aria-label="Printing by day over the last year. Arrow keys move between days, Enter shows a day."
              :aria-rowcount="7"
              :aria-colcount="year.weeks"
              :style="{ '--weeks': year.weeks }"
              data-tid="year-grid"
              @keydown="onKey"
            >
              <div
                class="yr__months"
                aria-hidden="true"
              >
                <span
                  v-for="m in months"
                  :key="m.week"
                  :style="{ gridColumn: m.week + 2 }"
                >{{ m.text }}</span>
              </div>
              <div
                v-for="(row, r) in rows"
                :key="r"
                class="yr__row"
                role="row"
                :aria-rowindex="r + 1"
              >
                <span
                  class="yr__dow"
                  aria-hidden="true"
                >{{ weekdayName(r) }}</span>
                <template v-for="(day, w) in row">
                  <div
                    v-if="day"
                    :key="day.index"
                    role="gridcell"
                    class="yr__cell"
                    :class="[`lv${level(day)}`, { 'yr__cell--today': day.index === year.days.length - 1, 'yr__cell--sel': day.index === selected }]"
                    :style="{ '--w': w }"
                    :data-index="day.index"
                    :data-date="day.key"
                    :data-level="level(day)"
                    :aria-colindex="w + 1"
                    :aria-selected="day.index === selected ? 'true' : 'false'"
                    :aria-label="label(day)"
                    :title="label(day)"
                    :tabindex="day.index === focusIndex ? 0 : -1"
                    data-tid="year-day-cell"
                    @click="choose(day.index)"
                    @focus="focusIndex = day.index"
                  />
                  <span
                    v-else
                    :key="`gap-${w}`"
                    class="yr__gap"
                    aria-hidden="true"
                  />
                </template>
              </div>
            </div>
          </div>
          <div class="yr__foot">
            <span
              class="yr__legend"
              aria-hidden="true"
            >
              Less <i /><i class="lv1" /><i class="lv2" /><i class="lv3" /><i class="lv4" /> More
            </span>
            <span
              class="yr__zone"
              data-tid="year-zone"
            >Finished prints only; hours are printing time. Days follow this device's time zone ({{ year.timeZone }}).<template v-if="truncated"> Showing the latest {{ limit }} prints.</template></span>
          </div>
        </div>

        <figure class="yr__ring">
          <svg
            viewBox="-170 -170 340 340"
            aria-hidden="true"
            data-tid="year-ring"
          >
            <circle
              r="160"
              class="yr__ring-edge"
            />
            <path
              v-for="day in year.days"
              :key="day.index"
              class="yr__sector"
              :class="`lv${level(day)}`"
              :d="spoolPath(day)"
            >
              <title>{{ label(day) }}</title>
            </path>
            <circle
              r="56"
              class="yr__hub"
            />
            <text
              y="-7"
              class="yr__ring-big"
              data-tid="year-ring-total"
            >{{ ring.big }}</text>
            <text
              y="15"
              class="yr__ring-sub"
            >{{ ring.sub }}</text>
          </svg>
          <figcaption
            class="yr__sr"
            data-tid="year-ring-text"
          >
            {{ ringLabel }}
          </figcaption>
        </figure>
      </div>

      <div
        class="yr__day"
        aria-live="polite"
        data-tid="year-day"
      >
        <template v-if="chosen">
          <b class="yr__day-title">{{ dayText(chosen.date) }}</b>
          <p
            v-if="!chosen.prints.length"
            class="yr__none"
          >
            Nothing printed.
          </p>
          <ul v-else>
            <li
              v-for="p in chosen.prints"
              :key="p.id"
            >
              <span class="yr__day-name">{{ title(p.filename) }}</span>
              <span
                v-if="p.finished"
                class="yr__day-num"
              >{{ formatHours(p.hours) }} · {{ formatGrams(p.grams) }}</span>
              <span
                v-else
                class="yr__day-note"
              >Not finished, not counted</span>
            </li>
          </ul>
        </template>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { HistoryItem } from '@/store/history/types'
import { jobTitle } from '@/services/jobs/model'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import {
  YEAR_LIMIT, YEAR_METRICS, buildYear, dayKey, dayLabelText, dayText, formatGrams, formatHours, level, monthLabels, moveCell, ringText, spoolPath, yearTotals,
  type YearDay, type YearMetric
} from '@/services/history/year'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * The year at a glance and the spool (design-lab A and C), behind the
 * VITE_CONTROL_YEAR_SPOOL flag: a grid of days and a ring of the same year,
 * one Hours / Prints / Filament choice for both. The last year's jobs are
 * asked for once, when the socket is up, into history/yearJobs; days are the
 * device's local days (services/history/year).
 */
@Component({ components: { SegPicker } })
export default class YearGlance extends Mixins(StateMixin) {
  metric: YearMetric = 'hours'
  selected = -1
  focusIndex = -1
  enter = true
  now = new Date()
  readonly limit = YEAR_LIMIT

  readonly metricOptions: SegOption[] = YEAR_METRICS.map(m => ({ value: m.value, label: m.label }))
  readonly formatHours = formatHours
  readonly formatGrams = formatGrams
  readonly dayText = dayText

  /** The year's jobs, as the printer sent them: never the 50 the list holds. */
  get jobs (): HistoryItem[] {
    return this.$store.getters['history/getYearJobs'] as HistoryItem[]
  }

  get status (): 'idle' | 'loading' | 'ready' | 'error' {
    return (this.$store.getters['history/getYear'] as { status: 'idle' | 'loading' | 'ready' | 'error' }).status
  }

  /** The printer says it has more than it sent. */
  get truncated (): boolean {
    return (this.$store.getters['history/getYear'] as { count: number }).count > YEAR_LIMIT
  }

  get year () {
    return buildYear(this.jobs, this.now)
  }

  get totals () {
    return yearTotals(this.year.days)
  }

  get months () {
    return monthLabels(this.year.days)
  }

  /** The grid by rows (Monday to Sunday), a null where the year has no day (before the first, after today). */
  get rows (): Array<Array<YearDay | null>> {
    const { days, weeks } = this.year
    return Array.from({ length: 7 }, (_, r) => Array.from({ length: weeks }, (__, w) => days[w * 7 + r] ?? null))
  }

  get chosen (): YearDay | null {
    return this.year.days[this.selected] ?? null
  }

  get hoursText (): string {
    return formatHours(this.totals.hours)
  }

  get gramsText (): string {
    return formatGrams(this.totals.grams)
  }

  get ring () {
    return ringText(this.totals, this.metric)
  }

  get ringLabel (): string {
    const t = this.totals
    const what = this.metric === 'hours' ? `${this.hoursText} of printing` : this.metric === 'prints' ? `${t.prints} finished prints` : `${this.gramsText} of filament`
    return `The spool: ${what} in the last year, from finished prints. Each turn of the ring is a week, each band a weekday; brighter is more ${this.metric === 'hours' ? 'hours' : this.metric === 'prints' ? 'prints' : 'filament'}.`
  }

  level (day: YearDay) {
    return level(day, this.metric)
  }

  label (day: YearDay): string {
    return dayLabelText(day)
  }

  spoolPath (day: YearDay): string {
    return spoolPath(day, this.year.weeks)
  }

  weekdayName (r: number): string {
    return r % 2 === 0 ? WEEKDAYS[r] : ''
  }

  title (filename: string): string {
    return jobTitle(filename)
  }

  dayCount (n: number): string {
    return `${n} day${n === 1 ? '' : 's'}`
  }

  created () {
    const last = this.year.days.length - 1
    this.selected = last
    this.focusIndex = last
  }

  mounted () {
    document.addEventListener('visibilitychange', this.syncDay)
    this.syncDay()
    this.scrollToToday()
  }

  beforeDestroy () {
    document.removeEventListener('visibilitychange', this.syncDay)
  }

  /**
   * Ask for the year once the socket is up. The store asks once per day and
   * store lifetime (and again when a print finishes), not on every visit.
   */
  @Watch('apiConnected', { immediate: true })
  onConnected (connected: boolean) {
    if (connected) this.$store.dispatch('history/loadYear')
  }

  retry () {
    this.$store.dispatch('history/loadYear', { force: true })
  }

  /** The date rolled over while this was open: move today, and ask again. No timer; a tab coming back checks. */
  syncDay () {
    if (document.hidden || dayKey(new Date()) === dayKey(this.now)) return
    this.now = new Date()
    this.choose(this.year.days.length - 1)
    if (this.apiConnected) this.$store.dispatch('history/loadYear')
  }

  /** Today is at the right end; on a narrow screen the grid scrolls, so start there. */
  @Watch('status')
  scrollToToday () {
    this.$nextTick(() => {
      const scroller = this.$refs.scroller as HTMLElement | undefined
      if (scroller) scroller.scrollLeft = scroller.scrollWidth
    })
  }

  choose (index: number) {
    this.selected = index
    this.focusIndex = index
  }

  onKey (event: KeyboardEvent) {
    const count = this.year.days.length
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.choose(this.focusIndex)
      return
    }
    const next = moveCell(this.focusIndex, event.key, count, event.ctrlKey)
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
    event.preventDefault()
    this.focusIndex = next
    this.$nextTick(() => {
      const cell = this.$el.querySelector<HTMLElement>(`[data-index="${next}"]`)
      cell?.focus()
    })
  }
}
</script>

<style lang="scss" scoped>
  .yr {
    --yr-l1: color-mix(in srgb, var(--m3d-accent) 28%, var(--m3d-surface-2));
    --yr-l2: color-mix(in srgb, var(--m3d-accent) 52%, var(--m3d-surface-2));
    --yr-l3: color-mix(in srgb, var(--m3d-accent) 78%, var(--m3d-surface-2));
    --yr-l4: var(--m3d-accent);

    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .yr__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .yr__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .yr__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    margin: 0;

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    dd {
      margin: 2px 0 0;
      font-size: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  .yr__state {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 0;
    padding: 24px 0;
    color: var(--m3d-text-muted);
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  .yr__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 24px;
    align-items: start;
  }

  .yr__grid {
    min-width: 0;
  }

  // Room round the cells, so the today ring and the focus ring are not clipped by the scroll box.
  .yr__scroller {
    overflow-x: auto;
    padding: 4px 4px 4px 0;
  }

  .yr__heat {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: calc(28px + var(--weeks) * 13px);
  }

  .yr__months,
  .yr__row {
    display: grid;
    grid-template-columns: 28px repeat(var(--weeks), minmax(0, 1fr));
    gap: 3px;
  }

  .yr__months {
    height: 16px;
    color: var(--m3d-text-muted);
    font-size: 11px;

    span {
      grid-row: 1;
      white-space: nowrap;
    }
  }

  // The weekday names stay put while the grid scrolls under them; contain: size
  // keeps a label from making its row taller than the cells.
  .yr__dow {
    position: sticky;
    left: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    align-self: stretch;
    contain: size;
    background: var(--m3d-surface);
    white-space: nowrap;
    color: var(--m3d-text-subtle);
    font-size: 10px;
  }

  .yr__gap {
    aspect-ratio: 1;
  }

  .yr__cell {
    aspect-ratio: 1;
    border-radius: 22%;
    background: var(--m3d-surface-2);
    outline: 1.5px solid transparent;
    outline-offset: 1px;
    cursor: pointer;
    transition: background-color var(--m3d-motion-fast) var(--m3d-ease);
  }

  .yr__cell:focus-visible {
    outline: 2px solid var(--m3d-text);
    outline-offset: 2px;
  }

  .yr__cell--sel {
    outline-color: var(--m3d-text-muted);
  }

  .yr__cell--today {
    box-shadow: 0 0 0 1.5px var(--m3d-surface), 0 0 0 3px var(--m3d-warning);
  }

  .lv1 { background: var(--yr-l1); }
  .lv2 { background: var(--yr-l2); }
  .lv3 { background: var(--yr-l3); }
  .lv4 { background: var(--yr-l4); }

  .yr__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 16px;
    margin-top: 8px;
    color: var(--m3d-text-muted);
    font-size: 11px;
  }

  .yr__legend {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    i {
      display: inline-block;
      width: 11px;
      height: 11px;
      border-radius: 3px;
    }

    i:not([class]) {
      background: var(--m3d-surface-2);
    }
  }

  .yr__ring {
    margin: 0;

    svg {
      display: block;
      width: 100%;
      max-width: 300px;
      height: auto;
      margin: 0 auto;
      overflow: visible;
    }
  }

  .yr__ring-edge {
    fill: none;
    stroke: var(--m3d-border);
  }

  .yr__hub {
    fill: var(--m3d-surface);
    stroke: var(--m3d-border);
  }

  .yr__sector {
    fill: var(--m3d-surface-2);
    transition: fill var(--m3d-motion-fast) var(--m3d-ease);

    &.lv1 { fill: var(--yr-l1); }
    &.lv2 { fill: var(--yr-l2); }
    &.lv3 { fill: var(--yr-l3); }
    &.lv4 { fill: var(--yr-l4); }
  }

  .yr__ring-big,
  .yr__ring-sub {
    text-anchor: middle;
    dominant-baseline: central;
    font-family: inherit;
  }

  .yr__ring-big {
    fill: var(--m3d-text);
    font-size: 24px;
    font-weight: 700;
  }

  .yr__ring-sub {
    fill: var(--m3d-text-muted);
    font-size: 10px;
  }

  .yr__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .yr__day {
    min-height: 44px;
    padding: 8px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    font-size: 13px;

    ul {
      margin: 4px 0 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 6px 0;
      border-top: 1px solid var(--m3d-border);
    }

    li:first-child {
      border-top: 0;
    }
  }

  .yr__day-title {
    font-size: 13px;
  }

  .yr__none {
    margin: 4px 0 0;
    color: var(--m3d-text-muted);
  }

  .yr__day-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .yr__day-note,
  .yr__day-num {
    flex: none;
    color: var(--m3d-text-muted);
  }

  .yr__day-num {
    font-variant-numeric: tabular-nums;
  }

  // Cells fade in once, left to right, then stay still.
  @keyframes yr-cell-in {
    from { opacity: 0; transform: scale(0.6); }
    to { opacity: 1; transform: none; }
  }

  .yr--enter .yr__cell {
    animation: yr-cell-in var(--m3d-motion-slow) var(--m3d-ease-enter) both;
    animation-delay: calc(var(--w) * var(--m3d-motion-stagger) / 5);
  }

  @media (max-width: 900px) {
    .yr__body {
      grid-template-columns: minmax(0, 1fr);
    }

    .yr__ring svg {
      max-width: 280px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .yr--enter .yr__cell {
      animation: none;
    }

    .yr__cell,
    .yr__sector {
      transition: none;
    }
  }
</style>
