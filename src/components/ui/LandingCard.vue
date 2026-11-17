<template>
  <div
    class="landing"
    :class="{ 'landing--page': page }"
  >
    <section
      class="landing-card"
      :aria-labelledby="titleId"
      data-tid="landing-card"
    >
      <span
        v-if="icon"
        class="landing-card__icon"
        :class="`landing-card__icon--${tone}`"
        data-tid="landing-icon"
      >
        <frame-icon
          :name="icon"
          large
        />
      </span>
      <h1
        :id="titleId"
        class="landing-card__title"
      >
        {{ title }}
      </h1>
      <p
        v-if="sub"
        class="landing-card__sub"
        data-tid="landing-sub"
      >
        {{ sub }}
      </p>
      <div
        v-if="$slots.default"
        class="landing-card__body"
      >
        <slot />
      </div>
      <footer
        v-if="$slots.foot"
        class="landing-card__foot"
      >
        <slot name="foot" />
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import '@/scss/muon3d-library.scss'

let next = 0

/**
 * The one centred card a page from outside Control lands on (link, join,
 * print hand-off) and the full-page states (404): icon square, title, one
 * muted line, the body, then the buttons with one primary.
 */
@Component({ components: { FrameIcon } })
export default class LandingCard extends Vue {
  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly sub!: string

  @Prop({ type: String, default: '' })
  readonly icon!: string

  @Prop({ type: String, default: 'accent' })
  readonly tone!: 'accent' | 'ok' | 'warn' | 'danger' | 'muted'

  /** Fill the page and centre the card in it, for a page with no other content. */
  @Prop({ type: Boolean, default: false })
  readonly page!: boolean

  readonly titleId = `landing-title-${++next}`
}
</script>

<style lang="scss" scoped>
  .landing {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 32px 16px 40px;
    color: var(--m3d-text);
  }

  .landing--page {
    align-items: center;
    min-height: calc(100vh - 120px);
  }

  .landing-card {
    display: flex;
    flex-direction: column;
    width: min(460px, 100%);
    padding: 28px;
    border-radius: var(--m3d-radius-xl, 28px);
    background: var(--m3d-glass-thick, var(--m3d-surface));
    backdrop-filter: var(--m3d-glass-filter);
    box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge);
  }

  .landing-card__icon {
    display: inline-grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin-bottom: 14px;
    border-radius: 15px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .landing-card__icon--ok {
    background: color-mix(in srgb, var(--m3d-success) 16%, transparent);
    color: var(--m3d-success);
  }

  .landing-card__icon--warn {
    background: color-mix(in srgb, var(--m3d-warning) 16%, transparent);
    color: var(--m3d-warning);
  }

  .landing-card__icon--danger {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger);
  }

  .landing-card__icon--muted {
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
  }

  .landing-card__title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .landing-card__sub {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .landing-card__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    font-size: 14px;
  }

  .landing-card__foot {
    display: flex;
    gap: 10px;
    margin-top: 22px;

    ::v-deep .lib-btn {
      height: 46px;
    }

    ::v-deep .lib-btn--pri {
      flex: 1;
      justify-content: center;
    }
  }

  @media (max-width: 599px) {
    .landing {
      padding: 8px;
    }

    .landing--page {
      align-items: flex-start;
      min-height: 0;
    }

    .landing-card {
      padding: 20px 16px;
    }
  }
</style>
