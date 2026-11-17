/** @vitest-environment node */
import { webcrypto, createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import { uploadChecksum } from './uploadChecksum'
import { httpClientActions } from '@/api/httpClientActions'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

it.each([true, false])('hashes empty, binary and multi-chunk files with WebCrypto=%s', async secure => {
  vi.stubGlobal('crypto', secure ? webcrypto : {})
  for (const bytes of [Buffer.alloc(0), Buffer.from([0, 255, 1, 128]), Buffer.alloc(2_100_001, 71)]) {
    expect(await uploadChecksum(new Blob([bytes]))).toBe(createHash('sha256').update(bytes).digest('hex'))
  }
})

it('propagates a failed file read instead of uploading without a checksum', async () => {
  vi.stubGlobal('crypto', webcrypto)
  const file = new Blob(['G28'])
  vi.spyOn(file, 'slice').mockReturnValue({ arrayBuffer: () => Promise.reject(new Error('read failed')) } as unknown as Blob)
  await expect(uploadChecksum(file)).rejects.toThrow('read failed')
})

it('never reads the whole file into memory at once', async () => {
  vi.stubGlobal('crypto', webcrypto)
  const file = new Blob([Buffer.alloc(2_100_001, 7)])
  const whole = vi.spyOn(file, 'arrayBuffer')
  const slice = vi.spyOn(file, 'slice')
  await uploadChecksum(file)
  expect(whole).not.toHaveBeenCalled()
  expect(slice).toHaveBeenCalledTimes(3)
})

it('places the checksum before the file on every standard Moonraker upload', async () => {
  const post = vi.spyOn(httpClientActions, 'postForm').mockResolvedValue({} as any)
  const file = new File(['G28\n'], 'test.gcode')
  await httpClientActions.serverFilesUploadPost(file, 'parts', 'gcodes')
  const form = post.mock.calls[0][1] as FormData
  expect([...form.keys()]).toEqual(['checksum', 'file', 'path', 'root'])
  expect(form.get('checksum')).toBe(createHash('sha256').update('G28\n').digest('hex'))
  expect(form.get('path')).toBe('parts')
})
