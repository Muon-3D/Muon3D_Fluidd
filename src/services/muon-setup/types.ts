/**
 * The `muon_setup` state document and its write results, as the first-run
 * setup spec defines them (specs/m1-first-run-setup/02-setup-api.md §5-6 in
 * Muon-3D/OrcaSlicer). The printer owns this state; the page only renders it.
 */

export type SetupPhase = 'new' | 'in_progress' | 'complete'

export type StepId = 'language' | 'network' | 'name' | 'update' | 'remote' | 'ready'

export type Cursor = StepId | 'finish'

export type StepStatus = 'pending' | 'done' | 'skipped' | 'hidden'

export type DriverKind = 'panel' | 'phone' | 'web' | 'bluetooth'

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
}

export interface LinkState {
  phase: 'unavailable' | 'unlinked' | 'connecting' | 'code' | 'offer' | 'linked' | 'failed';
  code?: string | null;
  expires_at?: number | null;
  claim_url?: string | null;
  account?: string | null;
  message?: string | null;
}

export interface ReadyItemState {
  id: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
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
  };
  name: { status: StepStatus, value: string, derived: string };
  update: { status: StepStatus, current: string, available: string | null, error: SetupError | null };
  remote: {
    status: StepStatus;
    mode: 'local' | 'cloud' | 'self_hosted' | 'later' | null;
    link: LinkState | null;
    error: SetupError | null;
  };
  ready: { status: StepStatus, items: ReadyItemState[] };
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
  region: { market: 'picker' | 'locked' | 'none', country: string | null, declared: boolean, config: string | null, source: string | null };
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
  region_suggestion: { country: string, source: 'ap' | 'neighbours' | 'default' } | null;
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
  region: {
    market: 'picker' | 'locked' | 'none';
    applied: { country: string | null, config: string | null, declared: boolean };
    default_country: string | null;
    permitted_channels: number[];
    for_language: string[];
    all: Record<string, string[]>;
    support_code: string | null;
  };
  timezones?: string[];
  ready_manifest: { version: number, items: Array<Record<string, unknown>> };
}
