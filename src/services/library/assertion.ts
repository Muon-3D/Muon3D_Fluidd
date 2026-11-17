/**
 * The assertion the model service takes in place of the console session
 * (the console's `POST /v1/me/assertion`): one account, one audience, a few
 * minutes. The console allows 60 a session in 10 minutes, so one is kept and
 * shared until a minute before it expires, and only one is asked for at a
 * time. It belongs to the account and the console session it was asked with: a new sign-in
 * (or a refreshed session token) asks again.
 */
import { CloudError, cloudApi, storedToken } from '@/services/muon-cloud/api'
import { confirmedAccountId, onAccountCleared } from '@/services/muon-cloud/account-events'
import { LibraryError, MODELS_AUDIENCE, notSignedIn, type AssertionProvider } from './api'

/** How long before its expiry an assertion is replaced. */
export const REFRESH_BEFORE_MS = 60_000

export interface AssertionAnswer {
  assertion: string;
  /** Seconds since the epoch. */
  expires_at: number;
}

export interface AssertionCacheOptions {
  /** Asks the console for a new one. */
  fetch: () => Promise<AssertionAnswer>;
  /** The console session now, or null when signed out. */
  session: () => string | null;
  /**
   * The signed-in account's id now, or null when nobody is. Given, an assertion is kept for that account and no
   * other: after a switch the previous account's is never answered, even before anything cleared it.
   */
  account?: () => string | null;
  now?: () => number;
}

/** What the slicer's bridge hands over: the assertion and when it stops working (milliseconds since the epoch). */
export interface ExpiringAssertion {
  assertion: string;
  expiresAt: number;
}

export interface AssertionCache extends AssertionProvider {
  /** The same assertion as `get`, with its expiry. */
  getWithExpiry (): Promise<ExpiringAssertion>;
  /** Forgets the kept assertion and any ask in flight (sign-out, another account). */
  clear (): void;
}

export function createAssertionCache (options: AssertionCacheOptions): AssertionCache {
  const now = options.now ?? Date.now
  let kept: { key: string, assertion: string, expiresAt: number } | null = null
  let asking: { key: string, promise: Promise<ExpiringAssertion> } | null = null
  // Bumped by every clear: an ask that was started before one never keeps its answer.
  let generation = 0

  /** The account and the session together, or null when either is missing. */
  const keyNow = (): string | null => {
    const session = options.session()
    if (!session) return null
    if (!options.account) return session
    const account = options.account()
    return account ? `${account}\n${session}` : null
  }

  function getWithExpiry (): Promise<ExpiringAssertion> {
    const key = keyNow()
    if (!key) {
      kept = null
      return Promise.reject(notSignedIn())
    }
    if (kept && kept.key === key && now() < kept.expiresAt - REFRESH_BEFORE_MS) {
      return Promise.resolve({ assertion: kept.assertion, expiresAt: kept.expiresAt })
    }
    if (asking && asking.key === key) return asking.promise
    const started = generation
    const mine = {
      key,
      promise: options.fetch().then((answer): ExpiringAssertion => {
        if (typeof answer?.assertion !== 'string' || !answer.assertion || typeof answer.expires_at !== 'number') {
          throw new LibraryError('console', 'The Muon3D service sent no assertion.')
        }
        const got = { assertion: answer.assertion, expiresAt: answer.expires_at * 1000 }
        // Asked for an account that has left meanwhile: it is answered to whoever asked, never kept for the next.
        if (generation === started && keyNow() === key) kept = { key, ...got }
        return got
      }).finally(() => {
        if (asking === mine) asking = null
      })
    }
    asking = mine
    return mine.promise
  }

  return {
    get: () => getWithExpiry().then(answer => answer.assertion),
    getWithExpiry,
    drop () {
      kept = null
    },
    clear () {
      generation++
      kept = null
      asking = null
    }
  }
}

/** The console's refusal as the Library's: a session that has ended is `not-signed-in`. */
export async function consoleAssertion (audience: string = MODELS_AUDIENCE): Promise<AssertionAnswer> {
  try {
    return await cloudApi.assertion(audience)
  } catch (error) {
    if (error instanceof CloudError) {
      if (error.status === 401) throw notSignedIn()
      if (error.status === 0) throw new LibraryError('offline', 'The Muon3D service could not be reached.')
      throw new LibraryError('console', error.message, error.status)
    }
    throw error
  }
}

/**
 * The model service's assertions, for this browser's Muon3D session: kept per signed-in account (the id the console
 * account events name, muon-cloud/account-events.ts) and cleared when the account leaves or changes.
 */
export const modelsAssertion = createAssertionCache({
  fetch: () => consoleAssertion(),
  session: storedToken,
  // Null while the stored token is not the one /me confirmed for the account on screen (account-events.ts).
  account: () => confirmedAccountId(storedToken())
})

onAccountCleared(() => modelsAssertion.clear())
