/** One stick the printer has mounted. */
export interface UsbStick {
  name: string;
  /** `usb/<name>`, how Moonraker spells the stick's root. */
  path: string;
  freeBytes: number | null;
  totalBytes: number | null;
  fs: string;
  /** Moonraker only mounts a stick writable during a printer-to-USB copy, so this is not "can be written to". */
  writable: boolean;
  /** The printer says the stick can't be written to at all (a write-protected stick). */
  readOnly: boolean;
}

export interface UsbEjected {
  name: string;
  at: number | null;
}

export type UsbJobState = 'queued' | 'running' | 'done' | 'cancelled' | 'failed'
export type UsbItemState = 'pending' | 'copying' | 'done' | 'skipped' | 'failed' | 'cancelled'
export type UsbDirection = 'to_printer' | 'to_usb'
export type UsbConflict = 'skip' | 'replace' | 'rename'

export interface UsbJobItem {
  path: string;
  dest: string;
  bytesTotal: number;
  bytesDone: number;
  state: UsbItemState;
  /** An error code (`no_space`) or the printer's own words. */
  error: string;
}

export interface UsbJobProblem {
  path: string;
  reason: string;
}

export interface UsbJob {
  id: string;
  direction: UsbDirection;
  stick: string;
  state: UsbJobState;
  filesTotal: number;
  filesDone: number;
  bytesTotal: number;
  bytesDone: number;
  current: string;
  items: UsbJobItem[];
  skipped: UsbJobProblem[];
  errors: UsbJobProblem[];
  /** Why the whole job stopped (`no_space`), when it failed. */
  reason: string;
  startedAt: number | null;
  endedAt: number | null;
}

export interface UsbStatus {
  sticks: UsbStick[];
  ejected: UsbEjected[];
  /** Sticks the printer saw but can't read (`fstype`, `label`). */
  rejected: Array<{ name: string, fstype: string, label: string }>;
  job: UsbJob | null;
}

export interface UsbEntry {
  name: string;
  /** Moonraker's path (`usb/<stick>/a/b.gcode`). */
  path: string;
  /** Path inside the stick (`a/b.gcode`). */
  rel: string;
  size: number;
  modified: number;
  isDir: boolean;
}

export interface UsbListing {
  entries: UsbEntry[];
  total: number;
  truncated: boolean;
}
