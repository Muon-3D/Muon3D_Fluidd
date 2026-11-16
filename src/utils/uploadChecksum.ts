import { bytesToHex } from '@noble/hashes/utils'

export async function uploadChecksum (file: Blob): Promise<string> {
  if (globalThis.crypto?.subtle) {
    return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
  }
  const { sha256 } = await import('@noble/hashes/sha2')
  const hash = sha256.create()
  for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
    hash.update(new Uint8Array(await file.slice(offset, offset + 1024 * 1024).arrayBuffer()))
  }
  return bytesToHex(hash.digest())
}
