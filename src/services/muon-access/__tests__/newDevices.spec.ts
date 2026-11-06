import Vue from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentPrinterNewDevices, NewDevicesRefused, NEW_DEVICES_PATH } from '../newDevices'

const http = { get: vi.fn(), put: vi.fn() }

const refusal = (status: number, data?: unknown) => Object.assign(new Error('x'), { response: { status, data } })

describe('Allow new devices to ask (client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(Vue as any).$httpClient = http
  })

  it('reads the flag from the printer, bare or under result', async () => {
    http.get.mockResolvedValueOnce({ data: { accept_requests: true } })
    expect(await currentPrinterNewDevices().get()).toBe(true)
    http.get.mockResolvedValueOnce({ data: { result: { accept_requests: false } } })
    expect(await currentPrinterNewDevices().get()).toBe(false)
    expect(http.get).toHaveBeenCalledWith(NEW_DEVICES_PATH)
  })

  it('has no switch on an older printer (404), for a non-owner (403) or an answer without the flag', async () => {
    http.get.mockRejectedValueOnce(refusal(404))
    expect(await currentPrinterNewDevices().get()).toBeNull()
    http.get.mockRejectedValueOnce(refusal(403))
    expect(await currentPrinterNewDevices().get()).toBeNull()
    http.get.mockResolvedValueOnce({ data: {} })
    expect(await currentPrinterNewDevices().get()).toBeNull()
  })

  it('PUTs the flag and returns what the printer holds, not what was asked', async () => {
    http.put.mockResolvedValueOnce({ data: { accept_requests: true } })
    expect(await currentPrinterNewDevices().set(false)).toBe(true)
    expect(http.put).toHaveBeenCalledWith(NEW_DEVICES_PATH, { accept_requests: false })
  })

  it('asks again when the PUT answers without the flag', async () => {
    http.put.mockResolvedValueOnce({ data: {} })
    http.get.mockResolvedValueOnce({ data: { accept_requests: false } })
    expect(await currentPrinterNewDevices().set(false)).toBe(false)
  })

  it('rejects with the printer’s own words on a refusal', async () => {
    http.put.mockRejectedValueOnce(refusal(403, { error: { message: 'Only the owner can change this.' } }))
    const error = await currentPrinterNewDevices().set(false).catch(e => e)
    expect(error).toBeInstanceOf(NewDevicesRefused)
    expect(error.message).toBe('Only the owner can change this.')
    http.put.mockRejectedValueOnce(refusal(500, { error: 'boom' }))
    await expect(currentPrinterNewDevices().set(true)).rejects.toThrow('boom')
  })
})
