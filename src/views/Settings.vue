<template>
  <div
    class="settings-page"
    :class="{ 'settings-page--phone': isMobileViewport }"
    data-tid="settings-page"
  >
    <router-link
      v-if="isMobileViewport && current"
      :to="listTo"
      class="settings-back"
      data-tid="settings-back"
    >
      <frame-icon
        name="chevronLeft"
        small
      />
      Settings
    </router-link>

    <div class="settings-body">
      <div
        v-if="showList"
        class="settings-side"
      >
        <label class="settings-search">
          <frame-icon
            name="search"
            small
          />
          <input
            v-model="query"
            type="search"
            placeholder="Search settings…"
            aria-label="Search settings"
            data-tid="settings-search"
          >
        </label>
        <nav
          class="settings-list"
          aria-label="Settings sections"
        >
          <router-link
            v-for="section in listed"
            :key="section.id"
            :to="linkTo(section)"
            class="settings-list__item"
            :class="{ 'settings-list__item--on': section === current }"
            :aria-current="section === current ? 'page' : undefined"
            :data-tid="`settings-${section.id}`"
          >
            <span class="settings-list__ico"><frame-icon :name="section.icon" /></span>
            <span class="settings-list__label">{{ section.label }}</span>
            <span
              v-if="hintOf(section)"
              class="settings-list__hint"
              :class="{ 'settings-list__hint--warn': section.id === 'updates' && (updateCount > 0 || hintOf(section) === 'update ready') }"
            >{{ hintOf(section) }}</span>
            <frame-icon
              v-if="isMobileViewport"
              name="chevronRight"
              small
              class="settings-list__go"
            />
          </router-link>
          <p
            v-if="!listed.length && !developer"
            class="settings-list__none"
            data-tid="settings-none"
          >
            Nothing matches "{{ query }}".
          </p>
        </nav>
        <nav
          v-if="developer"
          class="settings-list settings-list--dev"
          aria-label="Developer mode"
        >
          <router-link
            :to="linkTo(developer)"
            class="settings-list__item settings-list__item--dev"
            :class="{ 'settings-list__item--on': developer === current }"
            :aria-current="developer === current ? 'page' : undefined"
            data-tid="settings-developer"
          >
            <span class="settings-list__ico"><frame-icon :name="developer.icon" /></span>
            <span class="settings-list__label">
              Developer mode
              <small>{{ developerLine }}</small>
            </span>
            <frame-icon
              v-if="isMobileViewport"
              name="chevronRight"
              small
              class="settings-list__go"
            />
          </router-link>
        </nav>
      </div>

      <div
        v-if="showPane"
        class="settings-pane"
        data-tid="settings-pane"
      >
        <wifi-page v-if="ownPage === 'network'" />
        <system-page v-else-if="ownPage === 'system'" />
        <router-view v-else-if="authenticated && socketConnected" />
        <template v-if="!inChild && !ownPage && current">
          <general-settings v-if="shows('general')" />
          <theme-settings v-if="shows('theme')" />
          <access-settings v-if="shows('access') && supports('muon_access')" />
          <protection-settings v-else-if="shows('protection') && supports('muon_protection')" />
          <auth-settings v-if="shows('auth') && supports('authorization')" />
          <software-settings v-if="shows('versions')" />
          <camera-settings v-if="shows('camera')" />
          <preset-settings v-if="shows('presets')" />
          <macro-edit-list v-if="shows('macros')" />
          <macro-settings v-if="shows('macros')" />
          <timelapse-settings v-if="shows('timelapse')" />
          <spoolman-settings v-if="shows('spoolman')" />
          <console-settings v-if="shows('console')" />
          <file-browser-settings v-if="shows('browser')" />
          <file-editor-settings v-if="shows('editor')" />
          <toolhead-settings v-if="shows('toolhead')" />
          <gcode-preview-settings v-if="shows('gcodePreview')" />
          <developer-mode-settings v-if="shows('developer')" />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { MOVED_TO_ACCOUNT, searchSettingsSections, settingsSectionFor, visibleSettingsSections, type SettingsSection } from '@/services/settings/sections'
import { printerNameParts } from '@/util/printer-name'

