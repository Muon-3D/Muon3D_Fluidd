/**
 * The error code book's entry, field for field as the book brief defines it
 * (error-code-book.md, section 1). The book's generated JSON bundle will
 * replace `catalogue.json`; nothing here should need to change for that.
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'
export type ErrorStatus = 'draft' | 'active' | 'retired'

export interface ErrorBookEntry {
  /** `MU-<AREA>-<NNNN>`. Stable: never reused, never renumbered. */
  code: string;
  /** motion, homing, heat, filament, network, update, storage, print, auth, slicer, library. */
  area: string;
  severity: ErrorSeverity;
  /** One friendly sentence, no jargon. What a normal user sees. */
  short_line: string;
  cause: string;
  /** Steps a user can do. */
  what_to_do: string[];
  /** When to contact support. */
  escalate: string;
  /** printer, control, app, cloud. */
  affects: string[];
  introduced: string;
  status: ErrorStatus;
  /** Only public entries link to the public lookup page. */
  public: boolean;
  dev_detail_hint?: string;
  related?: string[];
}

export interface ErrorBook {
  /** Version of the bundle this was generated from. */
  version: string;
  entries: ErrorBookEntry[];
}

/**
 * What a component hands over for a failure. Coded errors are additive: `code`
 * sits beside the existing message, and the full text stays in `message` (or
 * `detail`), shown only in dev mode / to admins.
 */
export interface RawError {
  code?: string | null;
  message?: string | null;
  detail?: string | null;
}

export interface ResolvedError {
  /** The book entry, or null for an error the book does not know. */
  entry: ErrorBookEntry | null;
  /** The code to show: the entry's, else null. */
  code: string | null;
  /** The friendly line: the entry's `short_line`, else a generic one. */
  short: string;
  /** Everything the device said, for dev mode / admin. Never blank. */
  full: string;
  /** How the entry was found. */
  via: 'code' | 'message' | 'none';
}
