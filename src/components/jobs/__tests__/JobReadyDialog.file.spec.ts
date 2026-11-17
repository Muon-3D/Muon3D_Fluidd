import { afterEach, describe, expect, it, vi } from 'vitest'
import JobReadyDialog from '../JobReadyDialog.vue'
import { SocketActions } from '@/api/socketActions'

const options = (JobReadyDialog as any).options

describe('JobReadyDialog uploaded file lookup', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it.each(['part.gcode', 'parts/part.gcode', 'parts/small/part.gcode'])('loads and finds %s in its actual folder', (filename) => {
    const directory = options.computed.jobDirectory.get.call({ root: 'gcodes', filename })
    const path = filename.split('/').slice(0, -1).join('/')
    expect(directory).toBe(path ? `gcodes/${path}` : 'gcodes')
    const load = vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any)
    options.methods.loadFiles.call({ root: 'gcodes', jobDirectory: directory })
    expect(load).toHaveBeenCalledWith('gcodes', directory)
    const file = { type: 'file', filename: 'part.gcode', path }
    const lookup = vi.fn(() => [file])
    const toJobFile = vi.fn((file) => ({ path: [file.path, file.filename].filter(Boolean).join('/') }))
    const job = options.computed.job.get.call({ filename, jobDirectory: directory, $store: { getters: { 'files/getDirectory': lookup } }, toJobFile })
    expect(lookup).toHaveBeenCalledWith(directory)
    expect(job).toEqual({ path: filename })
    expect(toJobFile).toHaveBeenCalledWith(file)
  })

  it.each([{ entries: undefined }, { entries: [] }, { entries: [{ type: 'directory', filename: 'part.gcode' }] }])('does not offer a missing file: %j', ({ entries }) => {
    const job = options.computed.job.get.call({
      filename: 'parts/part.gcode',
      jobDirectory: 'gcodes/parts',
      $store: { getters: { 'files/getDirectory': () => entries } },
      toJobFile: vi.fn()
    })
    expect(job).toBeNull()
  })

  it('does not offer a stored model as a print job', () => {
    const job = options.computed.job.get.call({
      filename: 'parts/part.3mf',
      jobDirectory: 'gcodes/parts',
      $store: { getters: { 'files/getDirectory': () => [{ type: 'file', filename: 'part.3mf' }] } },
      toJobFile: vi.fn()
    })
    expect(job).toBeNull()
  })
})
