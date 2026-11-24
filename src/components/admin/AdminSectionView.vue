<template>
  <div
    class="sec"
    :data-tid="`admin-section-${section}`"
  >
    <header
      v-if="!bare"
      class="sec__head"
    >
      <h1 class="sec__title">
        {{ nav ? nav.title : section }}
      </h1>
      <p
        class="sec__sub"
        :class="{ 'sec__sub--stale': stale }"
        data-tid="admin-updated"
      >
        {{ scope }} · {{ range }}<template v-if="updatedAt"> · {{ stale ? `Updated ${ago}. Retrying.` : `Updated ${ago}` }}</template>
      </p>
      <div
        v-if="hasJob"
        class="sec__filter"
      >
        <label for="admin-job">Service</label>
        <select
          id="admin-job"
          :value="job"
          data-tid="admin-job"
          @change="setJob($event.target.value)"
        >
          <option
            v-for="j in jobs"
            :key="j"
            :value="j"
          >
            {{ j }}
          </option>
        </select>
      </div>
    </header>
    <div
      v-if="running"
      class="sec__progress"
      aria-hidden="true"
    />

    <slot />

    <section
      v-if="data.state === 'missing' || data.state === 'failed'"
      class="sec__block"
      role="alert"
      data-tid="admin-data-error"
    >
      <b>{{ data.state === 'missing' ? 'Admin data is not available yet' : 'The admin data service did not answer.' }}</b>
      <span>{{ data.text }}{{ data.state === 'missing' ? ' Staff tools in the menu still work.' : '' }}</span>
      <button
        type="button"
        data-tid="admin-data-retry"
        @click="reload"
      >
        Retry
      </button>
    </section>
    <template v-else>
      <div
        v-if="tiles.length || (data.state !== 'ok')"
        class="sec__tiles"
      >
        <template v-if="data.state === 'ok'">
          <admin-tile
            v-for="p in tiles"
            :key="p.id"
            :panel="p"
            :result="results[p.id]"
            :to="tileTarget(p.id)"
            :carry="carry"
          />
        </template>
        <i
          v-for="n in (data.state === 'ok' ? 0 : 4)"
          :key="'s' + n"
          class="sec__skel"
        />
      </div>
      <div
        v-if="data.state === 'ok'"
        class="sec__panels"
      >
        <admin-panel
          v-for="p in rest"
          :key="p.id"
          :panel="p"
          :result="p.status === 'placeholder' ? undefined : results[p.id]"
          :grafana-uid="grafanaUid"
          :grafana-base="(data.catalog && data.catalog.grafana_url) || ''"
          :range="range"
          @retry="retryOne"
        />
        <p
          v-if="!panels.length"
          class="sec__empty"
        >
          This section has no panels yet.
        </p>
      </div>
      <div
        v-else
        class="sec__panels"
      >
        <i
          v-for="n in 4"
          :key="'p' + n"
          class="sec__skel sec__skel--panel"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import AdminPanel from './AdminPanel.vue'
import AdminTile from './AdminTile.vue'
import { JOBS, SECTIONS, data, loadCatalog, ordered, sectionOf } from '@/services/admin/data'
import { AdminError } from '@/services/admin/client'
import { obs, type CatalogPanel, type PanelResult } from '@/services/admin/obs'
import { portal, noteFailure } from '@/services/admin/session'
import { ago as agoText } from '@/services/admin/format'
import { paramOf, rangeOf, refreshMs, refreshOf, setQuery } from './query'

const TILE_TARGET: Array<[RegExp, string]> = [
  [/^ov-services$/, '/admin/infrastructure'], [/^ov-endpoints$/, '/admin/endpoints'], [/^ov-alerts$/, '/admin/alerts'],
  [/^ov-(rps|5xx|p95)$/, '/admin/traffic'], [/^ov-printers$/, '/admin/fleet'], [/^ov-active$/, '/admin/accounts']
]
const JOB_SECTIONS = ['traffic', 'errors']
const CHUNK = 24

/**
 * One section of the portal (spec 5.3): its tiles, then its real panels, then its
 * placeholders. One `obs/query` call per section per refresh; a failing panel shows
 * "No data from ..." alone and Retry asks for that panel only.
 */
