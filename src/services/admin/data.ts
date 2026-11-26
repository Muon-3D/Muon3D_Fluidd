/**
 * The admin portal's page data, kept in memory only (spec section 5.1: nothing in
 * localStorage). The catalogue is fetched once per session; each section asks the
 * console for its panels by id.
 */
import Vue from 'vue'
import { obs, obsFailure, type Catalog, type CatalogPanel, type CatalogSection } from './obs'

export interface Nav { id: string; path: string; title: string; grafana?: string }

/** The eleven sections, in nav order (spec section 2). The catalogue supplies their panels; the nav does not wait for it. */
export const SECTIONS: Nav[] = [
  { id: 'overview', path: '/admin', title: 'Overview', grafana: 'muon-overview' },
  { id: 'traffic', path: '/admin/traffic', title: 'Traffic and latency', grafana: 'muon-service' },
  { id: 'errors', path: '/admin/errors', title: 'Errors', grafana: 'muon-slo' },
  { id: 'infrastructure', path: '/admin/infrastructure', title: 'Infrastructure', grafana: 'muon-host' },
  { id: 'endpoints', path: '/admin/endpoints', title: 'Endpoints and certificates', grafana: 'muon-overview' },
  { id: 'fleet', path: '/admin/fleet', title: 'Printers and fleet', grafana: 'muon-fleet' },
  { id: 'accounts', path: '/admin/accounts', title: 'Accounts and auth', grafana: 'muon-accounts' },
  { id: 'jobs', path: '/admin/jobs', title: 'Jobs, models and slicing', grafana: 'muon-service' },
  { id: 'logs', path: '/admin/logs', title: 'Logs', grafana: 'muon-logs' },
  { id: 'alerts', path: '/admin/alerts', title: 'Alerts' },
  { id: 'releases', path: '/admin/releases', title: 'Releases and deploys' }
]

export const TOOLS: Nav[] = [
  { id: 'accounts', path: '/admin/tools/accounts', title: 'Accounts' },
  { id: 'audit', path: '/admin/tools/audit', title: 'Audit log' },
  { id: 'review', path: '/admin/tools/review', title: 'Review queue' },
  { id: 'handles', path: '/admin/tools/handles', title: 'Handle reservations' }
]

/** The scrape jobs the `job` filter offers (spec section 5.2). */
export const JOBS = ['muon-console', 'muon-models', 'iroh-relay', 'machine-queue', 'tracker']

export type CatalogState = 'idle' | 'loading' | 'ok' | 'missing' | 'failed'

export const data = Vue.observable({
  catalog: null as Catalog | null,
  state: 'idle' as CatalogState,
  text: ''
})

export function sectionOf (id: string): CatalogSection | undefined {
  return data.catalog?.sections.find(section => section.id === id)
}

/** Real panels first, placeholders after (spec 4.6), each group in the catalogue's order. */
export function ordered (panels: CatalogPanel[]): CatalogPanel[] {
  return [...panels.filter(p => p.status !== 'placeholder'), ...panels.filter(p => p.status === 'placeholder')]
}

let loading: Promise<void> | null = null

export function loadCatalog (force = false): Promise<void> {
  if (!force && (data.state === 'ok' || loading)) return loading ?? Promise.resolve()
  data.state = 'loading'
  loading = obs.catalog().then(catalog => {
    data.catalog = catalog && Array.isArray(catalog.sections) ? catalog : { sections: [] }
    data.state = 'ok'; data.text = ''
  }, (error: unknown) => {
    const failure = obsFailure(error)
    data.state = failure.missing ? 'missing' : 'failed'; data.text = failure.text
  }).finally(() => { loading = null })
  return loading
}

export function forgetData (): void { data.catalog = null; data.state = 'idle'; data.text = ''; loading = null }
