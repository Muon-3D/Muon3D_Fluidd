import Vue from 'vue'
import { newScanState, type ScanState } from './text'

/** Read by the scan results on the Printers page and in the welcome. */
export const scanState: ScanState = Vue.observable(newScanState())