import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import PresetSettings from '@/components/settings/presets/PresetSettings.vue'
import CameraSettings from '@/components/settings/cameras/CameraSettings.vue'
import ToolheadSettings from '@/components/settings/ToolheadSettings.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import SoftwareSettings from '@/components/settings/SoftwareSettings.vue'
import { updateWatch } from '@/services/updates/watch'
import GcodePreviewSettings from '@/components/settings/GcodePreviewSettings.vue'
import AuthSettings from '@/components/settings/auth/AuthSettings.vue'
import ConsoleSettings from '@/components/settings/console/ConsoleSettings.vue'
import FileBrowserSettings from '@/components/settings/FileBrowserSettings.vue'
import FileEditorSettings from '@/components/settings/FileEditorSettings.vue'
import TimelapseSettings from '@/components/settings/timelapse/TimelapseSettings.vue'
import SpoolmanSettings from '@/components/settings/SpoolmanSettings.vue'
import ProtectionSettings from '@/components/settings/ProtectionSettings.vue'
import AccessSettings from '@/components/settings/AccessSettings.vue'
import WifiPage from '@/views/Wifi.vue'
import MacroEditList from '@/components/settings/macros/MacroEditList.vue'
import DeveloperModeSettings from '@/components/settings/DeveloperModeSettings.vue'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import SystemPage from '@/views/System.vue'

const countOrNone = (count: number) => count ? String(count) : 'none'

/** The Moonraker components a settings section can depend on. */
const SECTION_COMPONENTS = ['authorization', 'update_manager', 'timelapse', 'spoolman', 'muon_access', 'muon_protection']

/**
 * Settings (`/boxwood-367a/settings`): the sections on the left, the one
 * chosen on the right, by the address's anchor (`#versions` is Updates).
 * Wi-Fi and System keep addresses of their own (`/wifi`, `/system`) and
 * open here too, the list still beside them. On a phone the list is a
 * page, and a section opens over it with a way back.
 */
