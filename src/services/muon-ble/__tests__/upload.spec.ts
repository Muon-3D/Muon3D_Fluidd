/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertBluetoothUploadSize, BLUETOOTH_UPLOAD_STALLED, BLUETOOTH_UPLOAD_STALL_MS, BLUETOOTH_UPLOAD_TOO_BIG, MAX_BLUETOOTH_UPLOAD_BYTES, watchBluetoothUpload } from '../upload'

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
    expect(() => assertBluetoothUploadSize(form)).toThrow(BLUETOOTH_UPLOAD_TOO_BIG)
    expect(() => assertBluetoothUploadSize(null, MAX_BLUETOOTH_UPLOAD_BYTES + 1)).toThrow(BLUETOOTH_UPLOAD_TOO_BIG)
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
      await vi.advanceTimersByTimeAsync(50_000)
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
    expect(stop).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
