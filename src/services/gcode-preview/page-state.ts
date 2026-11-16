import Vue from 'vue'
import type { AppFile } from '@/store/files/types'

/**
 * What the G-code preview's header and its page share: the header names the
 * file and carries Open another and Print this; the page loads what's picked.
 */
export const previewPage = Vue.observable({
  /** A file picked from the header's Open another; the page loads it and clears this. */
  requested: null as AppFile | null
})
