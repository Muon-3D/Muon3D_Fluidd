<template>
  <button
    type="button"
    role="switch"
    class="theme-toggle"
    :class="{ 'theme-toggle--dark': dark }"
    :aria-checked="dark ? 'true' : 'false'"
    aria-label="Dark mode"
    :title="dark ? 'Switch to light' : 'Switch to dark'"
    data-tid="theme-toggle"
    @click="flip"
  >
    <span
      class="theme-toggle__track"
      aria-hidden="true"
    >
      <svg
        class="theme-toggle__far theme-toggle__far--sun"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      ><circle
        cx="12"
        cy="12"
        r="4"
      /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <svg
        class="theme-toggle__far theme-toggle__far--moon"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      <span class="theme-toggle__thumb">
        <svg
          v-if="dark"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        ><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
        ><circle
          cx="12"
          cy="12"
          r="4.5"
          fill="currentColor"
        /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      </span>
    </span>
  </button>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/**
 * Light or dark, at the top right of the bar on every page and on a phone
 * (KAN-6105). It sets the same choice as Account › Appearance; from Auto it
 * goes to the other of what is showing.
 */
@Component
export default class ThemeToggle extends Vue {
  get dark (): boolean {
    return !!this.$store.state.config.uiSettings.theme.isDark
  }

  flip () {
    return this.$store.dispatch('config/setAppearance', { mode: this.dark ? 'light' : 'dark' })
  }
}
</script>

<style lang="scss" scoped>
  .theme-toggle {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: -2px;
    }
  }

  .theme-toggle__track {
    position: relative;
    display: block;
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    box-shadow: inset 0 0 0 1px var(--m3d-border);
    transition: background-color 0.25s ease;
  }

  .theme-toggle__far {
    position: absolute;
    top: 6px;
    opacity: 0.8;
  }

  .theme-toggle__far--sun { left: 6px; }
  .theme-toggle__far--moon { right: 6px; }

  .theme-toggle__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
    transform: translateX(0);
    transition: transform 0.25s cubic-bezier(0.3, 0.7, 0.2, 1);
  }

  // Light: the thumb sits on the sun's side (left); dark: on the moon's (right).
  .theme-toggle--dark .theme-toggle__thumb {
    transform: translateX(20px);
  }

  // A phone's bar is tight: a smaller capsule, the thumb alone says which.
  @media (max-width: 699px) {
    .theme-toggle { width: 40px; }
    .theme-toggle__track { width: 36px; height: 22px; }
    .theme-toggle__far { display: none; }
    .theme-toggle__thumb { top: 3px; left: 3px; width: 16px; height: 16px; }
    .theme-toggle--dark .theme-toggle__thumb { transform: translateX(14px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-toggle__track,
    .theme-toggle__thumb {
      transition: none;
    }
  }
</style>
