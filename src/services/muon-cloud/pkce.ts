/**
 * PKCE (RFC 7636) with S256, the only method the console's `/authorize`
 * accepts. A pure module so the test can hold it to the RFC's own vector.
 */

/** RFC 4648 §5 base64url, without padding. */
export function base64url (bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * A code verifier: 32 random bytes as base64url, 43 characters, inside the
 * RFC's 43 to 128 and its unreserved alphabet.
 */
export function newVerifier (random: (n: number) => Uint8Array = randomBytes): string {
  return base64url(random(32))
}

/** An opaque `state`, the same shape, compared on return. */
export function newState (random: (n: number) => Uint8Array = randomBytes): string {
  return base64url(random(16))
}

/** `BASE64URL(SHA256(ASCII(verifier)))`. */
export async function challengeFor (verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

function randomBytes (n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n))
}
