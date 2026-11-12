<template>
  <section
    v-if="isMuonPrinter === true"
    id="security"
    class="sec"
    data-tid="security-settings"
  >
    <header class="sec__head">
      <h2>Who can do what</h2>
      <p>{{ printerName }} decides each of these for every phone and computer, and keeps to it.</p>
      <p
        v-if="claimed !== null"
        class="sec__claimed"
        data-tid="security-claimed"
      >
        {{ claimed ? 'A claimed printer: the owner and shared users by default. The owner can open or restrict each one.' : 'An open printer: anyone may do each of these by default. The owner can restrict each one.' }}
      </p>
    </header>

    <p
      v-if="knobs === null"
      class="sec__note"
      data-tid="security-unknown"
    >
      {{ loaded ? "This printer doesn't report its security settings yet." : 'Asking the printer…' }}
    </p>

    <div
      v-for="k in rows"
      :key="k.id"
      class="sec__row"
      data-tid="security-row"
      :data-knob="k.id"
    >
      <div class="sec__titles">
        <h3 data-tid="security-label">
          {{ k.label }}
        </h3>
        <p v-if="k.description">
          {{ k.description }}
        </p>
        <p
          v-if="k.defaultValue"
          class="sec__default"
          :class="{ 'sec__default--changed': k.value !== k.defaultValue }"
          data-tid="security-default"
        >
          {{ defaultLine(k) }}
        </p>
      </div>
      <can-manage-access v-if="!k.readOnly">
        <select
          class="sec__select"
          :value="k.value"
          :aria-label="k.label"
          :disabled="saving !== ''"
          data-tid="security-value"
          @change="onSelect(k, $event)"
        >
          <option
            v-for="v in k.values"
            :key="v"
            :value="v"
          >
            {{ valueLabel(v) }}
          </option>
        </select>
      </can-manage-access>
      <locked-row
        v-if="k.readOnly || canManageAccess !== true"
        lock="muon"
        :label="valueLabel(k.value)"
        :reason-text="reasonFor(k)"
      />
      <p
        v-if="notes[k.id]"
        class="sec__note sec__note--warn"
        data-tid="security-note"
      >
        {{ notes[k.id] }}
      </p>
    </div>

    <div
      v-if="switches.length"
      class="sec__block"
      data-tid="security-switches"
    >
      <h3>Switches</h3>
      <div
        v-for="sw in switches"
        :key="sw.id"
        class="sec__row"
        data-tid="security-switch-row"
        :data-switch="sw.id"
      >
        <div class="sec__titles">
          <h3>{{ sw.label }}</h3>
          <p v-if="sw.description">
            {{ sw.description }}
          </p>
          <p
            v-if="sw.defaultValue !== null"
            class="sec__default"
            data-tid="security-switch-default"
          >
            {{ sw.defaultValue ? 'On by default.' : 'Off by default.' }}
          </p>
        </div>
        <can-manage-access v-if="!sw.readOnly">
          <toggle-switch
            :value="sw.value"
            :label="sw.label"
            :disabled="saving !== ''"
            @input="onSwitch(sw, $event)"
          />
        </can-manage-access>
        <locked-row
          v-if="sw.readOnly || canManageAccess !== true"
          lock="muon"
          :label="sw.value ? 'On' : 'Off'"
          :reason-text="switchReason(sw)"
        />
        <p
          v-if="notes[`switch:${sw.id}`]"
          class="sec__note sec__note--warn"
          data-tid="security-note"
        >
          {{ notes[`switch:${sw.id}`] }}
        </p>
      </div>
    </div>

    <div
      v-if="fixedRows.length"
      class="sec__block"
      data-tid="security-printer-only"
    >
      <h3>Only at the printer</h3>
      <p>These are never changed from a phone or a computer, by anyone, on any route.</p>
      <div
        v-for="k in fixedRows"
        :key="k.id"
        class="sec__row"
        data-tid="security-printer-only-row"
        :data-knob="k.id"
      >
        <div class="sec__titles">
          <h3>{{ k.label }}</h3>
          <p v-if="k.description">
            {{ k.description }}
          </p>
        </div>
        <locked-row
          lock="muon"
          label="Printer only"
          reason-text="Done at the printer."
        />
      </div>
    </div>

    <p
      v-if="knobs !== null"
      class="sec__note"
      data-tid="security-reset"
    >
      Reset to the defaults at the printer's screen.
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import CanManageAccess from '@/components/settings/gates/CanManageAccess.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerNameParts } from '@/util/printer-name'
import {
  changeOutcome, outcomeNote, parsePermissions, permissionsPath, switchOutcome, switchPath, valueLabel,
  type PermissionKnob, type PermissionSwitch
} from '@/services/permissions/api'

/**
 * Settings > Security (KAN-1926, KAN-2189): one row for each setting the
 * printer reports, never a list kept here, so a new one shows as the printer
 * names it. A row the printer reports as read-only for this session, or as
 * fixed, has no control; only a client the printer lets manage access
 * (canManageAccess) gets one on the others. The printer enforces every value;
 * this page only shows it and asks. Over a managed session the same routes
 * are under /muon-link/.
 */
