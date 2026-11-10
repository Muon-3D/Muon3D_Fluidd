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
    </header>

    <p
      v-if="knobs === null"
      class="sec__note"
      data-tid="security-unknown"
    >
      {{ loaded ? "This printer doesn't report its security settings yet." : 'Asking the printer…' }}
    </p>

    <div
      v-for="k in knobs || []"
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
            {{ labels[v] }}
          </option>
        </select>
      </can-manage-access>
      <locked-row
        v-if="k.readOnly || canManageAccess !== true"
        lock="muon"
        :label="labels[k.value]"
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
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import CanManageAccess from '@/components/settings/gates/CanManageAccess.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import { printerNameParts } from '@/util/printer-name'
import {
  PERMISSIONS_PATH, VALUE_LABELS, changeOutcome, outcomeNote, parseKnobs,
  type PermissionKnob, type PermissionValue
} from '@/services/permissions/api'

/**
 * Settings › Security (KAN-1926): one row for each setting the printer
 * reports, never a list kept here, so a new one shows as the printer names
 * it. Only a client the printer lets manage access (canManageAccess) gets a
 * control; everyone else sees the value, read-only, and why.
 */
@Component({ components: { CanManageAccess, LockedRow } })
export default class SecuritySettings extends Mixins(MuonGatesMixin) {
  knobs: PermissionKnob[] | null = null
  loaded = false
  saving = ''
  notes: Record<string, string> = {}
  readonly labels = VALUE_LABELS

  mounted () {
    if (this.isMuonPrinter === true) this.load()
  }

  @Watch('isMuonPrinter')
  onMuon (muon: boolean | null) {
    if (muon === true && !this.loaded) this.load()
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  async load () {
    try {
      const r = await this.$httpClient.get(PERMISSIONS_PATH, { validateStatus: () => true })
      this.knobs = r.status >= 200 && r.status < 300 ? parseKnobs(r.data) : null
    } catch {
      this.knobs = null
    } finally {
      this.loaded = true
    }
  }

  reasonFor (k: PermissionKnob): string {
    if (k.readOnly) return "Changed only at the printer's screen."
    if (this.canManageAccess === false) return "Only the printer's owner can change this."
    return 'Checking whether you can change this…'
  }

  onSelect (k: PermissionKnob, e: Event) {
    this.change(k, (e.target as HTMLSelectElement).value as PermissionValue)
  }

  async change (k: PermissionKnob, value: PermissionValue) {
    if (this.saving || value === k.value) return
    this.saving = k.id
    this.$set(this.notes, k.id, '')
    try {
      const r = await this.$httpClient.post(PERMISSIONS_PATH, { id: k.id, value }, { validateStatus: () => true })
      const o = changeOutcome(r.status, r.data)
      if (o.kind === 'applied') {
        const kept = o.knob?.id === k.id ? o.knob : { ...k, value }
        this.knobs = (this.knobs ?? []).map(x => (x.id === k.id ? kept : x))
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
