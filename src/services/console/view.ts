import Vue from 'vue'
import type { LogFilter } from '@/services/console/model'

/** What the Console shows, shared by the page header's filter and the log under it. */
export const consoleView = Vue.observable({ filter: 'all' as LogFilter })
