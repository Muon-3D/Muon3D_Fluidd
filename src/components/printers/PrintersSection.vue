<template>
  <section class="psec">
    <div class="psec__head">
      <slot name="title">
        <h2
          class="psec__name"
          :class="{ 'psec__name--muted': muted }"
        >
          {{ title }}
        </h2>
      </slot>
      <span
        v-if="count != null"
        class="psec__count"
        data-tid="section-count"
      >{{ count }}</span>
      <slot name="after" />
      <span class="psec__grow" />
      <span
        v-if="note"
        class="psec__note"
      >{{ note }}</span>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/** A section of the All printers page: a title, a muted count, an optional note on the right, then its content. */
@Component({})
export default class PrintersSection extends Vue {
  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: Number, default: null })
  readonly count!: number | null

  @Prop({ type: String, default: '' })
  readonly note!: string

  @Prop({ type: Boolean })
  readonly muted?: boolean
}
</script>

<style lang="scss" scoped>
  .psec {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    border-radius: 26px;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease);
  }

  .psec__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 10px;
    min-height: 32px;
  }

  .psec__name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .psec__name--muted { color: var(--m3d-text-muted); }

  .psec__count,
  .psec__note {
    color: var(--m3d-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .psec__note { font-size: 13px; }
  .psec__grow { flex: 1 1 auto; }

  @media (max-width: 699px) {
    .psec__name { font-size: 17px; }
    .psec__note { display: none; }
  }
</style>
