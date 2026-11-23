import type { KlipperFileMeta } from '@/store/files/types.metadata'

export interface HistoryState {
  count: number;
  jobs: HistoryItem[];
  job_totals: HistoryRollUp;
  /** The last year of jobs, kept apart from `jobs` for the year grid (flag VITE_CONTROL_YEAR_SPOOL). */
  yearJobs?: HistoryItem[];
  /** Where the year's request is: not asked, in flight, here, or failed. */
  yearStatus?: 'idle' | 'loading' | 'ready' | 'error';
  /** How many jobs the reply said there are (it carries at most YEAR_LIMIT). */
  yearCount?: number;
  /** The local day (YYYY-MM-DD) the year was loaded on. */
  yearDay?: string;
}

export interface HistoryItem {
  job_id: string;
  exists: boolean;
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata?: KlipperFileMeta;
  print_duration: number;
  status: HistoryItemStatus;
  start_time: number;
  total_duration: number;
  path?: string;
}

export interface HistoryRollUp {
  total_jobs: number;
  total_time: number;
  total_print_time: number;
  total_filament_used: number;
  longest_job: number;
  longest_print: number;
}

export type HistoryItemStatus = 'completed' | 'cancelled' | 'error' | 'printing' | 'in_progress' | 'server_exit' | 'klippy_shutdown' | 'klippy_disconnect' | 'interrupted'
