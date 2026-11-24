<!--
  The MUON3D account card's shell (KAN-6114, spec 4.2): brand row, card,
  heading, one muted line, an alert slot, the body and a footer. The same
  card for every surface: it lives in one place, the console's /#/sign-in,
  and `SignInCard` fills it. No Vuetify, so it paints without the rest of
  Control and can be lifted into another app with `muon3d-auth.scss`.
-->
<template>
  <component
    :is="page ? 'main' : 'div'"
    :class="{ 'auth-page': page }"
  >
    <div
      v-if="page"
      class="auth-brand muon-wordmark"
    >
      MUON3D
    </div>
    <section
      class="auth-card"
      data-tid="auth-card"
    >
      <h1
        class="auth-title"
        data-tid="auth-title"
      >
        {{ title }}
      </h1>
      <p
        v-if="continuing"
        class="auth-sub"
        data-tid="sign-in-continuing"
      >
        Continuing to <strong>{{ continuing }}</strong>
      </p>
      <p
        v-else-if="subtitle"
        class="auth-sub"
      >
        {{ subtitle }}
      </p>
      <slot name="alert" />
      <slot />
      <p
        v-if="$slots.footer"
        class="auth-foot"
      >
        <slot name="footer" />
      </p>
    </section>
  </component>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class AuthCard extends Vue {
  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly subtitle!: string

  /** The surface the person is on their way to ("Library"), from the fixed client map; never from a URL. */
  @Prop({ type: String, default: null })
  readonly continuing!: string | null

  /** The full page (brand row, centred). Off when the card sits inside another page. */
  @Prop({ type: Boolean, default: true })
  readonly page!: boolean
}
</script>
