/** The portal's page state lives in the URL (spec section 2): it survives re-confirmation, reload and sharing. */
import type { Route } from 'vue-router'
import type VueRouter from 'vue-router'
import { RANGES, REFRESHES, type Range, type Refresh } from '@/services/admin/obs'

const one = (value: unknown): string => (Array.isArray(value) ? String(value[0] ?? '') : typeof value === 'string' ? value : '')

export const rangeOf = (route: Route): Range => (RANGES as readonly string[]).includes(one(route.query.range)) ? one(route.query.range) as Range : '6h'
export const refreshOf = (route: Route): Refresh => (REFRESHES as readonly string[]).includes(one(route.query.refresh)) ? one(route.query.refresh) as Refresh : '30s'
export const paramOf = (route: Route, name: string): string => one(route.query[name])
export const listOf = (route: Route, name: string): string[] => one(route.query[name]).split(',').filter(Boolean)

export function refreshMs (refresh: Refresh): number { return { off: 0, '30s': 30_000, '1m': 60_000, '5m': 300_000 }[refresh] }

/** Replaces the query (no history entry); an empty value removes the key. Defaults are not written. */
export function setQuery (router: VueRouter, route: Route, patch: Record<string, string | undefined>): void {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    const text = one(value)
    if (text) query[key] = text
  }
  router.replace({ path: route.path, query }).catch(() => undefined)
}
