<template>
  <span
    ref="root"
    class="tm"
  >
    <button
      type="button"
      class="tm__btn"
      :aria-label="`More for ${label}`"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      data-tid="tile-more"
      @click.stop="open = !open"
    >
      <frame-icon name="more" />
    </button>
    <div
      v-if="open"
      class="tm__menu"
      role="menu"
      data-tid="tile-menu"
      @keydown.esc.stop="open = false"
    >
      <template v-for="item in items">
        <router-link
          v-if="item.to && !item.disabled"
          :key="item.id"
          class="tm__item"
          role="menuitem"
          :to="item.to"
          :data-menu="item.id"
          @click.native="open = false"
        >
          {{ item.label }}
        </router-link>
        <button
          v-else
          :key="item.id"
          type="button"
          class="tm__item"
          role="menuitem"
          :disabled="item.disabled || !!item.to"
          :aria-checked="item.toggle ? (item.on ? 'true' : 'false') : undefined"
          :data-menu="item.id"
          @click="choose(item)"
        >
          <span>{{ item.label }}</span>
          <span
            v-if="item.toggle"
            class="tm__tick"
            aria-hidden="true"
          >{{ item.on ? 'On' : 'Off' }}</span>
          <span
            v-else-if="item.hint"
            class="tm__hint"
          >{{ item.hint }}</span>
        </button>
      </template>
    </div>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { TileMenuItem } from '@/services/overview/tiles'

/**
 * A tile's ⋯ menu: the Pro-level depth, one tap away. Items are links to a
 * page or things to do; a switch says whether it is on. Closes on a choice,
 * Esc, or a click anywhere else.
 */
@Component({})
export default class TileMenu extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly items!: TileMenuItem[]
  @Prop({ type: String, default: 'this tile' }) readonly label!: string

  open = false

  choose (item: TileMenuItem) {
    if (item.disabled) return
    if (!item.toggle) this.open = false
    item.action?.()
  }

  onOutside (event: Event) {
    if (this.open && !(this.$refs.root as HTMLElement | undefined)?.contains(event.target as Node)) this.open = false
  }

  mounted () { document.addEventListener('mousedown', this.onOutside) }
  beforeDestroy () { document.removeEventListener('mousedown', this.onOutside) }
}
</script>

<style lang="scss" scoped>
.tm { position: relative; display: inline-flex; }
.tm__btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; color: var(--m3d-text-muted); cursor: pointer; }
.tm__btn:hover, .tm__btn[aria-expanded='true'] { background: var(--m3d-hover, var(--m3d-fill)); color: var(--m3d-text); }
.tm__btn .frame-icon { color: inherit; }
.tm__menu {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 20; display: flex; flex-direction: column; min-width: 250px; max-width: 80vw; padding: 6px;
  border-radius: 18px; background: var(--m3d-glass-thick, var(--m3d-surface)); color: var(--m3d-text);
  box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border-strong); backdrop-filter: var(--m3d-glass-filter);
}
.tm__item { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 9px 12px; border-radius: 12px; color: var(--m3d-text) !important; font-size: 14px; font-weight: 500; text-align: left; text-decoration: none; cursor: pointer; }
.tm__item:hover:not(:disabled) { background: var(--m3d-hover, var(--m3d-fill)); }
.tm__item:disabled { opacity: 0.45; cursor: default; }
.tm__hint, .tm__tick { color: var(--m3d-text-subtle); font-family: var(--m3d-font-mono); font-size: 12px; }
.tm__item[aria-checked='true'] .tm__tick { color: var(--m3d-accent); }
</style>
