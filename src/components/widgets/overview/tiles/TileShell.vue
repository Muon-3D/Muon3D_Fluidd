<template>
  <section
    ref="root"
    class="ot"
    :class="{ 'ot--open': open, 'ot--bare': bare }"
    :data-tile="tile"
    @keydown.esc="close"
  >
    <component
      :is="hasPopover ? 'button' : 'div'"
      class="ot__door"
      :type="hasPopover ? 'button' : undefined"
      :aria-expanded="hasPopover ? (open ? 'true' : 'false') : undefined"
      :aria-controls="hasPopover ? popId : undefined"
      :aria-label="hasPopover ? `${title} controls` : undefined"
      :disabled="hasPopover && locked ? true : undefined"
      data-tid="tile-door"
      @click="hasPopover && $emit('toggle')"
    >
      <span
        v-if="!bare"
        class="ot__head"
      >
        <frame-icon
          v-if="icon"
          :name="icon"
          small
        />
        <span class="ot__title">{{ title }}</span>
        <span class="ot__grow" />
        <slot name="head" />
        <span
          v-if="state"
          class="ot__state"
          :class="`ot__state--${tone}`"
          data-tid="tile-state"
        >{{ state }}</span>
      </span>
      <slot />
    </component>
    <slot name="after" />
    <tile-menu
      v-if="menu.length"
      class="ot__more"
      :items="menu"
      :label="title"
    />
    <div
      v-if="hasPopover && open"
      :id="popId"
      class="ot__pop"
      role="dialog"
      :aria-label="`${title} controls`"
      data-tid="tile-popover"
    >
      <slot name="popover" />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import TileMenu from './TileMenu.vue'
import type { TileMenuItem } from '@/services/overview/tiles'

let seed = 0

/**
 * The card every Overview tile is: an icon and title, a state, a ⋯ menu for
 * the Pro-level depth, and (for the instrument tiles) a popover with the
 * full controls that opens from the tile itself. Esc or a click outside
 * closes the popover. The tile list in `registry.ts` is what places these.
 */
@Component({ components: { TileMenu } })
export default class TileShell extends Vue {
  @Prop({ type: String, required: true }) readonly tile!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, default: '' }) readonly icon!: string
  @Prop({ type: String, default: '' }) readonly state!: string
  @Prop({ type: String, default: 'off' }) readonly tone!: string
  @Prop({ type: Array, default: () => [] }) readonly menu!: TileMenuItem[]
  @Prop({ type: Boolean }) readonly open!: boolean
  /** Nothing to open (no data, or the part is disconnected). */
  @Prop({ type: Boolean }) readonly locked!: boolean
  /** No header at all: the content fills the tile (the main view). */
  @Prop({ type: Boolean }) readonly bare!: boolean

  popId = `ot-pop-${++seed}`

  get hasPopover (): boolean { return !!this.$scopedSlots.popover }

  close () { if (this.open) this.$emit('toggle') }

  onOutside (event: Event) {
    if (this.open && !(this.$refs.root as HTMLElement | undefined)?.contains(event.target as Node)) this.$emit('toggle')
  }

  mounted () { document.addEventListener('mousedown', this.onOutside) }
  beforeDestroy () { document.removeEventListener('mousedown', this.onOutside) }
}
</script>

<style lang="scss">
.ot {
  position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 16px 18px; border-radius: 22px;
  background: var(--m3d-surface); color: var(--m3d-text);
}
.ot--bare { padding: 0; overflow: hidden; }
.ot--open { z-index: 6; box-shadow: 0 0 0 1.5px var(--m3d-accent); }
.ot__door { display: flex; flex-direction: column; gap: 8px; width: 100%; min-width: 0; padding: 0; color: inherit; text-align: left; font: inherit; }
button.ot__door { cursor: pointer; }
button.ot__door:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 4px; border-radius: 12px; }
.ot__head { display: flex; align-items: center; gap: 8px; min-height: 28px; padding-right: 36px; color: var(--m3d-text-muted); }
.ot__head .frame-icon { color: var(--m3d-text-muted); }
.ot__title { color: var(--m3d-text); font-size: 15px; font-weight: 600; }
.ot__grow { flex: 1 1 auto; }
.ot__more { position: absolute; top: 14px; right: 14px; }
.ot__state { padding: 2px 9px; border-radius: 999px; background: var(--m3d-fill-2, var(--m3d-surface-2)); color: var(--m3d-text-muted); font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.ot__state--ok { background: color-mix(in srgb, var(--m3d-success) 16%, transparent); color: var(--m3d-success); }
.ot__state--warm { background: color-mix(in srgb, var(--m3d-warning) 16%, transparent); color: var(--m3d-warning); }
.ot__state--bad { background: color-mix(in srgb, var(--m3d-danger) 16%, transparent); color: var(--m3d-danger); }
.ot__state--run { background: var(--m3d-accent-soft); color: var(--m3d-accent); }
.ot__pop {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 8; display: flex; flex-direction: column; gap: 12px; width: 360px; max-width: calc(100vw - 32px); padding: 14px;
  border-radius: 22px; background: var(--m3d-surface); color: var(--m3d-text); box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border-strong);
}
@media (max-width: 599px) {
  .ot__pop { position: fixed; top: auto; right: 8px; bottom: 8px; left: 8px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; z-index: 30; }
}

/* The numbers every tile shows. */
.ot__value { font-family: var(--m3d-font-rounded); font-size: 30px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.ot__value small { margin-left: 6px; color: var(--m3d-text-muted); font-size: 14px; font-weight: 500; }
.ot__sub { color: var(--m3d-text-muted); font-size: 12.5px; }
.ot__bar { display: block; height: 4px; border-radius: 999px; background: var(--m3d-ring-track); overflow: hidden; }
.ot__bar i { display: block; height: 100%; border-radius: inherit; background: var(--m3d-accent); transition: width var(--m3d-duration-base, 0.2s) var(--m3d-ease, ease); }

/* Rows inside a popover or dialog. */
.ot__rows { display: flex; flex-direction: column; }
.ot__row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border-radius: 12px; color: var(--m3d-text) !important; font-size: 14px; font-weight: 500; text-align: left; text-decoration: none; }
a.ot__row, button.ot__row { cursor: pointer; }
a.ot__row:hover, button.ot__row:hover:not(:disabled) { background: var(--m3d-hover, var(--m3d-fill)); }
button.ot__row:disabled { opacity: 0.45; cursor: default; }
.ot__row .frame-icon { color: var(--m3d-text-muted); }
.ot__row > :last-child:not(:first-child) { margin-left: auto; }
.ot__note { margin: 0; color: var(--m3d-text-muted); font-size: 12.5px; }
.ot__lock { margin: 0; color: var(--m3d-text-subtle); font-size: 12.5px; }
</style>
