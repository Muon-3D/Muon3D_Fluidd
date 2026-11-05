<template>
  <span class="mm">
    <button
      v-if="edit"
      type="button"
      class="mm__btn mm__btn--x"
      aria-label="Remove this tile"
    >
      <frame-icon
        name="x"
        small
      />
    </button>
    <v-menu
      v-else
      bottom
      left
      offset-y
      min-width="240"
      content-class="muon-account__menu"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="mm__btn"
          aria-label="More"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <div
        class="acct-menu"
        role="menu"
      >
        <button
          v-for="i in items"
          :key="i"
          type="button"
          class="acct-menu__item"
          role="menuitem"
        >
          {{ i }}
        </button>
      </div>
    </v-menu>
  </span>
</template>

<script>
export default { props: { items: { type: Array, default: () => [] }, edit: Boolean } }
</script>

<style lang="scss" scoped>
.mm { display: inline-flex; }
.mm__btn { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; color: var(--m3d-text-muted); cursor: pointer; }
.mm__btn:hover { background: var(--m3d-hover); color: var(--m3d-text); }
.mm__btn .frame-icon { color: inherit; }
.mm__btn--x { background: var(--m3d-fill); }
</style>
