import type { UploadProgress } from '@/services/managed-transport/types'

export const MAX_BLUETOOTH_UPLOAD_BYTES = 512 * 1024
export const BLUETOOTH_UPLOAD_STALL_MS = 75_000
export const BLUETOOTH_UPLOAD_TOO_BIG = 'This file is too big to send over Bluetooth. Connect the printer to Wi-Fi to send it.'
export const BLUETOOTH_UPLOAD_STALLED = 'Bluetooth upload stopped making progress. Reconnect over Bluetooth and try again, or connect the printer to Wi-Fi.'

export function assertBluetoothUploadSize (body: BodyInit | null | undefined, encodedSize = 0) {
  const file = body instanceof FormData ? body.get('file') : body
  const size = file instanceof Blob ? file.size : encodedSize
  if (size > MAX_BLUETOOTH_UPLOAD_BYTES) throw Object.assign(new Error(BLUETOOTH_UPLOAD_TOO_BIG), { kind: 'refused' })
}

export function watchBluetoothUpload<T> (
  send: (progress: UploadProgress) => Promise<T>,
  progress: UploadProgress | undefined,
  stop: () => void,
  signal?: AbortSignal | null
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>
    let settled = false
    let highest = 0
    const finish = (complete: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      complete()
    }
    const fail = (error: unknown) => {
      finish(() => {
        reject(error)
        try { stop() } catch { /* retain the upload's error */ }
      })
    }
    const onAbort = () => finish(() => reject(signal?.reason ?? new DOMException('The request was aborted', 'AbortError')))
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => fail(new Error(BLUETOOTH_UPLOAD_STALLED)), BLUETOOTH_UPLOAD_STALL_MS)
    }
    if (signal?.aborted) return onAbort()
    signal?.addEventListener('abort', onAbort, { once: true })
    arm()
    Promise.resolve().then(() => {
      if (settled) return
      return send((loaded, total) => {
        if (settled) return
        if (loaded > highest) {
          highest = loaded
          arm()
        }
        progress?.(loaded, total)
      })
    }).then(value => finish(() => resolve(value as T)), error => finish(() => reject(error)))
  })
}
