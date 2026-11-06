import Vue from 'vue'
import type { HealthRow } from './health'

/**
 * What the Maintenance header and the Checks tile share: the header's second
 * line says how the printer stands, which the tile has just worked out.
 */
export const maintenancePage = Vue.observable({
  rows: [] as HealthRow[],
  /** When a check last ran from here, or null. */
  lastRun: null as number | null
})
