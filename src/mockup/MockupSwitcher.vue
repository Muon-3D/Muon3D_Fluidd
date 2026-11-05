<template>
  <div class="muon-switcher">
    <div class="muon-switcher__find">
      <label class="muon-switcher__field">
        <frame-icon
          name="search"
          small
        />
        <input
          type="search"
          placeholder="Find a printer"
          aria-label="Find a printer"
        >
      </label>
    </div>

    <!-- Printers sit under their group. "Saved in this browser" and "Found on network" are left out when empty. -->
    <section
      v-for="g in groups"
      :key="g.name"
      class="muon-switcher__group"
    >
      <div class="muon-switcher__heading">
        <span class="muon-switcher__caps">{{ g.name }}</span>
        <span class="muon-switcher__hint">{{ g.hint }}</span>
      </div>
      <printer-card
        v-for="e in g.entries"
        :key="e.key"
        :entry="e"
        :actions="[]"
      />
    </section>

    <div class="muon-switcher__foot">
      <router-link
        to="/"
        class="muon-switcher__all"
      >
        <frame-icon
          name="printers"
          small
        />
        All printers
        <kbd>G</kbd><kbd>P</kbd>
      </router-link>
      <button
        type="button"
        class="muon-switcher__add"
      >
        <frame-icon
          name="plus"
          small
        />
        Add a printer
      </button>
    </div>
  </div>
</template>

<script>
import PrinterCard from '@/components/muon-cloud/PrinterCard.vue'

const e = (name, health, detail, active) => ({
  key: name, section: 'cloud', name, endpointId: null, health, detail, host: null, active: active || null, linkedTo: 'mine', saved: []
})

export default {
  components: { PrinterCard },
  data: () => ({
    groups: [
      { name: 'Workshop', hint: '2 printers', entries: [e('Boxwood 367A', 'printing', 'Printing · layer 27 of 63', 'local'), e('Walnut 91C2', 'online', 'Ready')] },
      { name: 'Prototyping lab', hint: '1 printer', entries: [e('Cedar 5D10', 'paused', 'Paused · 12% · layer 14')] },
      { name: 'Other printers', hint: '', entries: [e('Maple 0B77', 'offline', 'Offline · last seen yesterday')] }
    ]
  })
}
</script>

<style lang="scss" scoped>
.muon-switcher { display: flex; flex-direction: column; color: var(--m3d-text); }
.muon-switcher__find { padding: 14px 14px 6px; }
.muon-switcher__field { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border-radius: 12px; background: var(--m3d-surface-2); color: var(--m3d-text-muted); }
.muon-switcher__field input { flex: 1 1 0; min-width: 0; border: 0; outline: none; background: transparent; color: var(--m3d-text); font: inherit; font-size: 14px; }
.muon-switcher__group { padding: 0 8px; }
.muon-switcher__heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 32px; padding: 10px 10px 4px; }
.muon-switcher__caps { color: var(--m3d-text-muted); font-family: var(--m3d-font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
.muon-switcher__hint { color: var(--m3d-text-subtle); font-size: 12px; }
.muon-switcher__foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding: 12px 14px; border-top: 1px solid var(--m3d-border); }
.muon-switcher__all, .muon-switcher__add { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.muon-switcher__all { color: var(--m3d-text-muted) !important; }
.muon-switcher__all kbd { font-family: var(--m3d-font-mono); font-size: 10.5px; color: var(--m3d-text-subtle); }
.muon-switcher__add { background: var(--m3d-surface-2); color: var(--m3d-text); }
</style>
