<template>
  <div>
    <admin-logs v-if="section === 'logs'" />
    <template v-else-if="section === 'alerts'">
      <admin-section-view
        section="alerts"
        :skip="alertsDrawn"
      >
        <admin-alerts-block />
      </admin-section-view>
    </template>
    <template v-else-if="section === 'overview'">
      <admin-section-view
        section="overview"
        :skip="['ov-alert-table']"
      />
      <admin-alerts-block firing-only />
    </template>
    <admin-section-view
      v-else
      :section="section"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AdminAlertsBlock from './AdminAlertsBlock.vue'
import AdminLogs from './AdminLogs.vue'
import AdminSectionView from './AdminSectionView.vue'

/** The route target of every observability section: picks the page for `meta.section`. */
export default defineComponent({
  components: { AdminAlertsBlock, AdminLogs, AdminSectionView },
  data () { return { alertsDrawn: ['al-firing', 'al-watchdog', 'al-delivery', 'al-rules'] } },
  computed: { section (): string { return String(this.$route.meta?.section ?? 'overview') } }
})
</script>