export default defineComponent({
  components: { AdminPanel, AdminTile },
  props: {
    section: { type: String, required: true },
    /** Panel ids drawn by the page itself (alerts, logs) rather than from the query. */
    skip: { type: Array as PropType<string[]>, default: () => [] },
    /** No title: the page draws its own (Logs). */
    bare: Boolean
  },
  data () {
    return { data, results: {} as Record<string, PanelResult>, updatedAt: 0, running: 0, slow: false, timer: 0, failedOnce: false, jobs: JOBS, token: 0 }
  },
  computed: {
    nav (): { title: string; grafana?: string } | undefined { return SECTIONS.find(s => s.id === this.section) },
    range (): string { return rangeOf(this.$route) },
    job (): string { return paramOf(this.$route, 'job') || 'muon-console' },
    hasJob (): boolean { return JOB_SECTIONS.includes(this.section) },
    scope (): string { return this.hasJob ? this.job : this.section === 'overview' ? 'All services' : 'Production' },
    grafanaUid (): string { return sectionOf(this.section)?.grafana_uid ?? this.nav?.grafana ?? '' },
    panels (): CatalogPanel[] { return ordered(sectionOf(this.section)?.panels ?? []).filter(p => !this.skip.includes(p.id)) },
    tiles (): CatalogPanel[] { return this.panels.filter(p => p.chart === 'tile' && p.status !== 'placeholder') },
    rest (): CatalogPanel[] { return this.panels.filter(p => p.chart !== 'tile' || p.status === 'placeholder') },
    ids (): string[] { return this.panels.filter(p => p.status !== 'placeholder').map(p => p.id) },
    carry (): Record<string, string> { return { ...(this.$route.query.range ? { range: String(this.$route.query.range) } : {}) } },
    interval (): number { return this.slow ? Math.max(60_000, refreshMs(refreshOf(this.$route))) : refreshMs(refreshOf(this.$route)) },
    age (): number { return this.updatedAt ? Math.max(0, (portal.now - this.updatedAt) / 1000) : 0 },
    ago (): string { return agoText(this.age) },
    stale (): boolean { return !!this.updatedAt && this.interval > 0 && this.age * 1000 > 3 * this.interval }
  },
  watch: {
    range () { this.results = {}; this.run(false) },
    job () { this.results = {}; this.run(false) },
    section () { this.results = {}; this.updatedAt = 0; this.run(false) },
    interval () { this.schedule() },
    'data.state' (state: string) { if (state === 'ok') this.run(false) },
    'portal.epoch' () { this.run(false) },
    'portal.phase' (phase: string) { if (phase === 'open') this.schedule() }
  },
  mounted () {
    this.$root.$on('admin-drop', this.drop)
    if (data.state === 'idle' && portal.phase === 'open') loadCatalog()
    if (data.state === 'ok') this.run(false)
    this.schedule()
    document.addEventListener('visibilitychange', this.onVisible)
  },
  beforeDestroy () {
    this.$root.$off('admin-drop', this.drop)
    window.clearInterval(this.timer)
    document.removeEventListener('visibilitychange', this.onVisible)
    this.token++
  },
  methods: {
    drop () { this.results = {}; this.updatedAt = 0 },
    schedule () {
      window.clearInterval(this.timer)
      if (this.interval > 0) this.timer = window.setInterval(() => { if (document.visibilityState === 'visible' && portal.phase === 'open') this.run(true) }, this.interval)
    },
    /** Coming back to the tab refreshes at once (the interval does not run while hidden). */
    onVisible () { if (document.visibilityState === 'visible' && portal.phase === 'open' && this.interval > 0 && this.updatedAt) this.run(true) },
    tileTarget (id: string): string { return TILE_TARGET.find(([re]) => re.test(id))?.[1] ?? `/admin/${this.section === 'overview' ? '' : this.section}` },
    setJob (job: string) { setQuery(this.$router, this.$route, { job: job === 'muon-console' ? '' : job }) },
    reload () { loadCatalog(true) },
    retryOne (id: string) { this.run(false, [id]) },
    async run (background: boolean, only?: string[]) {
      if (portal.phase !== 'open' || data.state !== 'ok') return
      const ids = only ?? this.ids
      if (!ids.length) return
      const token = ++this.token
      const request = { range: this.range as never, vars: this.hasJob ? { job: this.job } : undefined }
      this.running++
      try {
        const parts: string[][] = []
        for (let i = 0; i < ids.length; i += CHUNK) parts.push(ids.slice(i, i + CHUNK))
        const answers = await Promise.all(parts.map(panels => obs.query({ panels, ...request }, background)))
        if (token !== this.token && !only) return
        const merged: Record<string, PanelResult> = only ? { ...this.results } : {}
        if (!only) Object.assign(merged, this.results)
        for (const a of answers) Object.assign(merged, a.results)
        this.results = merged
        this.updatedAt = Date.now(); this.slow = false
      } catch (error) {
        if (noteFailure(error)) return
        if (error instanceof AdminError && error.status === 429) this.slow = true
        else if (!Object.keys(this.results).length) for (const id of ids) this.$set(this.results, id, { status: 'unavailable', reason: 'The admin data service did not answer.' })
      } finally { this.running-- }
    }
  }
})
</script>

<style lang="scss" scoped>
.sec__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; margin-bottom: 16px; }
.sec__title { margin: 0; font-family: var(--m3d-font-display); font-size: 18px; font-weight: 400; }
.sec__sub { flex: 1 1 100%; order: 3; margin: 0; font-size: 13px; color: var(--m3d-text-muted); }
.sec__sub--stale { color: var(--m3d-warning); }
.sec__filter { display: flex; align-items: center; gap: 8px; margin-left: auto; font-size: 12px; color: var(--m3d-text-muted); select { min-height: 32px; padding: 0 8px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: var(--m3d-surface); color: var(--m3d-text); font: inherit; font-size: 12px; } }
.sec__progress { height: 2px; margin: -8px 0 12px; background: var(--m3d-accent); }
.sec__tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.sec__panels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sec__skel { display: block; height: 84px; background: var(--m3d-surface-2); border-radius: var(--m3d-radius-md); }
.sec__skel--panel { height: 210px; }
.sec__block { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 16px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); font-size: 13px; span { color: var(--m3d-text-muted); } button { min-height: 32px; padding: 0 14px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: transparent; color: var(--m3d-text); font: inherit; cursor: pointer; } }
.sec__empty { grid-column: 1 / -1; color: var(--m3d-text-muted); font-size: 13px; }
@media (max-width: 760px) {
  .sec__tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .sec__panels { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: no-preference) { .sec__progress { animation: none; } }
</style>
