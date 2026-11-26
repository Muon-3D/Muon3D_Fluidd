<template>
  <m3-dialog
    :value="open"
    :title="dialogTitle"
    :max-width="380"
    close-label="Close"
    data-tid="setup-parts"
    @close="dismiss"
  >
    <div class="setup-parts">
      <canvas
        ref="canvas"
        class="setup-parts__canvas"
        :width="pixels"
        :height="pixels"
        role="img"
        :aria-label="message.title"
        data-tid="setup-parts-canvas"
        :data-step="step"
        :data-running="running ? 'true' : 'false'"
      />
      <h3
        class="setup-parts__title"
        data-tid="setup-parts-title"
      >
        {{ message.title }}
      </h3>
      <p
        class="setup-parts__hint"
        data-tid="setup-parts-hint"
      >
        {{ message.hint }}
      </p>
      <ul
        class="setup-parts__list"
        data-tid="setup-parts-list"
      >
        <li
          v-for="s in steps"
          :key="s"
          class="setup-parts__item"
          :class="{ 'setup-parts__item--now': s === step }"
          :data-tid="`setup-parts-item-${s}`"
        >
          <span
            class="setup-parts__dot"
            aria-hidden="true"
          />
          {{ messages[s].title }}
        </li>
      </ul>
    </div>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import { drawSetup, SETUP_MESSAGES, SETUP_THEMES, type SetupStep } from '@/services/setup-anim/setup-anim'
import { gateMissing, missingFor, stepToShow } from '@/services/setup-anim/parts'
import { clearPending, partsGate } from '@/services/setup-anim/gate'

/** The picture's side, in CSS pixels. */
const SIZE = 320

/**
 * The pop-up for an action that needs parts (KAN-6012). It opens when Control
 * asks for an action the printer's `m1_machine.missing` says needs parts, and
 * when the printer itself is holding a print for parts (`m1_machine.gate`). It
 * shows the setup animation for the first part still missing (one step at a
 * time), the step's words, and a checklist of every part missing. It follows the
 * printer live; when nothing is missing it closes, and the action goes ahead.
 * The drawing is the design lab's, drawn from here with Control's own colours.
 * With reduced motion it draws one still; the frame loop runs only while open.
 */
@Component({ components: { M3Dialog } })
export default class SetupPartsDialog extends Vue {
  /** A held print the person closed: shown again only for a new hold. */
  dismissedGate: { since: unknown } | null = null
  raf = 0
  t0 = 0
  /** Whether the frame loop is on (the pop-up open, motion allowed): for the specs. */
  running = false
  reduced = false
  media: MediaQueryList | null = null
  colours = { ...SETUP_THEMES.dark }
  /** Kept while the pop-up fades out, so it never shows an empty picture. */
  shownStep: SetupStep = 'toolhead'

  readonly pixels = Math.round(SIZE * (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1))
  readonly messages = SETUP_MESSAGES

  get status (): unknown {
    return this.$store.state.printer.printer
  }

  get gateSince (): unknown {
    const m = (this.status as { m1_machine?: { gate?: { since?: unknown } | null } }).m1_machine
    return m?.gate?.since ?? null
  }

  get steps (): SetupStep[] {
    const pending = partsGate.pending
    if (pending) return missingFor(this.status, pending.action)
    if (this.dismissedGate !== null && this.dismissedGate.since === this.gateSince) return []
    return gateMissing(this.status)
  }

  get step (): SetupStep | null {
    return stepToShow(this.steps)
  }

  get message () {
    return SETUP_MESSAGES[this.step ?? this.shownStep]
  }

  get open (): boolean {
    return this.steps.length > 0
  }

  get dialogTitle (): string {
    return this.steps.length > 1 ? 'Fit these parts first' : 'Fit this part first'
  }

  get dark (): boolean {
    return !!this.$vuetify?.theme?.dark
  }

