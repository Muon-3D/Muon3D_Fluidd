import Vue from 'vue'
import type { InstanceConfig } from '@/store/config/types'

/**
 * The printer Control is on locally, in place (its secure name or its address). The saved list holds it only when
 * this browser had none saved before, so the directory reads it from here: otherwise a printer that is connected
 * showed the account's idle "Connecting" (KAN-6743).
 */
export const localSession = Vue.observable({ instance: null as InstanceConfig | null })
