import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/** The query that opens Health's "Switches and sensors" fold (KAN-1697). */
export const SENSORS_QUERY = 'sensors'

/** Health with "Switches and sensors" open: where a filament action sends someone for the sensors. */
export function sensorsPath (slug: string | null = activeSlug()): string {
  return `${scopedPath('/maintenance', slug)}?${SENSORS_QUERY}=open`
}
