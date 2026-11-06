<template>
  <maintenance-tile
    title="Profiles"
    icon="mesh"
    flush
    data-tid="mesh-profiles"
  >
    <template #aside>
      <button
        type="button"
        class="cbtn cbtn--ghost mprof__head-btn"
        :disabled="!controlReady || !activeName"
        data-tid="mesh-clear"
        @click="clear"
      >
        Clear
      </button>
      <button
        type="button"
        class="cbtn mprof__head-btn"
        :disabled="!controlReady || !activeName"
        data-tid="mesh-save-as"
        @click="saveOpen = true"
      >
        <frame-icon
          name="plus"
          small
        />
        Save current
      </button>
    </template>

    <ul
      v-if="profiles.length"
      class="mprof__list"
    >
      <li
        v-for="profile in profiles"
        :key="profile.name"
        class="mprof__row"
        :data-profile="profile.name"
      >
        <span class="mprof__text">
          <span class="mprof__name">{{ profile.name }}</span>
          <span class="mprof__sub">{{ profile.range.toFixed(2) }} mm spread{{ profile.adaptive ? ' · adaptive' : '' }}</span>
        </span>
        <tone-pill
          v-if="profile.active"
          tone="ok"
          :dot="false"
        >
          Active
        </tone-pill>
        <button
          v-else
          type="button"
          class="cbtn mprof__load"
          :disabled="!controlReady"
          :aria-label="`Load ${profile.name}`"
          @click="load(profile.name)"
        >
          Load
        </button>
        <button
          v-if="!profile.adaptive"
          type="button"
          class="mprof__remove"
          :disabled="!controlReady"
          :aria-label="`Remove ${profile.name}`"
          title="Remove"
          @click="remove(profile.name)"
        >
          <frame-icon name="trash" />
        </button>
      </li>
    </ul>
    <div
      v-else
      class="mprof__empty"
    >
      <span class="mprof__ico"><frame-icon name="mesh" /></span>
      <b>No saved profiles yet</b>
      <p>Calibrate the mesh, then save it under a name.</p>
    </div>

    <p
      v-if="controlLock"
      class="mprof__lock"
    >
      <frame-icon
        name="lock"
        small
      />
      {{ controlLock }}
    </p>

    <div
      v-if="saveConfigPending"
      class="mprof__pending"
      data-tid="mesh-pending"
    >
      <span>Saved profiles and new results reach printer.cfg when Klipper saves them, which restarts it.</span>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!!saveBlocked"
        :title="saveBlocked"
        @click="saveResults"
      >
        Save to printer.cfg
      </button>
    </div>

    <file-name-dialog
      v-if="saveOpen"
      v-model="saveOpen"
      title="Save the mesh as"
      label="Profile name"
      :name="activeName === 'default' ? '' : activeName"
      @save="saveAs"
    />
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import type { BedMeshProfileListEntry } from '@/store/mesh/types'
import { meshProfileCommand, validProfileName } from '@/services/maintenance/model'
import MaintenanceTile from './MaintenanceTile.vue'
import TonePill from '@/components/printers/TonePill.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'

/**
 * Saved mesh profiles with how uneven each is, loading and removing
 * them, saving the mesh in use under a name, clearing it, and saving to
 * printer.cfg when Klipper has results waiting. Measuring the bed is the
 * header's Calibrate mesh.
 */
@Component({ components: { MaintenanceTile, TonePill, FileNameDialog } })
export default class MeshProfiles extends Mixins(MaintenanceMixin) {
  saveOpen = false

  get profiles (): BedMeshProfileListEntry[] {
    return (this.$store.getters['mesh/getBedMeshProfiles'] as BedMeshProfileListEntry[]) ?? []
  }

  get activeName (): string {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? ''
  }

  /** A measurement that finishes while this page is open counts on Maintenance too. */
  @Watch('evidence', { immediate: true })
  onEvidence () {
    this.recordIfDone()
  }

  async load (name: string) {
    if (!this.controlReady || !validProfileName(name) || !this.profiles.some(p => p.name === name)) return
    const target = this.maintenanceTarget
    // Mid-print, a different mesh moves the nozzle under the part.
    if (this.printerPrinting && !(await this.$confirm('The nozzle follows the new mesh from the next move.', { title: `Load ${name} while printing?`, buttonTrueText: 'Load it' }))) return
    if (!this.controlReady || target !== this.maintenanceTarget) return
    this.sendGcode(meshProfileCommand('LOAD', name))
  }

  async remove (name: string) {
    if (!this.controlReady || !validProfileName(name) || !this.profiles.some(p => p.name === name && !p.adaptive)) return
    const target = this.maintenanceTarget
    if (!(await this.$confirm('It goes from printer.cfg the next time Klipper saves.', { title: `Remove the mesh ${name}?`, buttonTrueText: 'Remove', danger: true }))) return
    if (!this.controlReady || target !== this.maintenanceTarget) return
    this.sendGcode(meshProfileCommand('REMOVE', name))
  }

  async clear () {
    if (!this.controlReady) return
    const target = this.maintenanceTarget
    if (this.printerPrinting && !(await this.$confirm('The nozzle stops following the bed from the next move.', { title: 'Clear the mesh while printing?', buttonTrueText: 'Clear it', danger: true }))) return
    if (!this.controlReady || target !== this.maintenanceTarget) return
    this.sendGcode('BED_MESH_CLEAR')
  }

  saveAs (name: string) {
    if (!this.controlReady || !this.activeName) return
    if (!validProfileName(name)) {
      this.$store.dispatch('notifications/pushNotification', { title: 'Not saved', description: 'A profile name takes letters, numbers, spaces, dots, dashes and underscores.', type: 'error', snackbar: true })
      return
    }
    this.sendGcode(meshProfileCommand('SAVE', name))
  }
}
</script>

<style lang="scss" scoped>
  .mprof__head-btn {
    height: 32px;
  }

  .mprof__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mprof__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 10px 18px;

    + .mprof__row {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .mprof__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
  }

  .mprof__name {
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .mprof__sub {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .mprof__load {
    flex: none;
  }

  .mprof__remove {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--m3d-text-muted);

    &:disabled {
      opacity: 0.45;
    }
  }

  .mprof__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 18px;
    text-align: center;

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .mprof__ico {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .mprof__lock {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 18px 8px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .mprof__pending {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin: 6px 18px 10px;
    padding: 12px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--m3d-warning) 10%, transparent);
    color: var(--m3d-text);
    font-size: 13px;

    span {
      flex: 1 1 200px;
    }
  }
</style>
