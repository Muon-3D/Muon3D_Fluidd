import Vue from 'vue'
import { SORT_KEYS, type JobsSort } from './list'

const SORT_KEY = 'muon3d.jobs.sort.v3'

const REVERSE_KEY = 'muon3d.jobs.reverse.v3'

function readSort (): JobsSort {
  try {
    const saved = localStorage.getItem(SORT_KEY)
    if (SORT_KEYS.includes(saved as JobsSort)) return saved as JobsSort
  } catch {
    // The default below.
  }
  return 'newest'
}

function readReverse (): boolean {
  try {
    return localStorage.getItem(REVERSE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * What the Jobs header and the Jobs page share: the header holds the search,
 * the order and Upload, and the page holds the list they act on.
 */
export const jobsPage = Vue.observable({
  query: '',
  sort: readSort() as JobsSort,
  /** Turned round: the other way from the order's usual one. */
  reverse: readReverse(),
  /** The phone's search field, which the header's search button opens. */
  searchOpen: false,
  /** Bumped by the header's Upload; the page opens its file picker. */
  uploadTick: 0,
  /** Bumped by the header's menu; the page opens its New folder dialog. */
  folderTick: 0,
  /** What the page has selected, for the header's toolbar: the toolbar's selection actions show only while it's not 0. */
  selected: 0,
  /** Of those, what can be moved or deleted (not the file printing, nor a folder holding it). */
  changeable: 0,
  /** Of those, the files (what Download takes). */
  downloadable: 0,
  /** Of those, the files that can go in the queue (0 when the printer has no queue or isn't busy). */
  queueable: 0,
  /** Set when the selection holds the file printing: the toolbar says why it stays. */
  heldNote: '',
  /** Bumped by the toolbar's selection actions; the page does them. */
  moveTick: 0,
  downloadTick: 0,
  deleteTick: 0,
  queueTick: 0,
  clearTick: 0,
  /** For the header's second line. */
  files: 0,
  free: '',
  printerName: ''
})

export function setJobsSort (sort: JobsSort, reverse = false) {
  jobsPage.sort = sort
  jobsPage.reverse = reverse
  try {
    localStorage.setItem(SORT_KEY, sort)
    localStorage.setItem(REVERSE_KEY, reverse ? '1' : '0')
  } catch {
    // The order holds for this visit.
  }
}

export function resetJobsPage () {
  jobsPage.query = ''
  jobsPage.searchOpen = false
  jobsPage.selected = 0
  jobsPage.changeable = 0
  jobsPage.downloadable = 0
  jobsPage.queueable = 0
  jobsPage.heldNote = ''
}
