<template>
  <v-menu
    v-model="open"
    bottom
    left
    offset-y
    nudge-bottom="8"
    min-width="280"
    max-width="340"
    content-class="muon-account__menu"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="app-header__icon quick-actions__btn"
        :class="{ 'quick-actions__btn--open': open }"
        aria-label="Quick actions"
        data-tid="quick-actions"
        v-bind="attrs"
        v-on="on"
      >
        <frame-icon name="bolt" />
      </button>
    </template>
    <div
      class="acct-menu"
      role="menu"
      aria-label="Quick actions"
    >
      <span class="acct-menu__caps">Quick actions</span>
      <template v-for="(a, i) in actions">
        <div
          v-if="a.id === 'restart'"
          :key="`rule-${i}`"
          class="acct-menu__rule"
        />
        <button
          :key="a.id"
          type="button"
          class="acct-menu__item quick-actions__item"
          :class="{ 'quick-actions__item--off': !!a.reason }"
          role="menuitem"
          :aria-disabled="a.reason ? 'true' : undefined"
          :title="a.reason || undefined"
          :data-tid="`quick-${a.id}`"
          @click="run(a)"
        >
          <frame-icon
            :name="a.icon"
            small
          />
          <span class="quick-actions__text">
            <span class="quick-actions__label">{{ a.label }}</span>
            <span
              v-if="a.reason"
              class="quick-actions__reason"
              :data-tid="`quick-${a.id}-reason`"
            >{{ a.reason }}</span>
          </span>
          <span
            v-if="a.hint && !a.reason"
            class="acct-menu__key"
          >{{ a.hint }}</span>
        </button>
      </template>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import FilamentActionsMixin from '@/mixins/filament-actions'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { materialChoices, type MaterialChoice } from '@/services/control/model'
import { EventBus } from '@/eventBus'
import { quickActions, type QuickAction } from '@/services/quick-actions/model'

interface MacroLike {
  name?: unknown;
  config?: { gcode?: unknown };
}

/**
 * The top bar's Quick actions: the things done most, a press each. Every one
 * is the command Control already sends (its home, preheat, cool down,
 * filament macros, Level the bed, motors off and Klipper restart), gated the
 * same way, and says in plain words why it cannot be used when it cannot.
 */
@Component({})
export default class QuickActionsMenu extends Mixins(MaintenanceMixin, FilamentActionsMixin) {
  open = false

  /** The material to offer: the one loaded, else the one the heaters are set to, else PLA, else the first. */
  get preheatChoice (): MaterialChoice | null {
    const choices = materialChoices(this.materials)
    const heated = this.material ? choices.find(c => c.presetId === this.material?.id) : undefined
    return this.loadedMaterial ?? heated ?? choices.find(c => /^pla$/i.test(c.name)) ?? choices[0] ?? null
  }

  get macroList (): MacroLike[] {
    return (this.$store.getters['macros/getMacros'] as MacroLike[] | undefined) ?? []
  }

  get levelRow () {
    return this.checks.find(c => c.id === 'bedMesh') ?? null
  }

  get actions (): QuickAction[] {
    return quickActions({
      controlLock: this.controlLock,
      busy: this.busy,
      restartRefusal: this.restartRefusal,
      preheatName: this.preheatChoice?.name ?? null,
      changeFilament: this.changePlan.kind !== 'none',
      changeFilamentReason: this.changePlan.kind === 'none' ? this.changePlan.reason : undefined,
      levelGcode: this.levelRow?.gcode ?? null,
      levelBlocked: this.checksBlocked
    })
  }

  run (action: QuickAction) {
    // Disabled in words, not by the browser, so the reason stays readable and focusable.
    if (action.reason) return
    this.open = false
    switch (action.id) {
      case 'home': return this.home()
      case 'preheat': return this.preheat()
      case 'cool': return this.coolDown()
      case 'filament': return this.changeFilament()
      case 'level': return this.levelRow && this.runCheck(this.levelRow)
      case 'motors': return this.motorsOff()
      case 'restart': return this.restart()
    }
  }

  /** Mid-print this overwrites the running print's temperatures, so it asks first, as cool down does. */
  async preheat () {
    const choice = this.preheatChoice
    if (!choice || !this.controlReady) return
    const target = this.panelTarget
    if (this.busy) {
      const ok = await this.$confirm('The printer is busy. The nozzle and bed go to the new temperatures, which can spoil the print.', {
        title: 'Change the temperatures of the running print?',
        buttonTrueText: 'Change them',
        buttonFalseText: 'Leave them',
        danger: true
      })
      if (!ok || target !== this.panelTarget) return
    }
    this.heatFor(choice)
  }

  /** Restart asks first (in sendTypedGcode); when it is refused, say why. */
  async restart () {
    if (await this.sendTypedGcode('RESTART')) return
    if (this.commandRefusal) EventBus.$emit(this.commandRefusal, { type: 'error', timeout: 6000 })
  }

  /**
   * As Control's Filament card does it (FilamentActionsMixin, KAN-1700).
   * Mid-print: M600, which pauses the print, after its confirm. Idle: it
   * sends nothing and opens the material panel on Control, where Load and
   * Unload each ask first.
   */
  /** The material panel lives on Control's Filament card: open it there. */
  openFilamentPanel () {
    this.$router.push({ path: scopedPath('/control', activeSlug()), query: { filament: 'open' } }).catch(() => {})
  }

  async changeFilament () {
    if (this.changePlan.kind === 'panel') {
      this.openFilamentPanel()
      return
    }
    await this.runFilamentPlan('change')
  }
}
</script>

<style lang="scss" scoped>
  .quick-actions__btn--open {
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .quick-actions__item {
    min-height: 40px;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .quick-actions__item--off {
    cursor: default;

    .quick-actions__label,
    .frame-icon {
      opacity: 0.55;
    }

    &:hover {
      background: transparent;
    }
  }

  .quick-actions__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .quick-actions__reason {
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 400;
    white-space: normal;
  }
</style>
