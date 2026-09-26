/**
 * The `muon_setup` state document and its write results, as the first-run
 * setup spec defines them (specs/m1-first-run-setup/02-setup-api.md §5-6 in
 * Muon-3D/OrcaSlicer, at 88643d7). The printer owns this state; the page only
 * renders it.
 */

export type SetupPhase = 'new' | 'in_progress' | 'complete'

export type StepId = 'language' | 'network' | 'name' | 'update' | 'remote' | 'ready'

export type Cursor = StepId | 'finish'

export type StepStatus = 'pending' | 'done' | 'skipped' | 'hidden'

/** `app` is the Muon3D phone app (KAN-399); `bluetooth` is phase 2. */
export type DriverKind = 'panel' | 'phone' | 'web' | 'app' | 'bluetooth'

export type OpKind = 'region_apply' | 'join' | 'update_install' | 'link' | 'ready_item'

export type JoinPhase = 'saving' | 'associating' | 'authenticating' | 'dhcp' | 'internet_check' | 'update_check'

export interface SetupError {
  code: string;
  message?: string;
  detail?: Record<string, unknown>;
  at_phase?: string;
}

export interface SetupDriver {
  kind: DriverKind;
  client_id: string;
  since: number;
  renewed: number;
  lapsed: boolean;
}

export interface SetupOp {
  kind: OpKind;
  id: string;
  started: number;
  phase?: JoinPhase | string | null;
  progress?: number | null;
  target?: string;
  /** The ready item's `id`, for `kind: ready_item`. */
  item?: string;
}

/** muon-link's `LinkPhase`, mirrored unchanged into `remote.link` (02 §5.9). */
export type LinkState =
  | { phase: 'unavailable' }
  | { phase: 'unlinked' }
  | { phase: 'connecting' }
  | { phase: 'code', code: string, expires_at: number, url: string }
  | { phase: 'offer', account: string, authority: string, fingerprint: string }
  | { phase: 'linked', account: string, connected: boolean }
  | { phase: 'failed', message: string }

export interface ReadyItemState {
  id: string;
  status: 'pending' | 'done' | 'failed' | 'skipped' | 'hidden';
  error: SetupError | null;
}

export interface SetupSteps {
  language: { status: StepStatus, value: string | null, source: string | null };
  network: {
    status: StepStatus;
    kind: 'wifi' | 'ethernet' | null;
    ssid: string | null;
    addresses: string[];
    hostname_local: string | null;
    internet: boolean | 'portal' | null;
    error: SetupError | null;
    /** The owner confirmed the region after joining (02 §5.6a). */
    region_confirmed: boolean;
    /** A failed region apply, until the next apply or join clears it. */
    region_error: SetupError | null;
  };
  name: { status: StepStatus, value: string, derived: string };
  update: { status: StepStatus, current: string, available: string | null, error: SetupError | null };
  remote: {
    status: StepStatus;
    mode: 'local' | 'cloud' | 'later' | null;
    link: LinkState | null;
    error: SetupError | null;
  };
  ready: { status: StepStatus, items: ReadyItemState[] };
}

/**
 * Aux `GET /region` verbatim, plus the derived `market` (02 §6). `explanation`
 * is free English text for logs: never parse or show it.
 */
export interface SetupRegion {
  market: 'picker' | 'locked' | 'none';
  reason: string | null;
  explanation: string | null;
  declared_country: string | null;
  configuration: string | null;
  domain: string | null;
  surroundings: string | null;
  detected_country: string | null;
  basis: string | null;
  enforcement: string | null;
  locked: boolean;
  channels: number[];
}

export interface SetupState {
  version: number;
  rev: number;
  state: SetupPhase;
  cursor: Cursor;
  driver: SetupDriver | null;
  op: SetupOp | null;
  printer: { name: string, display: string, hostname: string, fingerprint: string };
  hotspot: { up: boolean, ssid: string, clients: number, auto_off_at: number | null, address: string };
  clock: { synced: boolean, source: string, tz: string | null, tz_source: string | null };
  region: SetupRegion;
  capabilities: { ethernet: boolean, enterprise: boolean, cloud_link: boolean, self_hosted: boolean, bluetooth: boolean };
  card_dismissed: boolean;
  steps: SetupSteps;
}

/** What every write answers with (02 §5), whatever the domain outcome. */
export interface SetupResult {
  ok: boolean;
  error: SetupError | null;
  state: SetupState | null;
}

export type Security = 'open' | 'owe' | 'wep' | 'wpa2' | 'wpa3' | 'wpa2_wpa3' | 'enterprise'

/** No network carries a country suggestion: the region is confirmed after joining (02 §5.5). */
export interface SetupNetwork {
  ssid: string;
  security: Security;
  signal: number;
  band: string;
  channel: number;
  bssids: number;
  saved: boolean;
  in_use: boolean;
  supported: boolean;
  channel_permitted: boolean;
}

export interface NetworksResult {
  ok: boolean;
  error?: SetupError | null;
  scanned_at: number;
  ethernet: { present: boolean, carrier: boolean, address: string | null };
  networks: SetupNetwork[];
}

export interface SetupOptions {
  languages: Array<{ code: string, endonym: string }>;
  /** Aux `GET /region/options`, passed through unchanged (02 §5.2). */
  region: { countries: string[], preselect: string | null, basis: string | null, locked: boolean };
  timezones?: string[];
  ready_manifest: { version: number, items: Array<Record<string, unknown>> };
}
