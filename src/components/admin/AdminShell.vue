<template>
  <div
    class="adm"
    data-tid="admin-shell"
    @pointerdown.passive="seen"
    @pointermove.passive="seen"
    @keydown.passive="seen"
    @touchstart.passive="seen"
    @scroll.capture.passive="seen"
    @wheel.passive="seen"
  >
    <header class="adm-top">
      <router-link
        to="/"
        class="adm-word"
      >
        MUON3D
      </router-link>
      <span
        class="adm-sep"
        aria-hidden="true"
      />
      <span class="adm-name">Admin</span>
      <span class="adm-grow" />
      <template v-if="shown">
        <div
          class="adm-range adm-desk"
          role="group"
          aria-label="Time range"
        >
          <button
            v-for="r in ranges"
            :key="r"
            type="button"
            :class="{ on: range === r }"
            :aria-pressed="range === r"
            :data-tid="`admin-range-${r}`"
            @click="setRange(r)"
          >
            {{ r }}
          </button>
        </div>
        <div class="adm-menuwrap adm-desk">
          <button
            type="button"
            class="adm-chip"
            data-tid="admin-refresh"
            aria-haspopup="menu"
            :aria-expanded="menu === 'refresh'"
            @click="toggle('refresh')"
          >
            {{ paused ? 'Paused' : `Refresh ${refresh === 'off' ? 'off' : refresh}` }}
          </button>
          <div
            v-if="menu === 'refresh'"
            class="adm-menu"
            role="menu"
          >
            <button
              v-for="r in refreshes"
              :key="r"
              type="button"
              role="menuitemradio"
              :aria-checked="refresh === r"
              @click="setRefresh(r)"
            >
              {{ r === 'off' ? 'Off' : r === '30s' ? '30 s' : r === '1m' ? '1 min' : '5 min' }}
            </button>
          </div>
        </div>
        <div class="adm-menuwrap">
          <button
            type="button"
            class="adm-chip"
            :class="`adm-chip--${chipTone}`"
            data-tid="admin-chip"
            aria-haspopup="menu"
            :aria-expanded="menu === 'session'"
            @click="toggle('session')"
          >
            <i class="adm-dot" />{{ chipText }}
          </button>
          <div
            v-if="menu === 'session'"
            class="adm-menu adm-menu--wide"
            role="menu"
            data-tid="admin-chip-menu"
          >
            <p
              v-if="open"
              class="adm-menu__note"
            >
              Time left: <b class="mono">{{ fmt(absLeft) }}</b>
            </p>
            <p class="adm-menu__note">
              Signs out after 15 minutes without activity
            </p>
            <button
              type="button"
              role="menuitem"
              data-tid="admin-confirm-again"
              :disabled="portal.busy"
              @click="menu = ''; confirm()"
            >
              Confirm again now
            </button>
            <button
              type="button"
              role="menuitem"
              data-tid="admin-end-session"
              :disabled="!open"
              @click="menu = ''; endSession()"
            >
              End session
            </button>
            <template v-if="open">
              <p class="adm-menu__note adm-phone">
                Refresh
              </p>
              <button
                v-for="r in refreshes"
                :key="'p' + r"
                type="button"
                role="menuitemradio"
                class="adm-phone"
                :aria-checked="refresh === r"
                @click="setRefresh(r)"
              >
                {{ r === 'off' ? 'Refresh off' : `Refresh ${r}` }}
              </button>
            </template>
          </div>
        </div>
      </template>
      <span
        v-if="signedIn"
        class="adm-avatar"
        aria-hidden="true"
      >{{ initials }}</span>
    </header>

    <div
      v-if="toast"
      class="adm-toast"
      role="status"
      data-tid="admin-toast"
    >
      {{ toast }}
    </div>

    <div class="adm-body">
      <nav
        v-if="shown || locked"
        class="adm-nav"
        aria-label="Admin"
        :aria-hidden="locked ? 'true' : undefined"
      >
        <p class="adm-nav__group">
          Observability
        </p>
        <router-link
          v-for="s in sections"
          :key="s.id"
          :to="{ path: s.path, query: carry }"
          exact
          class="adm-nav__item"
          active-class=""
          exact-active-class=""
          :aria-current="isActive(s.path) ? 'page' : undefined"
          :tabindex="locked ? -1 : undefined"
        >
          {{ s.title }}<span
            v-if="s.id === 'alerts' && alertCount > 0"
            class="adm-nav__count mono"
          >{{ alertCount }}</span>
        </router-link>
        <p class="adm-nav__group">
          Staff tools
        </p>
        <router-link
          v-for="t in tools"
          :key="t.id"
          :to="{ path: t.path }"
          class="adm-nav__item"
          active-class=""
          exact-active-class=""
          :aria-current="isActive(t.path) ? 'page' : undefined"
          :tabindex="locked ? -1 : undefined"
        >
          {{ t.title }}
        </router-link>
      </nav>

      <main
        class="adm-main"
        :class="{ 'adm-main--blur': ended || locked }"
        :aria-hidden="ended || locked ? 'true' : undefined"
      >
        <div
          v-if="shown"
          class="adm-phone adm-range adm-range--row"
          role="group"
          aria-label="Time range"
        >
          <button
            v-for="r in ranges"
            :key="'m' + r"
            type="button"
            :class="{ on: range === r }"
            :aria-pressed="range === r"
            @click="setRange(r)"
          >
            {{ r }}
          </button>
        </div>
        <div
          v-if="warn"
          class="adm-banner"
          role="alert"
          :data-tid="`admin-banner-${warn}`"
        >
          <span v-if="warn === 'absolute'">Your 60-minute session ends in <b class="mono">{{ fmt(absLeft) }}</b>. Confirm again to keep this page open; nothing on it will reset.</span>
          <span v-else>Still there? You will be signed out of the admin portal in <b class="mono">{{ fmt(idleLeftS) }}</b> because of inactivity.</span>
          <button
            v-if="warn === 'absolute'"
            type="button"
            data-tid="admin-banner-confirm"
            :disabled="portal.busy"
            @click="confirm()"
          >
            Confirm now
          </button>
          <button
            v-else
            type="button"
            data-tid="admin-banner-stay"
            @click="stay()"
          >
            Stay signed in
          </button>
        </div>

        <admin-sign-in v-if="phase === 'signed-out'" />
        <admin-state-card
          v-else-if="phase === 'not-staff'"
          kind="not-staff"
          :email="email"
          @switch="switchAccount"
        />
        <admin-state-card
          v-else-if="phase === 'wrong-origin'"
          kind="wrong-origin"
        />
        <admin-state-card
          v-else-if="phase === 'unreachable'"
          kind="unreachable"
          @retry="retry"
        />
        <div
          v-else-if="phase === 'loading' || locked"
          class="adm-skel"
          aria-busy="true"
          aria-label="Loading"
        >
          <i
            v-for="n in 8"
            :key="n"
            class="adm-skel__tile"
          />
          <i
            v-for="n in 4"
            :key="'p' + n"
            class="adm-skel__panel"
          />
        </div>
        <router-view v-else-if="shown" />
      </main>
    </div>

    <admin-state-card
      v-if="locked"
      :kind="phase === 'no-passkey' ? 'no-passkey' : 'not-confirmed'"
      :busy="portal.busy"
      :failed="portal.failed"
      @confirm="confirm()"
    />
    <admin-state-card
      v-else-if="ended"
      kind="ended"
      :reason="portal.endReason"
      :busy="portal.busy"
      :failed="portal.failed"
      @confirm="confirm()"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { cloudState } from '@/services/muon-cloud/state'
