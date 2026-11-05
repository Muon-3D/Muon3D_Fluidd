<template>
  <v-menu
    v-model="open"
    bottom
    left
    offset-y
    nudge-bottom="8"
    min-width="280"
    content-class="muon-account__menu"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="app-header__icon mq-btn"
        :class="{ 'mq-btn--open': open }"
        aria-label="Quick actions"
        data-tid="quick-actions"
        v-bind="attrs"
        v-on="on"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></svg>
      </button>
    </template>
    <div
      class="acct-menu"
      role="menu"
      aria-label="Quick actions"
    >
      <span class="acct-menu__caps">Quick actions</span>
      <button
        v-for="a in actions"
        :key="a.label"
        type="button"
        class="acct-menu__item"
        role="menuitem"
        @click="open = false"
      >
        <frame-icon
          :name="a.icon"
          small
        />{{ a.label }}<span
          v-if="a.hint"
          class="acct-menu__key"
        >{{ a.hint }}</span>
      </button>
      <div class="acct-menu__rule" />
      <button
        type="button"
        class="acct-menu__item"
        role="menuitem"
        @click="open = false"
      >
        <frame-icon
          name="refresh"
          small
        />Restart Klipper
      </button>
      <button
        type="button"
        class="acct-menu__item"
        role="menuitem"
        @click="open = false"
      >
        <frame-icon
          name="power"
          small
        />Firmware restart
      </button>
    </div>
  </v-menu>
</template>

<script>
export default {
  data: () => ({
    open: false,
    actions: [
      { icon: 'home', label: 'Home all axes', hint: 'G28' },
      { icon: 'flame', label: 'Preheat PLA', hint: '215 / 60' },
      { icon: 'snow', label: 'Cool down' },
      { icon: 'spool', label: 'Change filament' },
      { icon: 'plate', label: 'Level the bed' },
      { icon: 'motorsOff', label: 'Turn motors off' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.mq-btn--open { background: var(--m3d-surface-2); color: var(--m3d-text); }
</style>
