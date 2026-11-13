import { plateNeedsClearing } from './clear'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

/** What the print sheet needs to show the plate-clear line inline, or null when the printer has not asked for it. */
export function plateNoticeFor (state: { printer?: { printer?: unknown }, config?: { apiUrl?: string | null } }): { managed: boolean } | null {
  if (!plateNeedsClearing(state.printer?.printer)) return null
  return { managed: isManagedApiUrl(state.config?.apiUrl ?? null) }
}
