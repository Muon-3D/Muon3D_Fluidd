/**
 * Build-time feature flags. Each is OFF unless its VITE_ variable is exactly
 * "true" when Control is built (or when vite starts, in development); nothing
 * in the browser can turn one on. With a flag off the feature is not drawn and
 * asks the printer for nothing.
 */

/**
 * History > "the year at a glance" (a contribution grid of days) and "the
 * spool" (a ring of the year), design-lab concepts A and C. Off by default.
 * Turn on with VITE_CONTROL_YEAR_SPOOL=true.
 */
export function yearSpoolEnabled (): boolean {
  return import.meta.env.VITE_CONTROL_YEAR_SPOOL === 'true'
}

/**
 * First paint (KAN-5929, design lab round 2 "loading"): while Control starts, a
 * rim that fills with the real start-up steps and the wordmark printed the way
 * an M1 prints it, in place of the plain loading bar. Off by default. Turn on
 * with VITE_CONTROL_FIRST_PAINT=true.
 */
export function firstPaintEnabled (): boolean {
  return import.meta.env.VITE_CONTROL_FIRST_PAINT === 'true'
}
