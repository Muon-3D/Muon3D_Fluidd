import { bytesToHex } from '@noble/hashes/utils'

const CHUNK = 1024 * 1024

/**
 * SHA-256 of a file, read one chunk at a time so a large G-code file is never
 * held in memory whole (SubtleCrypto has no streaming digest).
 */
export async function uploadChecksum (file: Blob): Promise<string> {
  const { sha256 } = await import('@noble/hashes/sha2')
  const hash = sha256.create()
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    hash.update(new Uint8Array(await file.slice(offset, offset + CHUNK).arrayBuffer()))
  }
  return bytesToHex(hash.digest())
}
