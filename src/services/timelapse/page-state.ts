import Vue from 'vue'

/** What the Timelapse header and its page share: the header's menu asks, the page reads the folder again. */
export const timelapsePage = Vue.observable({
  /** Bumped by the header's Refresh; the page reads the timelapse folder again. */
  refreshTick: 0
})
