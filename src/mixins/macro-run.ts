import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import MacrosMixin, { type ShownMacro } from '@/mixins/macros'
import { macroFields, macroCommand, type MacroField } from '@/services/macros/values'

/**
 * Running a macro from a panel: one that needs no value runs at once; one
 * that asks for values opens a small form that sends only what it shows.
 * Shared by Control's Macros panel and the Overview Macros tile, so a macro
 * is run (and refused) the same way in both.
 */
@Component
export default class MacroRunMixin extends Mixins(ControlMixin, MacrosMixin) {
  selected: ShownMacro | null = null
  values: Record<string, string> = {}
  formTarget = ''
  formGcode = ''
  formError = ''

  gcodeOf (name: string): string {
    const settings = this.$store.state.printer.printer.configfile?.settings ?? {}
    const entry = Object.entries(settings).find(([key]) => key.toUpperCase() === `GCODE_MACRO ${name.toUpperCase()}`)
    return String((entry?.[1] as { gcode?: string } | undefined)?.gcode ?? '')
  }

  get fields (): MacroField[] { return macroFields(this.formGcode) }
  get preview (): string | null { return this.selected ? macroCommand(this.selected.name, this.fields, this.values) : null }

  async submitMacro () {
    this.formError = ''
    const current = this.arrangedMacros.find(m => m.name === this.selected?.name)
    if (!current || this.panelTarget !== this.formTarget || this.gcodeOf(current.name) !== this.formGcode) {
      this.formError = 'The printer or command changed. Open the values again.'; return
    }
    if (!this.controlReady || (current.disabledWhilePrinting && this.busy)) {
      this.formError = 'Not sent. Wait until you can control this printer and the command is available.'; return
    }
    const command = this.preview
    if (!command) { this.formError = 'Enter each required value. Use one number or word without spaces, quotes or command separators.'; return }
    if (await this.sendTypedGcode(command)) this.selected = null
  }

  tooltipOf (macro: ShownMacro): string {
    return [macro.name, macro.description, macro.internal].filter(Boolean).join(' · ')
  }

  run (macro: ShownMacro) {
    if (!this.controlReady || (macro.disabledWhilePrinting && this.busy)) return
    this.commandRefusal = ''; this.formError = ''
    if (!macro.params.length) { this.sendTypedGcode(macro.name); return }
    this.selected = macro
    this.formTarget = this.panelTarget
    this.formGcode = this.gcodeOf(macro.name)
    this.values = Object.fromEntries(this.fields.map(f => [f.name, '']))
    this.$nextTick(() => (this.$el.querySelector('.macros__field textarea') as HTMLTextAreaElement | null)?.focus())
  }
}
