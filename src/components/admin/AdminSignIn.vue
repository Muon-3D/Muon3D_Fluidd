<template>
  <div class="signin">
    <section
      class="signin__card"
      data-tid="admin-signin"
      aria-labelledby="admin-signin-title"
    >
      <h2
        id="admin-signin-title"
        class="signin__title"
      >
        Sign in to continue
      </h2>
      <p class="signin__body">
        Sign in to Muon3D to open the admin portal.
      </p>
      <button
        type="button"
        class="signin__btn"
        data-tid="admin-signin-go"
        @click="go"
      >
        Sign in
      </button>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { startCentralSignIn } from '@/services/muon-cloud/centralLogin'

/**
 * PLACEHOLDER for the shared sign-in card of the sign-in spec (KAN-6102), which is not
 * ready. It is the only place the portal draws a sign-in: swap this one component
 * for the real card (keep `returnTo`: the full path and query the person asked for).
 */
export default defineComponent({
  methods: {
    go () { startCentralSignIn({ silent: false, returnTo: this.$route.fullPath }) }
  }
})
</script>

<style lang="scss" scoped>
.signin { display: grid; place-items: start center; padding: 48px 16px; }
.signin__card { width: 100%; max-width: 400px; padding: 28px; text-align: center; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); box-shadow: var(--m3d-shadow-float); color: var(--m3d-text); }
.signin__title { margin: 0 0 8px; font-family: var(--m3d-font-display); font-size: 16px; font-weight: 400; }
.signin__body { margin: 0 0 16px; font-size: 13px; color: var(--m3d-text-muted); }
.signin__btn { width: 100%; min-height: 40px; border: 0; border-radius: var(--m3d-radius-md); background: var(--m3d-accent); color: #00201e; font: inherit; font-weight: 600; cursor: pointer; }
</style>
