<template>
  <section
    class="setup-step"
    :class="{ 'is-flat': flat }"
    :aria-labelledby="titleId"
  >
    <p
      v-if="eyebrow"
      class="setup-step__eyebrow"
      data-tid="step-eyebrow"
    >
      {{ eyebrow }}
    </p>
    <h1
      :id="titleId"
      class="setup-step__title"
    >
      {{ title }}
    </h1>
    <p
      v-if="sub"
      class="setup-step__sub"
    >
      {{ sub }}
    </p>
    <div class="setup-step__body">
      <slot />
    </div>
    <footer
      v-if="$slots.footer"
      class="setup-step__foot"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

let uid = 0

/**
 * One setup step (v3 setup storyboard): eyebrow, title, one muted line, the
 * step's content, then the footer — Back on the left, any skip, then the one
 * primary on the right. On a phone the primary sits on top, full width.
 */
@Component({})
export default class SetupStepCard extends Vue {
  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly sub!: string

  /** Inside a dialog that is already the card. */
  @Prop({ type: Boolean, default: false })
  readonly flat!: boolean

  readonly titleId = `setup-step-${++uid}`
}
</script>

<style lang="scss" scoped>
.setup-step {
  width: 100%;
  padding: 28px;
  border-radius: var(--m3d-radius-lg);
  background: var(--m3d-glass-thick);
  box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge);
  backdrop-filter: var(--m3d-glass-filter);

  &.is-flat {
    padding: 0;
    background: none;
    box-shadow: none;
    backdrop-filter: none;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: var(--m3d-text-xs);
    font-weight: var(--m3d-weight-medium);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--m3d-text-muted);
  }

  &__title {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: var(--m3d-weight-semibold, 600);
    color: var(--m3d-text);
  }

  &__sub {
    margin: 0 0 18px;
    color: var(--m3d-text-muted);
    font-size: var(--m3d-text-sm);
  }

  &__foot {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--m3d-border);

    ::v-deep .setup-step__back {
      margin-right: auto;
    }
  }
}

@media (max-width: 699px) {
  .setup-step {
    padding: 20px 16px;

    &__foot {
      flex-direction: column-reverse;
      align-items: stretch;

      ::v-deep .v-btn {
        width: 100%;
        margin: 0 !important;
      }

      ::v-deep .setup-step__back {
        margin-right: 0;
      }
    }
  }
}
</style>
