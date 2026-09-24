<template>
  <v-menu
    v-if="show"
    open-on-hover
    offset-y
    left
    :close-delay="250"
    max-width="380"
    content-class="app-status-alerts__menu"
  >
    <template #activator="{ on, attrs }">
      <app-btn
        fab
        small
        :elevation="0"
        class="toolbar-action toolbar-alerts mr-1 bg-transparent"
        :class="`toolbar-alerts--${tone}`"
        color="transparent"
        :aria-label="summary"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon :color="tone">
          $warning
        </v-icon>
      </app-btn>
    </template>

    <v-card class="app-status-alerts">
      <section
        v-if="!klippyReady"
        class="app-status-alerts__section"
      >
        <div class="app-status-alerts__title error--text">
          Klipper: {{ klippyState }}
        </div>
        <div
          class="app-status-alerts__text"
          v-html="klippyStateMessage"
        />
      </section>

      <section
        v-for="group in groups"
        :key="group.title"
        class="app-status-alerts__section"
      >
        <div class="app-status-alerts__title">
          {{ group.title }}
        </div>
        <ul class="app-status-alerts__list">
          <li
            v-for="(item, index) in group.items"
            :key="index"
            v-html="linkExternalUrls(item)"
          />
        </ul>
        <div
          v-if="group.help"
          class="app-status-alerts__help"
          v-html="group.help"
        />
      </section>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Globals } from '@/globals'
import linkExternalUrls from '@/util/link-external-urls'

interface AlertGroup {
  title: string;
  items: string[];
  help?: string;
}

// Klipper's state when it is not ready, and every printer, Klipper and
// Moonraker warning, behind one toolbar icon: red for an error, orange for
// warnings. It replaces the status card that sat above every page.
@Component({})
export default class AppStatusAlerts extends Mixins(StateMixin) {
  get show (): boolean {
    return this.socketConnected && (!this.klippyReady || this.groups.length > 0)
  }

  get tone (): 'error' | 'warning' {
    return this.klippyReady ? 'warning' : 'error'
  }

  get summary (): string {
    if (!this.klippyReady) return `Klipper: ${this.klippyState}`
    return this.groups.map(group => group.title).join(' ')
  }

  get groups (): AlertGroup[] {
    const getters = this.$store.getters
    const groups: AlertGroup[] = []

    const printerWarnings = getters['printer/getPrinterWarnings'] as Array<{ message: string }>
    if (printerWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: Globals.PRODUCT_NAME }),
        items: printerWarnings.map(warning => warning.message),
        help: this.$tc('app.general.error.app_setup_link', undefined, { url: Globals.DOCS_REQUIRED_CONFIGURATION })
      })
    }

    const klipperWarnings = getters['printer/getKlipperWarnings'] as Array<{ message: string }>
    if (klipperWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: 'Klipper' }),
        items: klipperWarnings.map(warning => warning.message)
      })
    }

    const failedComponents = getters['printer/getMoonrakerFailedComponents'] as string[]
    if (failedComponents.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.failed_components'),
        items: failedComponents,
        help: this.$tc('app.general.error.components_config', undefined, { url: Globals.DOCS_MOONRAKER_COMPONENTS })
      })
    }

    const moonrakerWarnings = getters['printer/getMoonrakerWarnings'] as string[]
    if (moonrakerWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: 'Moonraker' }),
        items: moonrakerWarnings
      })
    }

    return groups
  }

  linkExternalUrls = linkExternalUrls
}
</script>

<style lang="scss" scoped>
.app-status-alerts {
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.45;

  &__section + &__section {
    margin-top: 12px;
  }

  &__title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  &__list {
    padding-left: 18px;
    margin: 0;
  }

  &__help {
    margin-top: 6px;
    opacity: 0.72;
  }
}
</style>
