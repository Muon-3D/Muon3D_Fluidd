/**
 * Account is its own top-level page (Jack, 6 Nov): opened from a printer, it
 * keeps a way back to the page you came from. Moving between Account's own
 * sections keeps it; arriving from anywhere that isn't a printer's page
 * forgets it.
 */
import Vue from 'vue'

interface RouteLike {
  name?: string | null;
  fullPath: string;
  params?: Record<string, string>;
}

export const accountCameFrom = Vue.observable({ path: null as string | null })

const isAccount = (route: RouteLike) => !!route.name?.startsWith('Account')

/**
 * Where "Back to <printer>" goes: the page Account was opened from when it is
 * that printer's own page (its slug exactly: "/box" is not "/boxwood-367a"),
 * else the printer's home.
 */
export function backTarget (came: string | null, slug: string): string {
  const home = `/${slug}`
  if (!came) return home
  const rest = came.slice(home.length)
  return came.startsWith(home) && (rest === '' || /^[/?#]/.test(rest)) ? came : home
}

/** Called after every navigation. */
export function noteAccountEntry (to: RouteLike, from: RouteLike) {
  if (!isAccount(to) || isAccount(from)) return
  accountCameFrom.path = from.params?.printer ? from.fullPath : null
}