import { startCentralSignIn } from '@/services/muon-cloud/centralLogin'
import { storedToken } from '@/services/muon-cloud/api'
import { SECTIONS, TOOLS, data, forgetData, loadCatalog } from '@/services/admin/data'
import { RANGES, REFRESHES, obs, type Range, type Refresh } from '@/services/admin/obs'
import { absoluteLeft, confirm, end, idleLeft, load, portal, showsPortal, stay, sync, tick, touchIfActive, noteInput, warning, KEEP_DATA_MS } from '@/services/admin/session'
import { countdown } from '@/services/admin/format'
import { rangeOf, refreshOf, setQuery } from './query'
import AdminSignIn from './AdminSignIn.vue'
import AdminStateCard from './AdminStateCard.vue'

/**
 * The admin portal's shell (KAN-6100). It owns the state machine of spec section 3:
 * signed out, not staff, staff not confirmed, open, and ended (60 minutes up, 15
 * idle, or ended by the person). Children draw only while the portal is shown, and
 * nothing is fetched until it is open.
 */
export default defineComponent({
  components: { AdminSignIn, AdminStateCard },
  data () {
    return { portal, menu: '' as '' | 'session' | 'refresh', toast: '', alertCount: 0, timer: 0, syncTimer: 0, toastTimer: 0, ranges: RANGES, refreshes: REFRESHES, sections: SECTIONS, tools: TOOLS }
  },
  computed: {
    phase (): string { return portal.phase },
    open (): boolean { return portal.phase === 'open' },
    ended (): boolean { return portal.phase === 'ended' },
    locked (): boolean { return portal.phase === 'not-confirmed' || portal.phase === 'no-passkey' },
    shown (): boolean { return showsPortal(portal.phase) },
    signedIn (): boolean { return portal.phase !== 'signed-out' && portal.phase !== 'loading' && !!storedToken() },
    email (): string { return cloudState.account?.email ?? '' },
    initials (): string { return (cloudState.account?.name || cloudState.account?.email || '?').trim().charAt(0).toUpperCase() },
    range (): Range { return rangeOf(this.$route) },
    refresh (): Refresh { return refreshOf(this.$route) },
    paused (): boolean { return !this.open },
    carry (): Record<string, string> {
      const query: Record<string, string> = {}
      if (this.$route.query.range) query.range = String(this.$route.query.range)
      if (this.$route.query.refresh) query.refresh = String(this.$route.query.refresh)
      return query
    },
    absLeft (): number { return absoluteLeft(portal) },
    idleLeftS (): number { return idleLeft(portal) },
    warn (): '' | 'idle' | 'absolute' { return warning(portal) },
    chipTone (): string { return !this.open ? 'off' : this.warn ? 'warn' : 'ok' },
    chipText (): string {
      if (portal.phase === 'ended') return 'Session ended'
      if (!this.open) return 'Not confirmed'
      return this.warn === 'idle' ? `Idle ${countdown(idleLeft(portal))}` : `Session ${countdown(absoluteLeft(portal))}`
    }
  },
  watch: {
    'portal.phase' (phase: string) {
      if (phase === 'open') void loadCatalog()
      if (phase === 'signed-out' || phase === 'not-staff') forgetData()
    },
    'portal.now' () {
      // Ten minutes after the session ended, the page's data is dropped (spec S5).
      if (portal.phase === 'ended' && portal.now - portal.endedAt > KEEP_DATA_MS && data.state === 'ok') { forgetData(); this.$root.$emit('admin-drop') }
    },
    'portal.epoch' () { void this.refreshAlertCount() },
    '$route.path' () { this.menu = '' }
  },
  mounted () {
    void load()
    this.timer = window.setInterval(() => { tick(); void touchIfActive() }, 1000)
    this.syncTimer = window.setInterval(() => { if (document.visibilityState === 'visible') void sync() }, 60_000)
    document.addEventListener('visibilitychange', this.onVisible)
    document.addEventListener('click', this.outside)
    if (portal.phase === 'open') void loadCatalog()
  },
  beforeDestroy () {
    window.clearInterval(this.timer); window.clearInterval(this.syncTimer); window.clearTimeout(this.toastTimer)
    document.removeEventListener('visibilitychange', this.onVisible)
    document.removeEventListener('click', this.outside)
  },
  methods: {
    confirm, stay,
    fmt: countdown,
    seen () { noteInput() },
    onVisible () { if (document.visibilityState === 'visible') void sync() },
    outside (event: Event) { if (this.menu && !(event.target as HTMLElement | null)?.closest?.('.adm-menuwrap')) this.menu = '' },
    toggle (which: 'session' | 'refresh') { this.menu = this.menu === which ? '' : which },
    isActive (path: string): boolean { return this.$route.path.replace(/\/+$/, '') === path },
    setRange (range: Range) { setQuery(this.$router, this.$route, { range }) },
    setRefresh (refresh: Refresh) { this.menu = ''; setQuery(this.$router, this.$route, { refresh }) },
    retry () { void load() },
    switchAccount () { void startCentralSignIn({ silent: false, returnTo: this.$route.fullPath }) },
    async endSession () {
      await end()
      this.toast = 'Admin session ended.'
      window.clearTimeout(this.toastTimer)
      this.toastTimer = window.setTimeout(() => { this.toast = '' }, 5000)
    },
    /** The count beside "Alerts": fetched in the background, once per confirmation. A console without the endpoint shows none. */
    async refreshAlertCount () {
      if (portal.phase !== 'open') return
      try { this.alertCount = (await obs.alerts(true)).alerts.filter(a => a.state === 'firing' && a.name !== 'Watchdog').length } catch { this.alertCount = 0 }
    }
  }
})
</script>

