<template>
  <section
    class="cmac"
    data-tid="console-macros"
  >
    <header class="cmac__head">
      <h2><frame-icon name="console" /> Macros</h2>
      <a
        class="cmac__all"
        :href="allLink"
        @click.prevent="$router.push(allLink)"
      >All {{ macros.length }}</a>
    </header>
    <ul
      v-if="top.length"
      class="cmac__list"
    >
      <li
        v-for="m in top"
        :key="m.name"
      >
        <button
          type="button"
          :disabled="disabled(m)"
          :title="m.description || m.name"
          :data-tid="`console-macro-${m.name}`"
          @click="$emit('run', m)"
        >
          <span class="cmac__name">{{ m.name }}</span>
          <frame-icon
            name="chevronRight"
            small
          />
        </button>
      </li>
    </ul>
    <p
      v-else
      class="cmac__none"
    >
      This printer has no macros to show.
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MacrosMixin, { type ShownMacro } from '@/mixins/macros'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/** A short list of the macros you'd reach for. Tapping one runs it, or, if it needs values, puts it in the line to fill in. */
@Component({})
export default class ConsoleMacros extends Mixins(MacrosMixin) {
  @Prop({ type: Boolean, default: false }) readonly locked!: boolean
  @Prop({ type: Boolean, default: false }) readonly busy!: boolean

  get macros (): ShownMacro[] { return this.arrangedMacros }
  get top (): ShownMacro[] { return this.topMacroList(3) }
  get allLink (): string { return scopedPath('/control', activeSlug()) }

  disabled (m: ShownMacro): boolean {
    return this.locked || (m.disabledWhilePrinting && this.busy)
  }
}
</script>

<style lang="scss" scoped>
  .cmac {
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .cmac__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }
  }

  .cmac__all {
    color: var(--m3d-accent) !important;
    font-size: 13px;
    text-decoration: none;
  }

  .cmac__list {
    margin: 0;
    padding: 0;
    overflow: hidden;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    list-style: none;

    li + li { border-top: 1px solid var(--m3d-border); }

    button {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 52px;
      padding: 0 16px;
      color: var(--m3d-text);
      font-size: 14px;
      font-weight: 600;
      text-align: left;

      &:disabled { opacity: 0.45; }
    }
  }

  .cmac__name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .cmac__none { margin: 0; color: var(--m3d-text-muted); font-size: 14px; }
</style>
