import type { Route } from 'vue-router'

/**
 * Where appInit sends the page once a printer is loaded (the first load, and
 * every printer switch): the dashboard, unless the page is already there, is
 * not signed in to the printer, or is on a route that stays across a switch
 * (`keepOnPrinterSwitch`: /slice, whose frame holds the person's plates and is
 * told of the new printer instead). Null: stay.
 */
export function routeAfterInit (route: Pick<Route, 'path' | 'matched'>, authenticated: boolean): string | null {
  if (!authenticated || route.path === '/') return null
  if (route.matched.some(record => record.meta?.keepOnPrinterSwitch === true)) return null
  return '/'
}
