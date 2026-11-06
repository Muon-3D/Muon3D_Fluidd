import Vue from 'vue'
import type { JobsFilter, JobsSort } from './list'

const SORT_KEY = 'muon3d.jobs.sort.v3'

function readSort (): JobsSort {
  try {
    const saved = localStorage.getItem(SORT_KEY)
    if (['newest', 'name', 'longest', 'size', 'filament', 'layer', 'modified'].includes(saved ?? '')) return saved as JobsSort
  } catch {
    // The default below.
  }
  return 'newest'
}

/**
 * What the Jobs header and the Jobs page share: the header holds the search,
 * the order and Upload, and the page holds the list they act on.
 */
export const jobsPage = Vue.observable({
  query: '',
  sort: readSort() as JobsSort,
  /** Turned round: the other way from the order's usual one. */
  reverse: false,
  filter: 'all' as JobsFilter,
  /** Bumped by the header's Select; the page starts selecting. */
  selectTick: 0,
  /** The phone's search field, which the header's search button opens. */
  searchOpen: false,
  /** Bumped by the header's Upload; the page opens its file picker. */
  uploadTick: 0,
  /** Bumped by the header's menu; the page opens its New folder dialog. */
  folderTick: 0,
  /** For the header's second line. */
  files: 0,
  free: '',
  printerName: ''
})

export function setJobsSort (sort: JobsSort) {
  jobsPage.sort = sort
  try {
    localStorage.setItem(SORT_KEY, sort)
  } catch {
    // The order holds for this visit.
  }
}

export function resetJobsPage () {
  jobsPage.query = ''
  jobsPage.filter = 'all'
  jobsPage.reverse = false
  jobsPage.searchOpen = false
}
