import type { UploadProgress } from '@/services/managed-transport/types'

/**
 * Control's own ceiling, not the printer's: muon-link-device accepts uploads up
 * to 1 GiB (DEFAULT_MAX_UPLOAD_BYTES) and Moonraker the same. The body is held
 * in memory and copied a few times before it reaches WASM, so 16 MiB is as far
 * as a phone browser takes it safely.
 */
export const MAX_BLUETOOTH_UPLOAD_BYTES = 16 * 1024 * 1024
/** Conservative useful file throughput over BLE (docs/development/bluetooth-uploads.md). */
export const BLUETOOTH_UPLOAD_BYTES_PER_SECOND = 5 * 1024
/** Past this the person is told to use the hotspot, but may carry on. */
export const BLUETOOTH_UPLOAD_LONG_SECONDS = 5 * 60
export const BLUETOOTH_UPLOAD_STALL_MS = 30_000
export function estimateBluetoothUploadSeconds (bytes: number): number {
  return Math.ceil(Math.max(0, bytes) / BLUETOOTH_UPLOAD_BYTES_PER_SECOND)
}

export function bluetoothUploadMinutes (bytes: number): number {
  return Math.max(1, Math.ceil(estimateBluetoothUploadSeconds(bytes) / 60))
}

/** Shown for a long upload (it carries on) and for one over the limit (it is refused). */
export function bluetoothLargeFileMessage (bytes: number): string {
  return `This file is large for Bluetooth (about ${bluetoothUploadMinutes(bytes)} min). Join the printer's hotspot and upload from there for a faster transfer.`
}

export function isLongBluetoothUpload (bytes: number): boolean {
  return estimateBluetoothUploadSeconds(bytes) > BLUETOOTH_UPLOAD_LONG_SECONDS
}

export function bluetoothUploadFileSize (body: BodyInit | null | undefined, encodedSize = 0): number {
  const file = body instanceof FormData ? body.get('file') : body
  return file instanceof Blob ? file.size : encodedSize
}
export const BLUETOOTH_UPLOAD_STALLED = 'Bluetooth upload stopped making progress. Reconnect over Bluetooth and try again, or connect the printer to Wi-Fi.'

export function assertBluetoothUploadSize (body: BodyInit | null | undefined, encodedSize = 0) {
  const size = bluetoothUploadFileSize(body, encodedSize)
  if (size > MAX_BLUETOOTH_UPLOAD_BYTES) throw Object.assign(new Error(bluetoothLargeFileMessage(size)), { kind: 'refused' })
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
    // Cancel must stop the sending: a Bluetooth upload runs for minutes, and
    // the session has no per-request cancel, so it is closed (as for a stall).
    // Nothing was started yet when `started` is false.
    let started = false
    const onAbort = () => finish(() => {
      reject(signal?.reason ?? new DOMException('The request was aborted', 'AbortError'))
      if (started) { try { stop() } catch { /* the abort is what is reported */ } }
    })
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => fail(new Error(BLUETOOTH_UPLOAD_STALLED)), BLUETOOTH_UPLOAD_STALL_MS)
    }
    if (signal?.aborted) return onAbort()
    signal?.addEventListener('abort', onAbort, { once: true })
    arm()
    Promise.resolve().then(() => {
      if (settled) return
      started = true
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
