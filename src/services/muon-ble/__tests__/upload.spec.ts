/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertBluetoothUploadSize, BLUETOOTH_UPLOAD_STALLED, BLUETOOTH_UPLOAD_STALL_MS, BLUETOOTH_UPLOAD_BYTES_PER_SECOND, bluetoothLargeFileMessage, bluetoothUploadMinutes, estimateBluetoothUploadSeconds, isLongBluetoothUpload, MAX_BLUETOOTH_UPLOAD_BYTES, watchBluetoothUpload } from '../upload'

afterEach(() => { vi.useRealTimers() })

describe('Bluetooth file size', () => {
  it.each([0, MAX_BLUETOOTH_UPLOAD_BYTES])('accepts %s bytes, excluding multipart overhead', size => {
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(size)]), 'part.gcode')
    expect(() => assertBluetoothUploadSize(form, size + 1024)).not.toThrow()
  })

  it('refuses one byte over the limit with the specified message', () => {
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(MAX_BLUETOOTH_UPLOAD_BYTES + 1)]))
    const message = bluetoothLargeFileMessage(MAX_BLUETOOTH_UPLOAD_BYTES + 1)
    expect(() => assertBluetoothUploadSize(form)).toThrow(message)
    expect(() => assertBluetoothUploadSize(null, MAX_BLUETOOTH_UPLOAD_BYTES + 1)).toThrow(message)
  })

  it("takes real G-code: the limit is well above the old 512 KiB and far below the printer's 1 GiB", () => {
    expect(MAX_BLUETOOTH_UPLOAD_BYTES).toBeGreaterThanOrEqual(8 * 1024 * 1024)
    expect(MAX_BLUETOOTH_UPLOAD_BYTES).toBeLessThan(1024 * 1024 * 1024)
    expect(() => assertBluetoothUploadSize(null, 2 * 1024 * 1024)).not.toThrow()
  })
})

describe('Bluetooth upload estimate', () => {
  it('divides by the assumed 5 KiB/s, rounding up', () => {
    expect(estimateBluetoothUploadSeconds(0)).toBe(0)
    expect(estimateBluetoothUploadSeconds(1)).toBe(1)
    expect(estimateBluetoothUploadSeconds(BLUETOOTH_UPLOAD_BYTES_PER_SECOND * 60)).toBe(60)
    expect(estimateBluetoothUploadSeconds(2 * 1024 * 1024)).toBe(410)
  })

  it('names whole minutes, at least one', () => {
    expect(bluetoothUploadMinutes(10)).toBe(1)
    expect(bluetoothUploadMinutes(2 * 1024 * 1024)).toBe(7)
  })

  it('calls an upload long only past five minutes', () => {
    expect(isLongBluetoothUpload(BLUETOOTH_UPLOAD_BYTES_PER_SECOND * 300)).toBe(false)
    expect(isLongBluetoothUpload(BLUETOOTH_UPLOAD_BYTES_PER_SECOND * 300 + 1)).toBe(true)
  })

  it('words the hotspot hint with the minutes', () => {
    expect(bluetoothLargeFileMessage(2 * 1024 * 1024)).toBe("This file is large for Bluetooth (about 7 min). Join the printer's hotspot and upload from there for a faster transfer.")
  })
})

describe('Bluetooth upload progress watchdog', () => {
  it('does not impose a total duration limit while byte counts increase', async () => {
    vi.useFakeTimers()
    let report!: (loaded: number, total: number) => void
    let done!: (value: string) => void
    const progress = vi.fn()
    const stop = vi.fn()
    const work = watchBluetoothUpload(p => { report = p; return new Promise(resolve => { done = resolve }) }, progress, stop)
    await Promise.resolve()
    for (let n = 1; n <= 3; n++) {
      await vi.advanceTimersByTimeAsync(20_000)
      report(n, 3)
    }
    done('saved')
    await expect(work).resolves.toBe('saved')
    expect(progress.mock.calls).toEqual([[1, 3], [2, 3], [3, 3]])
    expect(stop).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([false, true])('fails on no new bytes, even with duplicate callbacks: %s', async duplicate => {
    vi.useFakeTimers()
    let report!: (loaded: number, total: number) => void
    const stop = vi.fn()
    const work = watchBluetoothUpload(p => { report = p; return new Promise(() => {}) }, undefined, stop)
    const failed = expect(work).rejects.toThrow(BLUETOOTH_UPLOAD_STALLED)
    await vi.advanceTimersByTimeAsync(BLUETOOTH_UPLOAD_STALL_MS - 1)
    if (duplicate) report(0, 100)
    expect(stop).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await failed
    expect(stop).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cleans up on a send error without later closing the connection', async () => {
    vi.useFakeTimers()
    const stop = vi.fn()
    await expect(watchBluetoothUpload(async () => { throw new Error('refused') }, undefined, stop)).rejects.toThrow('refused')
    await vi.advanceTimersByTimeAsync(BLUETOOTH_UPLOAD_STALL_MS)
    expect(stop).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts promptly and ignores late progress and completion', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const progress = vi.fn()
    const stop = vi.fn()
    let report!: (loaded: number, total: number) => void
    let done!: () => void
    const work = watchBluetoothUpload(p => { report = p; return new Promise<void>(resolve => { done = resolve }) }, progress, stop, controller.signal)
    const failed = expect(work).rejects.toThrow('cancelled')
    await Promise.resolve()
    controller.abort(new Error('cancelled'))
    await failed
    report(10, 10)
    done()
    expect(progress).not.toHaveBeenCalled()
    // Cancel closes the session so the radio stops sending, once.
    expect(stop).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('an abort before anything was sent stops nothing', async () => {
    const stop = vi.fn()
    const controller = new AbortController()
    controller.abort(new Error('cancelled'))
    await expect(watchBluetoothUpload(async () => undefined, undefined, stop, controller.signal)).rejects.toThrow('cancelled')
    expect(stop).not.toHaveBeenCalled()
  })

  it('an abort after completion stops nothing, and finishing after done() never stops', async () => {
    const stop = vi.fn()
    const controller = new AbortController()
    let done!: (v: number) => void
    const work = watchBluetoothUpload(() => new Promise<number>(resolve => { done = resolve }), undefined, stop, controller.signal)
    await Promise.resolve()
    done(1)
    await work
    expect(stop).not.toHaveBeenCalled()
    controller.abort()
    expect(stop).not.toHaveBeenCalled()
  })
})
