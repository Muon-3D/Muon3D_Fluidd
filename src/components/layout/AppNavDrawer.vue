<template>
  <v-navigation-drawer
    v-model="open"
    class="muon-nav"
    :class="{ 'muon-nav--rail': rail }"
    :color="$vuetify.theme.currentTheme.drawer"
    :width="$globals.NAVIGATION_DRAWER_WIDTH"
    :mini-variant="rail"
    :mini-variant-width="$globals.NAVIGATION_RAIL_WIDTH"
    clipped
    app
  >
    <router-link
      v-if="isMobileViewport"
      to="/"
      class="muon-nav__brand"
      :style="`height: ${$globals.HEADER_HEIGHT}px;`"
    >
      <span class="muon-wordmark">MUON3D</span>
    </router-link>

    <nav
      v-show="authenticated && socketConnected"
      class="muon-nav__body"
    >
      <div class="muon-nav__group">
        <div class="muon-nav__label">
          {{ $t('app.general.title.nav_print') }}
        </div>

        <app-nav-item
          icon="$dash"
          exact
          to="/"
        >
          {{ $t('app.general.title.home') }}
        </app-nav-item>

        <app-nav-item
          icon="$files"
          to="/jobs"
        >
          {{ $t('app.general.title.jobs') }}
        </app-nav-item>

        <app-nav-item
          icon="$cubeScan"
          to="/preview"
        >
          {{ $t('app.general.title.gcode_preview') }}
        </app-nav-item>

        <app-nav-item
          icon="$console"
          to="/console"
        >
          {{ $t('app.general.title.console') }}
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
      </div>

      <div class="muon-nav__group">
        <div class="muon-nav__label">
          {{ $t('app.general.title.nav_machine') }}
        </div>

        <app-nav-item
          icon="$tune"
          to="/tune"
        >
          {{ $t('app.general.title.tune') }}
        </app-nav-item>

        <app-nav-item
          icon="$codeJson"
          to="/configure"
        >
          {{ $t('app.general.title.configure') }}
        </app-nav-item>

        <app-nav-item
          v-if="enableDiagnostics"
          icon="$chart"
          to="/diagnostics"
        >
          {{ $t('app.general.title.diagnostics') }}
        </app-nav-item>
      </div>

      <div class="muon-nav__group">
        <div class="muon-nav__label">
          {{ $t('app.general.title.nav_system') }}
        </div>

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
          icon="$cog"
          to="/settings"
        >
          {{ $t('app.general.title.settings') }}
        </app-nav-item>

        <router-view
          v-if="showSubNavigation && !rail"
          name="navigation"
          class="muon-nav__sub"
        />

        <app-nav-item
          icon="$printer3d"
          to="/fleet"
        >
          Fleet preview
        </app-nav-item>
      </div>
    </nav>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'

@Component<AppNavDrawer>({
  provide () {
    return {
      isNavRail: () => this.rail
    }
  }
})
export default class AppNavDrawer extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  // Below the lg breakpoint the labelled sidebar would take a third of the
  // screen, so it collapses to an icon rail with tooltips.
  get rail (): boolean {
    return !this.isMobileViewport && this.$vuetify.breakpoint.mdAndDown
  }

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
  .muon-nav :deep(.v-navigation-drawer__border) {
    background-color: var(--m3d-border) !important;
  }

  .muon-nav__brand {
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--m3d-border);
    color: var(--m3d-text);
    text-decoration: none;
  }

  .muon-nav__body {
    padding: 8px 8px 24px;
  }

  .muon-nav__group + .muon-nav__group {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--m3d-border);
  }

  .muon-nav__label {
    padding: 8px 12px 6px;
    color: var(--m3d-text-subtle);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .muon-nav--rail {
    .muon-nav__label {
      height: 0;
      padding: 0;
      overflow: hidden;
    }

    .muon-nav__group + .muon-nav__group {
      margin-top: 6px;
      padding-top: 6px;
    }

    :deep(.muon-nav-item) {
      justify-content: center;
      padding: 0;
    }

    :deep(.muon-nav-item .v-list-item__icon) {
      margin: 0;
    }

    :deep(.muon-nav-item .v-list-item__content),
    :deep(.muon-nav-item .muon-nav-item__kbd) {
      display: none;
    }
  }

  .muon-nav__sub {
    margin-top: 2px;
    margin-bottom: 4px;
  }
</style>
