<template>
  <div
    class="lg"
    data-tid="admin-section-logs"
  >
    <header class="lg__head">
      <h1 class="lg__title">
        Logs
      </h1>
      <p class="lg__sub">
        Loki, 14 days kept (nginx access 7 days). E-mail and IP addresses are redacted at source.
      </p>
    </header>

    <form
      ref="filters"
      class="lg__filters"
      @submit.prevent="apply"
    >
      <details class="lg__multi">
        <summary>Service{{ services.length ? ` (${services.length})` : '' }}</summary>
        <label
          v-for="s in serviceList"
          :key="s"
        ><input
          type="checkbox"
          :checked="services.includes(s)"
          :data-tid="`admin-service-${s}`"
          @change="toggle('service', s)"
        >{{ s }}</label>
      </details>
      <fieldset class="lg__levels">
        <legend class="sr">
          Level
        </legend>
        <label
          v-for="l in levelList"
          :key="l"
        ><input
          type="checkbox"
          :checked="levels.includes(l)"
          :data-tid="`admin-level-${l}`"
          @change="toggle('level', l)"
        >{{ l }}</label>
      </fieldset>
      <label class="lg__field">Source
        <select
          :value="source"
          data-tid="admin-source"
          @change="set({ source: $event.target.value })"
        >
          <option value="">any</option>
          <option
            v-for="s in sourceList"
            :key="s"
            :value="s"
          >{{ s }}</option>
        </select>
      </label>
      <label class="lg__field">Vhost
        <select
          :value="vhost"
          :disabled="!nginxSource"
          data-tid="admin-vhost"
          @change="set({ vhost: $event.target.value })"
        >
          <option value="">any</option>
          <option
            v-for="v in vhosts"
            :key="v"
            :value="v"
          >{{ v }}</option>
        </select>
      </label>
      <label class="lg__field lg__field--grow">Search text
        <input
          v-model="draftQ"
          type="text"
          maxlength="200"
          data-tid="admin-q"
          autocomplete="off"
        >
      </label>
      <label class="lg__field lg__field--grow">Request id
        <input
          v-model="draftRid"
          type="text"
          maxlength="200"
          data-tid="admin-rid"
          autocomplete="off"
        >
      </label>
      <button
        type="submit"
        class="lg__btn"
        data-tid="admin-search"
      >
        Search
      </button>
      <button
        type="button"
        class="lg__btn"
        :aria-pressed="tail"
        data-tid="admin-tail"
        @click="set({ tail: tail ? '' : '1' })"
      >
        Live tail: {{ tail ? 'on' : 'off' }}
      </button>
    </form>

    <section
      v-if="state === 'missing' || state === 'failed'"
      class="lg__block"
      role="alert"
      data-tid="admin-data-error"
    >
      <b>{{ state === 'missing' ? 'Logs are not available yet' : 'The admin data service did not answer.' }}</b>
      <span>{{ state === 'missing' ? 'The admin data endpoints are not available on this console yet.' : 'Loki did not answer.' }}</span>
      <button
        type="button"
        class="lg__btn"
        @click="fetchLines"
      >
        Retry
      </button>
    </section>
    <template v-else>
      <section
        v-if="histogramSeries.length"
        class="lg__panel"
      >
        <h3>Lines by level <span class="lg__unit">lines</span></h3>
        <admin-chart
          id="lg-hist"
          kind="stacked_bar"
          :series="histogramSeries"
          unit="lines"
          label="Lines by level, lines"
        />
      </section>

      <section class="lg__panel">
        <button
          v-if="pending.length"
          type="button"
          class="lg__new"
          data-tid="admin-new-lines"
          @click="showPending"
        >
          {{ pending.length }} new lines
        </button>
        <div
          ref="list"
          class="lg__list"
          role="list"
          aria-label="Log lines"
          @scroll.passive="onScroll"
        >
          <p
            v-if="state === 'loading'"
            class="lg__none"
          >
            Loading…
          </p>
          <p
            v-else-if="!lines.length"
            class="lg__none"
            data-tid="admin-no-lines"
          >
            No lines match. Widen the range or clear a filter.
          </p>
          <div
            v-for="l in lines"
            :key="l.key"
            class="lg__row"
            role="listitem"
          >
            <button
              type="button"
              class="lg__line"
              :aria-expanded="open === l.key"
              :data-tid="`admin-line`"
              @click="open = open === l.key ? '' : l.key"
            >
              <span class="mono lg__time">{{ time(l.ts_ns) }}</span>
              <span
                class="lg__level"
                :class="`lg__level--${l.level}`"
              >{{ l.level }}</span>
              <span class="lg__svc">{{ l.service }}</span>
              <span class="lg__msg">{{ l.message }}</span>
            </button>
            <div
              v-if="open === l.key"
              class="lg__detail"
              data-tid="admin-line-fields"
            >
              <p class="lg__svc-phone">
                {{ l.service }} · {{ l.source }}{{ l.vhost ? ` · ${l.vhost}` : '' }}
              </p>
              <dl>
                <template v-for="(v, k) in l.fields">
                  <dt
                    :key="'k' + k"
                    class="mono"
                  >
                    {{ k }}
                  </dt>
                  <dd
                    :key="'v' + k"
                    class="mono"
                  >
                    {{ String(v) }}
                  </dd>
                </template>
              </dl>
              <button
                type="button"
                class="lg__btn"
                @click="copy(l)"
              >
                Copy line
              </button>
              <button
                type="button"
                class="lg__btn"
                data-tid="admin-find-request"
                :disabled="!l.fields.request_id"
                @click="findRequest(l)"
              >
                Find this request
              </button>
            </div>
          </div>
        </div>
        <p
          v-if="dropped > 0"
          class="lg__foot"
        >
          {{ dropped }} lines were dropped at the source in this range.
        </p>
        <p
          class="lg__foot"
          data-tid="admin-foot"
        >
          Showing {{ lines.length }} lines. Tail updates every 5 s.
          <button
            v-if="nextBefore && !tail"
            type="button"
            class="lg__btn"
            data-tid="admin-load-older"
            @click="older"
          >
            Load older
          </button>
        </p>
      </section>
    </template>
    <admin-section-view
      section="logs"
      :skip="realPanels"
      bare
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AdminChart from './AdminChart.vue'
import AdminSectionView from './AdminSectionView.vue'
import { LOG_LEVELS, LOG_SERVICES, LOG_SOURCES, obs, obsFailure, type LogLine, type LogsRequest, type Series } from '@/services/admin/obs'
import { portal, noteFailure } from '@/services/admin/session'
import { listOf, paramOf, rangeOf, setQuery } from './query'

