<template>
  <div
    class="al"
    data-tid="admin-alerts"
  >
    <section
      v-if="state === 'missing' || state === 'failed'"
      class="al__block"
      role="alert"
    >
      <b>{{ state === 'missing' ? 'Alerts are not available yet' : 'The admin data service did not answer.' }}</b>
      <button
        type="button"
        @click="load(false)"
      >
        Retry
      </button>
    </section>
    <template v-else>
      <div
        v-if="!firingOnly"
        class="al__tiles"
      >
        <div
          class="al__tile"
          data-tid="admin-watchdog"
        >
          <span class="al__label"><i :class="watchdogClass" />Alerting pipeline</span>
          <b>{{ !alerts ? '…' : alerts.watchdog_ok ? 'Working' : 'Not working' }}</b>
        </div>
        <div
          class="al__tile"
          data-tid="admin-delivery"
        >
          <span class="al__label"><i :class="alerts && alerts.delivery && alerts.delivery.email === 'ok' ? 'good' : 'warning'" />Alert e-mail</span>
          <b>{{ !alerts ? '…' : alerts.delivery && alerts.delivery.email === 'ok' ? 'Sending' : 'Waiting for SMTP settings' }}</b>
        </div>
      </div>
      <section class="al__panel">
        <h3>Firing and pending</h3>
        <p
          v-if="alerts && !firing.length"
          class="al__none"
          data-tid="admin-nothing-firing"
        >
          <i class="good" />Nothing is firing.
        </p>
        <table
          v-else-if="firing.length"
          class="al__table"
        >
          <thead>
            <tr><th>Alert</th><th>Severity</th><th>State</th><th>Target</th><th>Summary</th><th>Since</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="a in firing"
              :key="a.name + JSON.stringify(a.labels)"
              :data-tid="`admin-alert-${a.name}`"
            >
              <td class="mono">
                {{ a.name }}
              </td>
              <td><i :class="a.severity === 'critical' ? 'critical' : 'warning'" />{{ a.severity }}</td>
              <td>{{ a.state }}</td>
              <td class="mono">
                {{ target(a) }}
              </td>
              <td>{{ a.summary }}</td>
              <td>{{ since(a.since) }}</td>
            </tr>
          </tbody>
        </table>
        <i
          v-else
          class="al__skel"
        />
      </section>
      <section
        v-if="!firingOnly"
        class="al__panel"
      >
        <h3>All rules</h3>
        <table
          v-if="alerts"
          class="al__table"
        >
          <thead>
            <tr><th>Rule</th><th>Severity</th><th>For</th><th>State</th></tr>
          </thead>
          <tbody>
            <template v-for="r in alerts.rules">
              <tr
                :key="r.name"
                :data-tid="`admin-rule-${r.name}`"
              >
                <td class="mono">
                  {{ r.name }}
                </td>
                <td>{{ r.severity }}</td>
                <td class="mono">
                  {{ r.for_s }} s
                </td>
                <td><i :class="r.state === 'firing' ? 'critical' : r.state === 'pending' ? 'warning' : 'good'" />{{ r.state }}</td>
              </tr>
            </template>
          </tbody>
        </table>
        <i
          v-else
          class="al__skel"
        />
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { obs, obsFailure, type AlertItem, type AlertsResponse } from '@/services/admin/obs'
import { portal, noteFailure } from '@/services/admin/session'
import { ago } from '@/services/admin/format'
import { refreshMs, refreshOf } from './query'

/** Alerts from Alertmanager through the console (spec 5.3 Alerts). Read-only: no silence or acknowledge. */
export default defineComponent({
  props: { firingOnly: Boolean },
  data () { return { alerts: null as AlertsResponse | null, state: 'loading' as 'loading' | 'ok' | 'missing' | 'failed', timer: 0 } },
  computed: {
    firing (): AlertItem[] {
      const order = { critical: 0, warning: 1, info: 2 }
      return (this.alerts?.alerts ?? []).filter(a => a.name !== 'Watchdog' && (a.state === 'firing' || a.state === 'pending'))
        .sort((a, b) => order[a.severity] - order[b.severity])
    },
    watchdogClass (): string { return !this.alerts ? '' : this.alerts.watchdog_ok ? 'good' : 'critical' }
  },
  watch: { 'portal.epoch' () { this.load(false) } },
  mounted () {
    this.load(false)
    const ms = refreshMs(refreshOf(this.$route))
    if (ms) this.timer = window.setInterval(() => { if (document.visibilityState === 'visible') this.load(true) }, ms)
  },
  beforeDestroy () { window.clearInterval(this.timer) },
  methods: {
    target (a: AlertItem): string { return Object.entries(a.labels).filter(([k]) => !['alertname', 'severity'].includes(k)).map(([k, v]) => `${k}=${v}`).join(' ') },
    since (t: number): string { return ago(Math.max(0, Date.now() / 1000 - t)) },
    async load (background: boolean) {
      if (portal.phase !== 'open') return
      try { this.alerts = await obs.alerts(background); this.state = 'ok' } catch (error) {
        if (noteFailure(error)) return
        if (!this.alerts) this.state = obsFailure(error).missing ? 'missing' : 'failed'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.mono { font-family: var(--m3d-font-mono); }
.al { margin-bottom: 12px; }
.al__tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.al__tile, .al__panel, .al__block { padding: 12px 14px; margin-bottom: 12px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); }
.al__tile { display: flex; flex-direction: column; gap: 4px; margin: 0; b { font-size: 18px; } }
.al__label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--m3d-text-muted); }
.al__panel h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
.al__none { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; }
.al__table { width: 100%; border-collapse: collapse; font-size: 12px; th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--m3d-border); overflow-wrap: anywhere; } th { color: var(--m3d-text-muted); } }
.al__skel { display: block; height: 80px; background: var(--m3d-surface-2); border-radius: var(--m3d-radius-sm, 4px); }
.al__block { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; button { min-height: 32px; padding: 0 14px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: transparent; color: var(--m3d-text); font: inherit; cursor: pointer; } }
i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: var(--m3d-text-subtle); flex: none; }
i.good { background: var(--m3d-success); } i.warning { background: var(--m3d-warning); } i.critical { background: var(--m3d-danger); }
.al__skel { margin: 0; width: 100%; height: 80px; border-radius: var(--m3d-radius-sm, 4px); }
@media (max-width: 760px) { .al__tiles { grid-template-columns: minmax(0, 1fr); } .al__table th:nth-child(4), .al__table td:nth-child(4), .al__table th:nth-child(6), .al__table td:nth-child(6) { display: none; } }
</style>
