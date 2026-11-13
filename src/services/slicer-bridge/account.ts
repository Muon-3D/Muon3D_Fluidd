/**
 * The host side of printer-client 0.5.0's `account` capability: the slicer in
 * Control's /slice frame uses Control's sign-in instead of asking for its own
 * (docs/fluidd-integration.md §12 in muon3d-slicer).
 *
 * - `status` is the stored session as the bridge names it: the console's
 *   account id and what Control shows of it (the name, or the e-mail
 *   address); signed out, both null.
 * - `assertion('models')` is the console's short-lived assertion for the
 *   model service, from the per-account cache (library/assertion.ts). The
 *   protocol's audience is mapped here to the service's own (`MODELS_AUDIENCE`
 *   is what the cache asks the console for); the helper already refuses any
 *   audience the protocol does not name, and this map has no others.
 * - Changes are announced from muon-cloud/account-events.ts, which
 *   state.ts calls synchronously before the session is cleared or replaced
 *   (the contract's rule), never from a watcher that runs later.
 *
 * Failures reach the slicer as the protocol's kinds, as the Library's do
 * (library.ts): nobody signed in is `not-signed-in`.
 */
import type { HostAccount } from './vendor/printer-client/bridge/host'
import type { AccountAudience, AccountStatus } from './vendor/printer-client/bridge/protocol'
import { printerError } from './vendor/printer-client/errors/kinds'
import { currentAccount, onAccountChange, type AccountIdentity } from '@/services/muon-cloud/account-events'
import { modelsAssertion, type ExpiringAssertion } from '@/services/library/assertion'
import { libraryBridgeError } from './errors'

/** The service each protocol audience names (only `models` today). */
export type AudienceAssertions = Record<AccountAudience, { getWithExpiry (): Promise<ExpiringAssertion> }>

export interface FluiddAccount extends HostAccount {
  /** Who is signed in now: what `host.accountStatus` is first called with, before the frame's src is set. */
  current (): AccountStatus;
  /** Hears of every change, synchronously (account-events.ts). Returns its remover. */
  subscribe (listener: (status: AccountStatus) => void): () => void;
}

export interface FluiddAccountOptions {
  identity?: () => AccountIdentity;
  subscribe?: (listener: (status: AccountStatus) => void) => () => void;
  assertions?: AudienceAssertions;
}

const status = (identity: AccountIdentity): AccountStatus => ({ signedIn: identity.signedIn, id: identity.id, name: identity.name })

export function createFluiddAccount (options: FluiddAccountOptions = {}): FluiddAccount {
  const identity = options.identity ?? currentAccount
  const assertions = options.assertions ?? { models: modelsAssertion }
  return {
    status: () => status(identity()),
    async assertion (audience) {
      if (!identity().signedIn) throw printerError('not-signed-in', 'Nobody is signed in to Muon3D')
      const source = Object.prototype.hasOwnProperty.call(assertions, audience) ? assertions[audience] : undefined
      if (!source) throw printerError('bad-request', 'That audience is not one the host serves')
      try {
        const answer = await source.getWithExpiry()
        return { assertion: answer.assertion, expiresAt: answer.expiresAt }
      } catch (error) {
        throw libraryBridgeError(error)
      }
    },
    current: () => status(identity()),
    subscribe: options.subscribe ?? ((listener) => onAccountChange(next => listener(status(next))))
  }
}