  @Watch('step', { immediate: true })
  onStep (step: SetupStep | null) {
    if (step) this.shownStep = step
    this.redraw()
  }

  @Watch('open', { immediate: true })
  onOpen (open: boolean) {
    if (open) {
      this.$nextTick(() => this.start())
      return
    }
    this.stop()
    // Nothing is missing any more: the action that was waiting goes ahead.
    const pending = partsGate.pending
    if (pending && missingFor(this.status, pending.action).length === 0) {
      clearPending()
      pending.proceed()
    }
  }

  @Watch('dark')
  onTheme () {
    this.$nextTick(() => { this.readColours(); this.redraw() })
  }

  created () {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.media = window.matchMedia('(prefers-reduced-motion: reduce)')
      this.reduced = this.media.matches
      this.media.addEventListener?.('change', this.onMotionPreference)
    }
  }

  beforeDestroy () {
    this.stop()
    this.media?.removeEventListener?.('change', this.onMotionPreference)
    // The pop-up is gone, so nothing could finish the request.
    clearPending()
  }

  onMotionPreference (e: MediaQueryListEvent) {
    this.reduced = e.matches
    if (this.open) this.start()
  }

  dismiss () {
    clearPending()
    this.dismissedGate = { since: this.gateSince }
    this.stop()
  }

  /** Control's own colours: the dialog's text, muted text, accent and surface, light or dark. */
  readColours () {
    const canvas = this.$refs.canvas as HTMLCanvasElement | undefined
    const base = SETUP_THEMES[this.dark ? 'dark' : 'light']
    if (!canvas) { this.colours = { ...base }; return }
    const css = getComputedStyle(canvas)
    const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    this.colours = {
      ink: read('--m3d-text', base.ink),
      mute: read('--m3d-text-muted', base.mute),
      accent: read('--m3d-accent', base.accent),
      bg: read('--m3d-surface', base.bg)
    }
  }

  frame (t: number) {
    const canvas = this.$refs.canvas as HTMLCanvasElement | undefined
    const step = this.step
    if (!canvas || !step) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = canvas.width / SIZE
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawSetup(ctx, step, t, {
      size: SIZE,
      theme: this.dark ? 'dark' : 'light',
      label: false,
      reducedMotion: this.reduced,
      ...this.colours
    })
  }

  /** One frame now, for a step or theme change (the loop draws the next one itself). */
  redraw () {
    if (this.open && this.$refs.canvas) this.frame(this.reduced ? 0 : performance.now() - this.t0)
  }

  /**
   * Runs the frame loop. The canvas is made when the dialog first opens, a
   * moment after `open`, so the loop waits for it; with reduced motion it
   * draws that one still and stops.
   */
  start () {
    this.stop()
    if (!this.open) return
    let ready = false
    this.running = !this.reduced
    const tick = (now: number) => {
      this.raf = 0
      if (!this.open) return
      if (this.$refs.canvas) {
        if (!ready) { ready = true; this.readColours(); this.t0 = now }
        this.frame(this.reduced ? 0 : now - this.t0)
        if (this.reduced) return
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop () {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }
}
</script>

<style lang="scss" scoped>
.setup-parts {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}
.setup-parts__canvas {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  border-radius: 12px;
}
.setup-parts__title {
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--m3d-text);
}
.setup-parts__hint {
  margin: 0;
  font-size: 13px;
  color: var(--m3d-text-muted);
}
.setup-parts__list {
  align-self: stretch;
  margin: 12px 0 0;
  padding: 12px 0 0;
  list-style: none;
  border-top: 1px solid var(--m3d-border);
  text-align: left;
}
.setup-parts__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--m3d-text-muted);
}
.setup-parts__item--now { color: var(--m3d-text); font-weight: 500; }
.setup-parts__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--m3d-text-subtle);
}
.setup-parts__item--now .setup-parts__dot {
  border-color: var(--m3d-accent);
  background: var(--m3d-accent);
}
</style>