@Component({ components: { CanManageAccess, LockedRow, ToggleSwitch } })
export default class SecuritySettings extends Mixins(MuonGatesMixin) {
  knobs: PermissionKnob[] | null = null
  switches: PermissionSwitch[] = []
  claimed: boolean | null = null
  loaded = false
  saving = ''
  notes: Record<string, string> = {}
  readonly valueLabel = valueLabel

  mounted () {
    if (this.isMuonPrinter === true) this.load()
  }

  @Watch('isMuonPrinter')
  onMuon (muon: boolean | null) {
    if (muon === true && !this.loaded) this.load()
  }

  get managed (): boolean {
    return isManagedApiUrl(this.$store.state.config.apiUrl as string | null)
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  /** The settings a session may change or look at, in the printer's order; the fixed ones are under "Only at the printer". */
  get rows (): PermissionKnob[] {
    return (this.knobs || []).filter(k => !k.fixed)
  }

  get fixedRows (): PermissionKnob[] {
    return (this.knobs || []).filter(k => k.fixed)
  }

  defaultLine (k: PermissionKnob): string {
    const base = k.defaultValue === 'anyone' ? 'Open by default.' : `Default: ${valueLabel(k.defaultValue)}.`
    return k.value === k.defaultValue ? base : `${base} Now set to ${valueLabel(k.value)}.`
  }

  async load () {
    try {
      const r = await this.$httpClient.get(permissionsPath(this.managed), { validateStatus: () => true })
      const list = r.status >= 200 && r.status < 300 ? parsePermissions(r.data) : null
      this.knobs = list ? list.knobs : null
      this.switches = list ? list.switches : []
      this.claimed = list ? list.claimed : null
    } catch {
      this.knobs = null
    } finally {
      this.loaded = true
    }
  }

  reasonFor (k: PermissionKnob): string {
    if (k.generic) return 'Shown as the printer reports it. Change it at the printer.'
    if (k.readOnly) return "You can't change this one."
    if (this.canManageAccess === false) return "Only the printer's owner can change this."
    return 'Checking whether you can change this…'
  }

  switchReason (sw: PermissionSwitch): string {
    if (sw.readOnly || this.canManageAccess === false) return "Only the printer's owner can change this."
    return 'Checking whether you can change this…'
  }

  onSelect (k: PermissionKnob, e: Event) {
    this.change(k, (e.target as HTMLSelectElement).value)
  }

  async change (k: PermissionKnob, value: string) {
    if (this.saving || value === k.value) return
    this.saving = k.id
    this.$set(this.notes, k.id, '')
    try {
      const r = await this.$httpClient.post(permissionsPath(this.managed), { id: k.id, value }, { validateStatus: () => true })
      const o = changeOutcome(r.status, r.data)
      if (o.kind === 'applied' && o.knob?.id === k.id) {
        const kept = { ...o.knob, defaultValue: k.defaultValue }
        this.knobs = (this.knobs ?? []).map(x => (x.id === k.id ? kept : x))
      } else if (o.kind === 'applied') {
        // Taken, but the answer doesn't say what it is now: the printer's list is the truth.
        await this.load()
      } else {
        this.$set(this.notes, k.id, outcomeNote(o))
      }
    } catch {
      this.$set(this.notes, k.id, "The printer didn't answer. Try again.")
    } finally {
      this.saving = ''
      // A refused change leaves the select showing what the printer kept.
      this.knobs = this.knobs ? [...this.knobs] : null
    }
  }

  async onSwitch (sw: PermissionSwitch, value: boolean) {
    if (this.saving || value === sw.value) return
    const key = `switch:${sw.id}`
    this.saving = key
    this.$set(this.notes, key, '')
    try {
      const r = await this.$httpClient.post(switchPath(this.managed), { id: sw.id, value }, { validateStatus: () => true })
      const o = switchOutcome(r.status, r.data)
      if (o.kind === 'switch' && o.value?.id === sw.id) {
        const kept = o.value
        this.switches = this.switches.map(x => (x.id === sw.id ? { ...kept, defaultValue: kept.defaultValue ?? x.defaultValue } : x))
      } else if (o.kind === 'switch') {
        await this.load()
      } else {
        this.$set(this.notes, key, outcomeNote(o))
      }
    } catch {
      this.$set(this.notes, key, "The printer didn't answer. Try again.")
    } finally {
      this.saving = ''
      this.switches = [...this.switches]
    }
  }
}
</script>

<style lang="scss" scoped>
  .sec {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .sec__head {
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .sec__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding-top: 12px;
    border-top: 1px solid var(--m3d-border);
  }

  .sec__titles {
    flex: 1 1 220px;
    min-width: 0;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .sec__select {
    min-height: 40px;
    max-width: 100%;
    padding: 0 12px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
  }

  .sec__default {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .sec__default--changed {
    color: var(--m3d-warning, #e8963c);
  }

  .sec__block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 14px;
    border-top: 1px solid var(--m3d-border);

    > h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    > p {
      margin: 0 0 6px;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .sec__note {
    flex: 1 1 100%;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .sec__note--warn {
    color: var(--m3d-warning, #e8963c);
  }
</style>
