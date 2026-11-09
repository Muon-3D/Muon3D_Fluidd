/** Boxwood's /server/aux/update/status on 6 Nov 2026, trimmed: an update staged on the spare slot, not activated. Its commit still holds an old (5 Oct) quarantine error. */
import type { AuxUpdateStatus } from '../../model'

export const BOXWOOD_STAGED = {
  state: 'idle',
  error: null,
  current_version: '20261030021530-14fa9bb',
  target_version: '20261105115132-d6862df',
  update_available: true,
  target_stale: false,
  requires_commit: false,
  progress: null,
  last_checked: '2026-11-06T15:46:45.455947Z',
  check: {
    state: 'succeeded',
    last_started: '2026-11-06T15:46:45.455947Z',
    last_success: '2026-11-06T15:46:46.883550Z',
    last_failure: '2026-11-06T10:50:26.895682Z',
    error: null
  },
  install: {
    phase: 'idle',
    job_id: 'fa5682037a1d46b7a7082be9457337ae',
    started_at: '2026-11-02T12:18:08.297703Z',
    finished_at: '2026-11-02T12:18:11.867396Z',
    progress: null,
    error: null
  },
  stage: {
    state: 'staged',
    version: '20261105115132-d6862df',
    bundle_hash: 'sha512-256:8d2a99dfbfdfff4829acd011b8ce9530333d3e311550c41561377f541e855731',
    job_id: '9ed4294e62064947b5c75af4d9423536',
    last_attempt_at: '2026-11-06T11:31:22.153534Z',
    finished_at: '2026-11-06T11:53:02.355787Z',
    progress: 100.0,
    last_skip_reason: 'a stage is already staged',
    slot_fingerprint: {}
  },
  commit: {
    state: 'committed',
    required: false,
    last_started: null,
    last_success: '2026-10-02T13:18:15.898177Z',
    last_failure: null,
    verification_level: 'nexigon',
    error: {
      kind: 'update_quarantined',
      message: 'Update 20260930172847-f6bc5c0 was rolled back because this printer did not pass local health verification. This exact bundle will not be installed again; a corrected bundle can still update.',
      retryable: false,
      occurred_at: '2026-10-05T11:02:26.933768Z',
      detail: null
    }
  },
  anti_rollback: {
    decision: 'newer',
    would_block: false,
    blocked: false,
    reason: 'target build is newer than the running build'
  }
} as AuxUpdateStatus
