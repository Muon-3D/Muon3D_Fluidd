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
            {{ a.label }}
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
import { materialChoices, type MaterialChoice } from '@/services/control/model'
import { findFilamentMacro, quickActions, type QuickAction } from '@/services/quick-actions/model'

interface MacroLike {
  name?: unknown;
  config?: { gcode?: unknown };
}

const CHANGE_NAMES = ['m600', 'change_filament', 'filament_change']

/**
 * The top bar's Quick actions: the things done most, a press each. Every one
 * is the command Control already sends (its home, preheat, cool down,
 * filament macros, Level the bed, motors off and Klipper restart), gated the
 * same way, and says in plain words why it cannot be used when it cannot.
 */
@Component({})
export default class QuickActionsMenu extends Mixins(MaintenanceMixin) {
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

  get changeMacro () {
    return findFilamentMacro(this.macroList, ...CHANGE_NAMES)
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
      changeFilament: !!this.changeMacro,
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
      case 'preheat': return this.preheatChoice && this.heatFor(this.preheatChoice)
      case 'cool': return this.coolDown()
      case 'filament': return this.changeFilament()
      case 'level': return this.levelRow && this.runCheck(this.levelRow)
      case 'motors': return this.motorsOff()
      case 'restart': return this.sendTypedGcode('RESTART')
    }
  }

  /** As Control's Filament card runs it: a macro that takes a TEMP is told the material's nozzle heat. */
  changeFilament () {
    const macro = this.changeMacro
    if (!macro || !this.controlReady) return
    const temp = this.material?.nozzle ?? this.loadedMaterial?.nozzle ?? null
    this.sendGcode(macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name)
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

    .quick-actions__text,
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