@Component({
  components: {
    WifiPage,
    SystemPage,
    MacroEditList,
    DeveloperModeSettings,
    ProtectionSettings,
    AccessSettings,
    SpoolmanSettings,
    TimelapseSettings,
    MacroSettings,
    GeneralSettings,
    PresetSettings,
    CameraSettings,
    ToolheadSettings,
    ThemeSettings,
    SoftwareSettings,
    GcodePreviewSettings,
    AuthSettings,
    ConsoleSettings,
    FileBrowserSettings,
    FileEditorSettings
  }
})
export default class Settings extends Mixins(StateMixin, BrowserMixin) {
  created () {
    // Settings â€º Library moved to the account (KAN-532): an old address goes there.
    const moved = MOVED_TO_ACCOUNT[this.$route.hash.replace(/^#/, '')]
    if (moved) this.$router.replace(scopedPath(moved, activeSlug())).catch(() => {})
  }

  mounted () {
    refreshDevMode()
  }

  supports (component: string): boolean {
    return this.$store.getters['server/componentSupport'](component) as boolean
  }

  get sections (): SettingsSection[] {
    return visibleSettingsSections({ components: SECTION_COMPONENTS.filter(name => this.supports(name)) })
  }

  /** A macro category's page, inside Settings. */
  get inChild (): boolean {
    return this.$route.matched.length > 1
  }

  /** Wi-Fi's or System's own page, opened at its own address. */
  get ownPage (): 'network' | 'system' | null {
    if (this.$route.name === 'Wifi') return 'network'
    if (this.$route.name === 'System') return 'system'
    return null
  }

  /** The section shown: the anchor's, Macros for a category, else the first on a wider screen. */
  get current (): SettingsSection | null {
    if (this.ownPage) return this.sections.find(s => s.id === this.ownPage) ?? null
    if (this.inChild) return this.sections.find(s => s.id === 'macros') ?? null
    const section = settingsSectionFor(this.$route.hash, this.sections)
    if (section || this.isMobileViewport) return section
    return this.sections.find(s => !s.page) ?? null
  }

  /** What the search box holds; it narrows the list on the left. */
  query = ''

  /** The sections the list shows: all of them but Developer mode, which sits apart below. */
  get listed (): SettingsSection[] {
    return searchSettingsSections(this.sections.filter(s => s.id !== 'developer'), this.query)
  }

  /** Developer mode: its own tile below the list, off unless someone turned it on. Hidden when a search leaves it out. */
  get developer (): SettingsSection | null {
    const section = this.sections.find(s => s.id === 'developer') ?? null
    if (!section) return null
    return searchSettingsSections([section], this.query).length ? section : null
  }

  get developerLine (): string {
    const state = devModeState.enabled === null ? '' : devModeState.enabled ? 'On. ' : 'Off. '
    return `${state}${this.developer?.blurb ?? ''}`
  }

  get showList (): boolean {
    return !this.isMobileViewport || !this.current
  }

  get showPane (): boolean {
    return !!this.current
  }

  shows (anchor: string): boolean {
    return this.current?.anchors.includes(anchor) ?? false
  }

  get listTo (): string {
    return scopedPath('/settings', activeSlug())
  }

  linkTo (section: SettingsSection): string {
    if (section.page) return scopedPath(section.page, activeSlug())
    return `${this.listTo}#${section.anchors[0]}`
  }

  get updateCount (): number {
    const info = (this.$store.state.version.version_info ?? {}) as Record<string, unknown>
    const hasUpdate = this.$store.getters['version/hasUpdate'] as (component: string) => boolean
    // The OS packages count too, as the Updates card shows them.
    return Object.keys(info).filter(name => hasUpdate(name)).length
  }

  /** What's beside a section's name: the printer's name, how many cameras, whether it's up to date. */
  hintOf (section: SettingsSection): string {
    switch (section.id) {
      case 'general':
        return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
      case 'updates': {
        // The printer's own software, as its Aux API says; else what Moonraker's updater lists.
        const own = updateWatch.status
        if (own) return own.update_available && own.target_version !== own.current_version ? 'update ready' : 'up to date'
        if (!Object.keys(this.$store.state.version.version_info ?? {}).length) return ''
        if (!this.updateCount) return 'up to date'
        return this.updateCount === 1 ? '1 update' : `${this.updateCount} updates`
      }
      case 'cameras':
        return countOrNone((this.$store.getters['webcams/getWebcams'] as unknown[]).length)
      case 'materials':
        return countOrNone((this.$store.getters['config/getTempPresets'] as unknown[]).length)
      case 'macros':
        // Every macro the Macros card manages, hidden from the dashboard or not.
        return countOrNone((this.$store.getters['macros/getMacros'] as unknown[]).length)
      case 'system':
        return 'restart, logs'
      case 'developer':
        return devModeState.enabled === null ? '' : devModeState.enabled ? 'on' : 'off'
      default:
        return ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings-back {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    color: var(--m3d-text-muted) !important;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }

  .settings-search {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    &:focus-within {
      border-color: var(--m3d-accent-border);
    }

    input {
      flex: 1 1 auto;
      min-width: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font-size: 14px;
    }
  }

  .settings-body {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .settings-page--phone {
    .settings-body {
      grid-template-columns: minmax(0, 1fr);
    }

  }

  .settings-side {
    position: sticky;
    top: 84px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .settings-page--phone .settings-side {
    position: static;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 22px;
    background: var(--m3d-surface);
    overflow: hidden;
  }

  .settings-list__item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 8px 12px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text) !important;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;

    &:first-child {
      border-top: 0;
    }

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .settings-list__item--on {
    background: var(--m3d-fill);
  }

  .settings-list__ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
  }

  .settings-list__item--on .settings-list__ico {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .settings-list__label {
    flex: 1 1 auto;
    min-width: 0;

    small {
      display: block;
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 400;
      line-height: 1.35;
    }
  }

  .settings-list__hint {
    overflow: hidden;
    max-width: 45%;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .settings-list__hint--warn {
    color: var(--m3d-warning);
  }

  .settings-list__go {
    flex: none;
    color: var(--m3d-text-subtle);
  }

  .settings-list__none {
    margin: 0;
    padding: 16px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .settings-pane {
    min-width: 0;
  }
</style>
