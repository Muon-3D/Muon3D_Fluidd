<template>
  <v-navigation-drawer
    v-model="open"
    class="muon-nav-shell"
    :color="$vuetify.theme.currentTheme.drawer"
    :mini-variant="!showSubNavigation"
    :floating="!showSubNavigation"
    clipped
    app
  >
    <v-row
      class="fill-height"
      no-gutters
    >
      <v-navigation-drawer
        :color="$vuetify.theme.currentTheme.drawer"
        mini-variant
        :value="open"
        class="muon-nav-rail pb-16 pb-sm-0"
      >
        <div
          v-if="isMobileViewport"
          :style="`height: ${$globals.HEADER_HEIGHT}px;`"
          class="app-icon muon-mobile-brand"
        >
          <router-link to="/">
            <app-icon />
            <span class="muon-mobile-brand-copy">
              <strong>MUON</strong><small>OS</small>
            </span>
          </router-link>
        </div>

        <div
          v-show="authenticated && socketConnected"
          class="nav-items muon-nav-items"
        >
          <app-nav-item
            icon="$dash"
            exact
            to="/"
          >
            {{ $t('app.general.title.home') }}
          </app-nav-item>

          <app-nav-item
            icon="$console"
            to="/console"
          >
            {{ $t('app.general.title.console') }}
          </app-nav-item>

          <app-nav-item
            icon="$cubeScan"
            to="/preview"
          >
            {{ $t('app.general.title.gcode_preview') }}
          </app-nav-item>

          <app-nav-item
            icon="$files"
            to="/jobs"
          >
            {{ $t('app.general.title.jobs') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsHistory"
            icon="$history"
            to="/history"
          >
            {{ $t('app.general.title.history') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsTimelapse"
            icon="$video"
            to="/timelapse"
          >
            {{ $t('app.general.title.timelapse') }}
          </app-nav-item>

          <app-nav-item
            icon="$tune"
            to="/tune"
          >
            {{ $t('app.general.title.tune') }}
          </app-nav-item>

          <app-nav-item
            v-if="enableDiagnostics"
            icon="$chart"
            to="/diagnostics"
          >
            {{ $t('app.general.title.diagnostics') }}
          </app-nav-item>

          <app-nav-item
            icon="$codeJson"
            to="/configure"
          >
            {{ $t('app.general.title.configure') }}
          </app-nav-item>

          <app-nav-item
            icon="$wifi"
            to="/wifi"
          >
            {{ $t('app.general.title.wifi') }}
          </app-nav-item>

          <app-nav-item
            icon="$desktopTower"
            to="/system"
          >
            {{ $t('app.general.title.system') }}
          </app-nav-item>

          <app-nav-item
            icon="$printer3d"
            to="/fleet"
          >
            Fleet preview
          </app-nav-item>

          <app-nav-item
            icon="$cog"
            to="/settings"
          >
            {{ $t('app.general.title.settings') }}
          </app-nav-item>
        </div>
      </v-navigation-drawer>

      <router-view
        v-if="showSubNavigation"
        name="navigation"
      />
    </v-row>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class AppNavDrawer extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
  }

  get supportsTimelapse () {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get enableDiagnostics () {
    return this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  get hasSubNavigation () {
    return this.$route.meta?.hasSubNavigation ?? false
  }

  get showSubNavigation () {
    return this.hasSubNavigation && this.socketConnected && this.authenticated
  }
}
</script>

<style lang="scss" scoped>
  .app-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .muon-nav-shell {
    background: var(--m3d-surface-1) !important;
    border-right: 1px solid var(--m3d-border) !important;
    color: var(--m3d-text);
  }

  .muon-nav-rail {
    background: var(--m3d-surface-1) !important;
  }

  .muon-mobile-brand {
    border-bottom: 1px solid var(--m3d-border);
  }

  .muon-mobile-brand a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: inherit;
    text-decoration: none;
  }

  .muon-mobile-brand-copy {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    color: var(--m3d-text);
    font-family: var(--m3d-font-display);
    font-size: var(--m3d-text-xs);
    letter-spacing: 0.13em;
  }

  .muon-mobile-brand-copy strong {
    font-weight: var(--m3d-weight-regular);
  }

  .muon-mobile-brand-copy small {
    color: var(--m3d-accent);
    font-size: 0.56rem;
    font-weight: var(--m3d-weight-bold);
  }

  .muon-nav-items {
    padding: 10px 8px;
  }

  :deep(.muon-nav-items .v-list-item) {
    min-height: 48px;
    margin: 3px 0;
    border-radius: var(--m3d-radius-md);
    color: var(--m3d-text-muted);
  }

  :deep(.muon-nav-items .v-list-item:hover) {
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  :deep(.muon-nav-items .v-list-item--active) {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent) !important;
  }

  :deep(.muon-nav-items .v-list-item__icon) {
    margin: 12px 16px 12px 8px;
  }

  :deep(.muon-nav-items .v-list-item__title) {
    font-size: 0.88rem;
    font-weight: 620;
  }

  :deep(.v-navigation-drawer.no-subnav > .v-navigation-drawer__border) {
     display: none;
  }
</style>
