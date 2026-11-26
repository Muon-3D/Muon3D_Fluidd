<template>
  <div
    class="card-wrap"
    :class="{ 'card-wrap--scrim': scrim }"
  >
    <section
      ref="card"
      class="card"
      :role="scrim ? 'dialog' : 'region'"
      :aria-modal="scrim ? 'true' : undefined"
      aria-labelledby="admin-card-title"
      tabindex="-1"
      :data-tid="`admin-card-${kind}`"
      @keydown="trap"
    >
      <span
        class="card__icon"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 28 28"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <template v-if="kind === 'not-staff' || kind === 'wrong-origin' || kind === 'unreachable'">
            <rect
              x="6"
              y="12"
              width="16"
              height="12"
              rx="2"
            /><path d="M9.5 12V9a4.5 4.5 0 0 1 9 0v3" />
          </template>
          <template v-else>
            <circle
              cx="10"
              cy="13"
              r="4.5"
            /><path d="M14.5 13H24M20 13v4M24 13v3" />
          </template>
        </svg>
      </span>
      <h2
        id="admin-card-title"
        class="card__title"
      >
        {{ copy.title }}
      </h2>
      <p class="card__body">
        {{ copy.body }}
      </p>
      <p
        v-if="email"
        class="card__who"
        data-tid="admin-card-account"
      >
        {{ email }}
      </p>
      <p
        v-if="failed"
        class="card__error"
        role="alert"
      >
        That didn't work. Try your passkey again.
      </p>
      <router-link
        v-if="kind === 'not-staff' || kind === 'unreachable'"
        to="/"
        class="card__btn"
        data-tid="admin-card-back"
      >
        Back to Control
      </router-link>
      <button
        v-if="kind === 'not-confirmed' || kind === 'ended'"
        ref="primary"
        type="button"
        class="card__btn"
        data-tid="admin-confirm"
        :disabled="busy"
        @click="$emit('confirm')"
      >
        {{ busy ? 'Waiting for your passkey…' : 'Confirm with passkey' }}
      </button>
      <router-link
        v-if="kind === 'no-passkey'"
        to="/account/security"
        class="card__btn"
        data-tid="admin-card-security"
      >
        Open security settings
      </router-link>
      <a
        v-if="kind === 'wrong-origin'"
        class="card__btn"
        href="https://control.muon3d.com/admin"
      >control.muon3d.com/admin</a>
      <button
        v-if="kind === 'unreachable'"
        type="button"
        class="card__link"
        @click="$emit('retry')"
      >
        Try again
      </button>
      <button
        v-if="kind === 'not-staff'"
        type="button"
        class="card__link"
        data-tid="admin-card-switch"
        @click="$emit('switch')"
      >
        Sign in with a different account
      </button>
      <p class="card__fine">
        <template v-if="kind === 'not-staff'">
          Think this is a mistake? Ask a Muon3D administrator to add your account.
        </template>
        <template v-else-if="kind === 'not-confirmed'">
          You stay signed in to Control either way. <router-link to="/">
            Back to Control
          </router-link>
        </template>
        <template v-else-if="kind === 'ended'">
          Your page, range and filters are kept. <router-link to="/">
            Back to Control
          </router-link>
        </template>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { EndReason } from '@/services/admin/session'

export type CardKind = 'not-staff' | 'not-confirmed' | 'no-passkey' | 'ended' | 'unreachable' | 'wrong-origin'

/** The portal's cards (spec 4.8): Staff only, Confirm it's you, Add a passkey first, Session ended. */
export default defineComponent({
  props: {
    kind: { type: String as PropType<CardKind>, required: true },
    email: { type: String, default: '' },
    reason: { type: String as PropType<EndReason>, default: '' },
    busy: Boolean,
    failed: Boolean
  },
  computed: {
    scrim (): boolean { return this.kind === 'not-confirmed' || this.kind === 'no-passkey' || this.kind === 'ended' },
    copy (): { title: string; body: string } {
      switch (this.kind) {
        case 'not-staff': return { title: 'Staff only', body: 'This area is for Muon3D staff. Your account does not have staff access, so there is nothing to show here.' }
        case 'not-confirmed': return { title: 'Confirm it\'s you', body: 'The admin portal shows production data. Use your passkey to open it for 60 minutes.' }
        case 'no-passkey': return { title: 'Add a passkey first', body: 'Staff access needs a passkey on your account. Add one in your security settings, then come back.' }
        case 'unreachable': return { title: 'Admin did not answer', body: 'The console could not be reached to check your access. Nothing was opened.' }
        case 'wrong-origin': return { title: 'Open it on Control', body: 'Open the admin portal at control.muon3d.com.' }
        default: return { title: 'Session ended', body: this.reason === 'idle'
          ? 'You were inactive for 15 minutes, so your admin session was closed. Confirm with your passkey to pick up where you left off.'
          : this.reason === 'ended'
            ? 'You ended your admin session. Confirm with your passkey to open it again.'
            : 'Your 60-minute admin session has ended. Confirm with your passkey to pick up where you left off.' }
      }
    }
  },
  mounted () { this.$nextTick(() => ((this.$refs.primary as HTMLElement | undefined) ?? (this.$refs.card as HTMLElement)).focus()) },
  methods: {
    /** Focus stays in the card; Esc does nothing (there is nothing behind it to use). */
    trap (event: KeyboardEvent) {
      if (!this.scrim) return
      if (event.key === 'Escape') { event.preventDefault(); return }
      if (event.key !== 'Tab') return
      const card = this.$refs.card as HTMLElement
      const items = Array.from(card.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'))
      if (!items.length) { event.preventDefault(); return }
      const first = items[0]; const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  }
})
</script>

<style lang="scss" scoped>
.card-wrap { display: grid; place-items: start center; padding: 48px 16px; }
.card-wrap--scrim { position: fixed; inset: 56px 0 0; z-index: 30; align-items: center; background: color-mix(in srgb, var(--m3d-bg) 78%, transparent); }
.card { width: 100%; max-width: 400px; padding: 28px; text-align: center; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); box-shadow: var(--m3d-shadow-float); color: var(--m3d-text); }
.card:focus { outline: none; }
.card__icon { display: inline-grid; place-items: center; width: 56px; height: 56px; border: 1.5px solid var(--m3d-accent); border-radius: 50%; color: var(--m3d-accent); }
.card__title { margin: 16px 0 8px; font-family: var(--m3d-font-display); font-size: 16px; font-weight: 400; }
.card__body, .card__fine { margin: 0 0 16px; font-size: 13px; color: var(--m3d-text-muted); }
.card__fine { margin: 14px 0 0; font-size: 12px; color: var(--m3d-text-subtle); }
.card__who { margin: 0 0 16px; padding: 8px 12px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); font-size: 13px; overflow-wrap: anywhere; }
.card__error { margin: 0 0 12px; font-size: 13px; color: var(--m3d-danger); }
.card__btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 40px; border: 0; border-radius: var(--m3d-radius-md); background: var(--m3d-accent); color: #00201e; font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
:root[data-theme='light'] .card__btn, .theme--light .card__btn { color: #fff; }
.card__btn[disabled] { opacity: .6; cursor: default; }
.card__link { margin-top: 12px; border: 0; background: none; color: var(--m3d-accent); font: inherit; font-size: 13px; cursor: pointer; min-height: 32px; }
.card__fine a { color: var(--m3d-accent); }
:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
</style>