const VHOSTS = ['app.muon3d.com', 'control.muon3d.com', 'relay.muon3d.com', 'models.muon3d.com', 'library.muon3d.com', 'bench.muon3d.com', 'slicer.muon3d.com', 'launch.muon3d.com', 'muon3d.com', 'www.muon3d.com', 'other']
const DEFAULT_LEVELS = ['error', 'warn', 'info']
const PAGE = 200
const TAIL_MS = 5000

interface Row extends LogLine { key: string }

const compare = (a: string, b: string): number => (a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0)

/**
 * Logs (spec 5.3): filters in the URL, a list that expands to its parsed fields, a
 * live tail that polls every 5 s as a background call (it never counts as activity),
 * and "N new lines" instead of moving a list the person has scrolled.
 */
export default defineComponent({
  components: { AdminChart, AdminSectionView },
  data () {
    return { lines: [] as Row[], pending: [] as Row[], histogram: [] as Array<{ t: number; level: string; n: number }>, nextBefore: '', dropped: 0, open: '', state: 'loading' as 'loading' | 'ok' | 'missing' | 'failed', draftQ: '', draftRid: '', timer: 0, serial: 0, serviceList: LOG_SERVICES, levelList: LOG_LEVELS, sourceList: LOG_SOURCES, vhosts: VHOSTS, realPanels: ['lg-hist', 'lg-list', 'lg-rid', 'lg-codes', 'lg-dropped'] }
  },
  computed: {
    services (): string[] { return listOf(this.$route, 'service') },
    levels (): string[] { return this.$route.query.level === undefined ? DEFAULT_LEVELS : listOf(this.$route, 'level').filter(l => l !== 'none') },
    source (): string { return paramOf(this.$route, 'source') },
    vhost (): string { return paramOf(this.$route, 'vhost') },
    q (): string { return paramOf(this.$route, 'q') },
    rid (): string { return paramOf(this.$route, 'rid') },
    tail (): boolean { return paramOf(this.$route, 'tail') === '1' },
    nginxSource (): boolean { return this.source.startsWith('nginx') },
    filterKey (): string { return JSON.stringify([this.services, this.levels, this.source, this.vhost, this.q, this.rid, rangeOf(this.$route)]) },
    histogramSeries (): Series[] {
      const by = new Map<string, Array<[number, number]>>()
      for (const h of this.histogram) by.set(h.level, [...(by.get(h.level) ?? []), [h.t, h.n]])
      return ['info', 'warn', 'error'].filter(l => by.has(l)).map(l => ({ labels: { level: l }, points: by.get(l)! }))
    }
  },
  watch: {
    filterKey () { this.open = ''; this.fetchLines() },
    tail () { this.schedule() },
    'portal.epoch' () { this.fetchLines() }
  },
  mounted () {
    this.draftQ = this.q; this.draftRid = this.rid
    this.fetchLines()
    this.schedule()
  },
  beforeDestroy () { window.clearInterval(this.timer); this.serial++ },
  methods: {
    request (extra: Partial<LogsRequest> = {}): LogsRequest {
      return {
        service: this.services.length ? this.services : undefined, level: this.levels, source: this.source || undefined, vhost: this.vhost || undefined,
        q: this.q || undefined, rid: this.rid || undefined, range: rangeOf(this.$route), limit: PAGE, ...extra
      }
    },
    set (patch: Record<string, string>) { setQuery(this.$router, this.$route, patch) },
    toggle (name: 'service' | 'level', value: string) {
      const current = name === 'service' ? this.services : this.levels
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      this.set({ [name]: name === 'level' && !next.length ? 'none' : next.join(',') })
    },
    apply () { this.set({ q: this.draftQ.trim(), rid: this.draftRid.trim() }) },
    time (ns: string): string {
      const d = new Date(Number(ns.slice(0, -6)))
      return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, '0')}`
    },
    key (l: LogLine, i: number): string { return `${l.ts_ns}:${l.service}:${i}` },
    arrange (rows: Row[]): Row[] { return rows.sort((a, b) => (this.rid ? compare(a.ts_ns, b.ts_ns) : compare(b.ts_ns, a.ts_ns))) },
    async fetchLines () {
      if (portal.phase !== 'open') return
      const serial = ++this.serial
      this.state = this.lines.length ? this.state : 'loading'
      try {
        const answer = await obs.logs(this.request())
        if (serial !== this.serial) return
        this.lines = this.arrange(answer.lines.map((l, i) => ({ ...l, key: this.key(l, i) })))
        this.pending = []; this.histogram = answer.histogram ?? []; this.nextBefore = answer.next_before_ns ?? ''; this.dropped = answer.dropped ?? 0
        this.state = 'ok'
      } catch (error) {
        if (serial !== this.serial || noteFailure(error)) return
        this.state = obsFailure(error).missing ? 'missing' : 'failed'
      }
    },
    async older () {
      if (!this.nextBefore) return
      try {
        const answer = await obs.logs(this.request({ end: Math.floor(Number(this.nextBefore.slice(0, -9))) }))
        const known = new Set(this.lines.map(l => l.key))
        const more = answer.lines.map((l, i) => ({ ...l, key: this.key(l, this.lines.length + i) })).filter(l => !known.has(l.key))
        this.lines = this.arrange([...this.lines, ...more]); this.nextBefore = answer.next_before_ns ?? ''
      } catch (error) { noteFailure(error) }
    },
    schedule () {
      window.clearInterval(this.timer)
      if (this.tail) this.timer = window.setInterval(() => { this.poll() }, TAIL_MS)
    },
    typing (): boolean {
      const el = document.activeElement as HTMLElement | null
      return !!el && el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text' && !!(this.$refs.filters as HTMLElement | undefined)?.contains(el)
    },
    async poll () {
      if (portal.phase !== 'open' || document.visibilityState !== 'visible' || this.typing() || this.state !== 'ok') return
      const newest = [...this.lines, ...this.pending].reduce((m, l) => (compare(l.ts_ns, m) > 0 ? l.ts_ns : m), '0')
      try {
        const answer = await obs.logs(this.request({ after_ns: newest, limit: 500 }), true)
        const fresh = answer.lines.filter(l => compare(l.ts_ns, newest) > 0).map((l, i) => ({ ...l, key: this.key(l, Date.now() + i) }))
        if (!fresh.length) return
        const list = this.$refs.list as HTMLElement | undefined
        if (list && list.scrollTop > 0) this.pending = this.arrange([...fresh, ...this.pending])
        else this.lines = this.arrange([...fresh, ...this.lines])
      } catch (error) { noteFailure(error) }
    },
    showPending () { this.lines = this.arrange([...this.pending, ...this.lines]); this.pending = []; const list = this.$refs.list as HTMLElement | undefined; if (list) list.scrollTop = 0 },
    onScroll () { const list = this.$refs.list as HTMLElement; if (list.scrollTop === 0 && this.pending.length) this.showPending() },
    findRequest (l: Row) { this.draftRid = String(l.fields.request_id ?? ''); this.set({ rid: this.draftRid }) },
    async copy (l: Row) { try { await navigator.clipboard.writeText(`${this.time(l.ts_ns)} ${l.level} ${l.service} ${l.message}`) } catch { /* no clipboard */ } }
  }
})
</script>

<style lang="scss" scoped>
.mono { font-family: var(--m3d-font-mono); font-variant-numeric: tabular-nums; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.lg__head { margin-bottom: 12px; }
.lg__title { margin: 0; font-family: var(--m3d-font-display); font-size: 18px; font-weight: 400; }
.lg__sub { margin: 4px 0 0; font-size: 13px; color: var(--m3d-text-muted); }
.lg__filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 12px; margin-bottom: 12px; padding: 12px 14px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); font-size: 12px; }
.lg__multi { position: relative; summary { min-height: 32px; display: flex; align-items: center; cursor: pointer; } label { display: block; padding: 4px 0; } }
.lg__levels { display: flex; gap: 10px; border: 0; padding: 0; margin: 0; label { display: flex; align-items: center; gap: 4px; min-height: 32px; } }
.lg__field { display: flex; flex-direction: column; gap: 4px; color: var(--m3d-text-muted); input, select { min-height: 32px; padding: 0 8px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: var(--m3d-bg); color: var(--m3d-text); font: inherit; } }
.lg__field--grow { flex: 1 1 160px; }
.lg__btn { min-height: 32px; padding: 0 12px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: transparent; color: var(--m3d-text); font: inherit; font-size: 12px; cursor: pointer; }
.lg__btn[aria-pressed='true'] { background: var(--m3d-accent-soft); font-weight: 600; }
.lg__panel { position: relative; margin-bottom: 12px; padding: 12px 14px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; } }
.lg__unit { font-size: 12px; font-weight: 400; color: var(--m3d-text-subtle); }
.lg__block { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 16px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); font-size: 13px; }
.lg__list { max-height: 520px; overflow: auto; }
.lg__none { margin: 12px 0; font-size: 12px; color: var(--m3d-text-subtle); text-align: center; }
.lg__line { display: grid; grid-template-columns: 96px 52px 120px minmax(0, 1fr); gap: 10px; width: 100%; min-height: 32px; padding: 4px 6px; border: 0; border-bottom: 1px solid var(--m3d-border); background: transparent; color: var(--m3d-text); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
.lg__msg { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.lg__svc { color: var(--m3d-text-muted); overflow: hidden; text-overflow: ellipsis; }
.lg__level { color: var(--m3d-text-muted); } .lg__level--error { color: var(--m3d-danger); } .lg__level--warn { color: var(--m3d-warning); }
.lg__detail { padding: 8px 10px 12px; background: var(--m3d-surface-2); dl { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 4px 12px; font-size: 12px; } dd { margin: 0; overflow-wrap: anywhere; } }
.lg__svc-phone { display: none; margin: 0 0 6px; font-size: 12px; }
.lg__new { position: absolute; top: -12px; left: 50%; z-index: 5; transform: translateX(-50%); min-height: 32px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--m3d-accent); color: #00201e; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.lg__foot { margin: 8px 0 0; font-size: 12px; color: var(--m3d-text-muted); }
:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
@media (max-width: 760px) {
  .lg__line { grid-template-columns: 78px 44px minmax(0, 1fr); min-height: 40px; }
  .lg__svc { display: none; } .lg__svc-phone { display: block; }
  .lg__detail dl { grid-template-columns: minmax(0, 1fr); }
  .lg__btn, .lg__field input, .lg__field select { min-height: 40px; }
}
</style>