<style lang="scss" scoped>
.adm { min-height: 100vh; background: var(--m3d-bg); color: var(--m3d-text); font-family: var(--m3d-font-sans); }
.mono { font-family: var(--m3d-font-mono); font-variant-numeric: tabular-nums; }
.adm-top { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 16px; background: var(--m3d-surface); border-bottom: 1px solid var(--m3d-border); }
.adm-word { font-family: var(--m3d-font-display); font-size: 15px; letter-spacing: .04em; color: var(--m3d-text); text-decoration: none; }
.adm-sep { width: 1px; height: 18px; background: var(--m3d-border); }
.adm-name { font-size: 12px; font-weight: 500; color: var(--m3d-text-muted); }
.adm-grow { flex: 1; }
.adm-range { display: inline-flex; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); overflow: hidden; }
.adm-range button { min-height: 32px; padding: 0 10px; border: 0; background: transparent; color: var(--m3d-text-muted); font: inherit; font-size: 12px; cursor: pointer; }
.adm-range button.on { background: var(--m3d-accent-soft); color: var(--m3d-text); font-weight: 600; }
.adm-range--row { display: none; width: 100%; margin-bottom: 12px; }
.adm-range--row button { flex: 1; min-height: 40px; }
.adm-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 12px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-pill, 999px); background: transparent; color: var(--m3d-text); font: inherit; font-size: 12px; font-family: var(--m3d-font-mono); cursor: pointer; }
.adm-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--m3d-text-subtle); }
.adm-chip--ok .adm-dot { background: var(--m3d-success); }
.adm-chip--warn { border-color: var(--m3d-warning); } .adm-chip--warn .adm-dot { background: var(--m3d-warning); }
.adm-menuwrap { position: relative; }
.adm-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 50; min-width: 160px; padding: 6px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); box-shadow: var(--m3d-shadow-float); }
.adm-menu--wide { min-width: 260px; }
.adm-menu button { display: block; width: 100%; min-height: 36px; padding: 0 10px; border: 0; border-radius: var(--m3d-radius-sm, 4px); background: transparent; color: var(--m3d-text); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.adm-menu button:hover:not([disabled]), .adm-menu button[aria-checked='true'] { background: var(--m3d-accent-soft); }
.adm-menu__note { margin: 4px 10px; font-size: 12px; color: var(--m3d-text-muted); }
.adm-avatar { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--m3d-surface-2); border: 1px solid var(--m3d-border); font-size: 12px; font-weight: 600; }
.adm-toast { position: fixed; top: 64px; left: 50%; z-index: 60; transform: translateX(-50%); padding: 10px 16px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); box-shadow: var(--m3d-shadow-float); font-size: 13px; }
.adm-body { display: grid; grid-template-columns: auto minmax(0, 1fr); min-height: calc(100vh - 56px); }
.adm-nav { display: flex; flex-direction: column; width: 216px; padding: 12px 8px; background: var(--m3d-surface); border-right: 1px solid var(--m3d-border); }
.adm-nav__group { margin: 12px 10px 4px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--m3d-text-subtle); }
.adm-nav__item { display: flex; justify-content: space-between; align-items: center; min-height: 32px; padding: 7px 10px; border-left: 2px solid transparent; border-radius: var(--m3d-radius-sm, 4px); color: var(--m3d-text-muted); font-size: 13px; text-decoration: none; }
.adm-nav__item[aria-current='page'] { background: var(--m3d-accent-soft); border-left-color: var(--m3d-accent); color: var(--m3d-text); font-weight: 600; }
.adm-nav__count { color: var(--m3d-danger); font-size: 12px; }
.adm-main { min-width: 0; padding: 20px 24px; }
.adm-main--blur { filter: blur(6px); pointer-events: none; user-select: none; }
.adm-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; padding: 10px 14px; border: 1px solid var(--m3d-warning); border-radius: var(--m3d-radius-md); background: color-mix(in srgb, var(--m3d-warning) 12%, transparent); font-size: 13px; }
.adm-banner button { min-height: 32px; padding: 0 14px; border: 0; border-radius: var(--m3d-radius-md); background: var(--m3d-accent); color: #00201e; font: inherit; font-weight: 600; cursor: pointer; }
.adm-skel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.adm-skel__tile { height: 84px; border-radius: var(--m3d-radius-md); background: var(--m3d-surface-2); }
.adm-skel__panel { grid-column: span 2; height: 210px; border-radius: var(--m3d-radius-md); background: var(--m3d-surface-2); }
.adm-phone { display: none; }
:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
@media (max-width: 760px) {
  .adm-desk { display: none; }
  .adm-phone { display: block; }
  .adm-range--row { display: flex; }
  .adm-body { display: block; }
  .adm-nav { flex-direction: row; width: auto; overflow-x: auto; gap: 6px; padding: 8px 12px; border-right: 0; border-bottom: 1px solid var(--m3d-border); }
  .adm-nav__group { display: none; }
  .adm-nav__item { flex: none; min-height: 40px; border: 1px solid var(--m3d-border); border-radius: 999px; }
  .adm-nav__item[aria-current='page'] { border-color: var(--m3d-accent); }
  .adm-main { padding: 12px; }
  .adm-skel { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .adm-skel__panel { grid-column: span 2; }
  .adm-menu--wide button { min-height: 40px; }
}
</style>
