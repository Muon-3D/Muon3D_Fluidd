<template>
  <v-menu
    v-model="menu"
    bottom
    left
    offset-y
    nudge-bottom="8"
    min-width="320"
    max-width="352"
    content-class="muon-account__menu"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="muon-account__avatar mq-avatar"
        :class="{ 'muon-account__avatar--open': menu }"
        aria-label="Account"
        data-tid="account"
        v-bind="attrs"
        v-on="on"
      >
        <span class="muon-account__initials">JS</span>
      </button>
    </template>
    <div
      class="acct-menu"
      role="menu"
      aria-label="Account"
    >
      <div class="acct-menu__who">
        <span class="acct-menu__avatar">JS</span>
        <span class="acct-menu__names">
          <b>Jack Smith</b>
          <span>jack@muon3d.com</span>
        </span>
      </div>
      <div class="acct-menu__rule" />
      <a
        href="#"
        class="acct-menu__item"
        role="menuitem"
        @click.prevent
      ><frame-icon
        name="user"
        small
      />Manage your account</a>
      <a
        href="#"
        class="acct-menu__item"
        role="menuitem"
        @click.prevent
      ><frame-icon
        name="library"
        small
      />Your Library</a>
      <a
        href="#"
        class="acct-menu__item"
        role="menuitem"
        @click.prevent
      ><frame-icon
        name="settings"
        small
      />Settings</a>
      <button
        type="button"
        class="acct-menu__item"
        role="menuitem"
        data-tid="account-keys"
      >
        <frame-icon
          name="keyboard"
          small
        />Keyboard shortcuts<span class="acct-menu__key">?</span>
      </button>
      <div class="acct-menu__rule" />
      <span class="acct-menu__caps">This printer</span>
      <span class="acct-menu__note"><frame-icon
        name="shield"
        small
      />You own Boxwood</span>
      <button
        type="button"
        class="acct-menu__item"
        role="menuitem"
      >
        <frame-icon
          name="logout"
          small
        />Sign out
      </button>
    </div>
  </v-menu>
</template>

<script>
export default { data: () => ({ menu: false }) }
</script>

<style lang="scss" scoped>
.mq-avatar { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; }
.mq-avatar:hover { background: var(--m3d-hover); }
.muon-account__avatar--open { box-shadow: 0 0 0 2px var(--m3d-accent); }
.muon-account__initials { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: color-mix(in srgb, var(--m3d-accent) 32%, var(--m3d-surface-2)); color: var(--m3d-text); font-size: 13px; font-weight: 600; }
</style>
