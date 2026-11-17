<template>
  <div
    class="auth-stage"
    :class="{ 'auth-stage--fill': fill }"
  >
    <section
      class="auth-card"
      :class="{ 'auth-card--quiet': quiet }"
      :aria-labelledby="titleId"
      data-tid="auth-card"
    >
      <div
        v-if="wordmark"
        class="auth-card__wordmark"
      >
        MUON3D
      </div>
      <h1
        :id="titleId"
        class="auth-card__title"
      >
        {{ title }}
      </h1>
      <p
        v-if="sub"
        class="auth-card__sub"
        data-tid="auth-card-sub"
      >
        {{ sub }}
      </p>
      <slot />
      <div
        v-if="$slots.alt"
        class="auth-card__alt"
      >
        <slot name="alt" />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

let uid = 0

/**
 * The one sign-in card (control-v3 sign-in storyboard): a centred glass card
 * for the Muon3D account and the printer's own login alike. On a phone it
 * fills the width and sits near the top, so the keyboard doesn't cover the
 * primary button.
 */
@Component({})
export default class AuthCard extends Vue {
  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly sub!: string

  @Prop({ type: Boolean, default: false })
  readonly wordmark!: boolean

  /** The secondary card: the printer's login, a step quieter than the account's. */
  @Prop({ type: Boolean, default: false })
  readonly quiet!: boolean

  /** Fill the page height (the console's sign-in page has no shell around it). */
  @Prop({ type: Boolean, default: false })
  readonly fill!: boolean

  readonly titleId = `auth-card-title-${++uid}`
}
</script>

<style lang="scss" scoped>
.auth-stage {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-stage--fill {
  min-height: 100vh;
}

.auth-card {
  position: relative;
  width: 440px;
  max-width: 100%;
  padding: 30px;
  border-radius: var(--m3d-radius-xl);
  background: var(--m3d-glass-thick, var(--m3d-glass));
  backdrop-filter: var(--m3d-glass-filter);
  box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge);
  color: var(--m3d-text);
}

.auth-card--quiet {
  padding: 22px;
}

.auth-card__wordmark {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.32em;
}

.auth-card__title {
  margin: 18px 0 4px;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.auth-card__wordmark + .auth-card__title {
  margin-top: 18px;
}

.auth-card--quiet .auth-card__title,
.auth-card__title:first-child {
  margin-top: 0;
}

.auth-card--quiet .auth-card__title {
  font-size: 18px;
}

.auth-card__sub {
  margin: 0 0 20px;
  color: var(--m3d-text-muted);
}

.auth-card__alt {
  margin-top: 16px;
  color: var(--m3d-text-muted);
  font-size: 0.875rem;
  text-align: center;

  :deep(a) {
    color: var(--m3d-accent);
    font-weight: 600;
    text-decoration: none;
  }
}

@media (max-width: 599px) {
  .auth-stage {
    align-items: flex-start;
    padding: 8px;
  }

  .auth-card {
    width: 100%;
    padding: 22px;
  }
}
</style>
