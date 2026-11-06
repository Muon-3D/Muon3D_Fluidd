<template>
  <section
    class="mtile"
    :class="{ 'mtile--flush': flush }"
  >
    <header
      v-if="title"
      class="mtile__head"
    >
      <h2 class="mtile__title">
        <frame-icon
          v-if="icon"
          :name="icon"
        />
        {{ title }}
      </h2>
      <span
        v-if="$slots.aside"
        class="mtile__aside"
      ><slot name="aside" /></span>
    </header>
    <slot />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * A tile of Maintenance and Bed: an icon and a bold title on the left, a
 * status or an action on the right, then its content. `flush` lets a list
 * run edge to edge, with hairlines between its rows.
 */
@Component({})
export default class MaintenanceTile extends Vue {
  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly icon!: string

  @Prop({ type: Boolean })
  readonly flush?: boolean
}
</script>

<style lang="scss" scoped>
  .mtile {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .mtile--flush {
    padding: 0 0 6px;
    gap: 6px;

    .mtile__head {
      padding: 16px 18px 0;
    }
  }

  .mtile__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    min-width: 0;
  }

  .mtile__title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }

  .mtile__aside {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
