/**
 * The service worker's caches, named by the build that wrote them (I-159).
 *
 * A cache that outlives its build is how a browser kept serving index-BYup3wDV.js
 * after the server had moved on: nothing told the old entries they were stale.
 * Every cache name now ends in the build's commit, so a new deploy starts empty
 * and the previous build's caches are deleted when the new worker activates.
 */

/** The short commit used as the name suffix; 'dev' when the build has none. */
export const buildSuffix = (commit: string): string => commit ? commit.slice(0, 12) : 'dev'

export interface BuildCacheNames {
  precache: string
  runtime: string
  config: string
  assets: string
}

export const buildCacheNames = (commit: string): BuildCacheNames => {
  const suffix = buildSuffix(commit)
  return {
    precache: `muon-precache-${suffix}`,
    runtime: `muon-runtime-${suffix}`,
    config: `muon-config-${suffix}`,
    assets: `muon-assets-${suffix}`
  }
}

/** Deletes every cache whose name does not belong to `commit`'s build; returns the names removed. */
export async function deleteStaleCaches (
  store: Pick<CacheStorage, 'keys' | 'delete'>,
  commit: string
): Promise<string[]> {
  const suffix = `-${buildSuffix(commit)}`
  const stale = (await store.keys()).filter(name => !name.endsWith(suffix))
  await Promise.all(stale.map(name => store.delete(name)))
  return stale
}
