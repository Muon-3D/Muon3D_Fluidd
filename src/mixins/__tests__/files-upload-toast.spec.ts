import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilesMixin, { uploadErrorText } from '../files'
import { httpClientActions } from '@/api/httpClientActions'
import { EventBus } from '@/eventBus'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: { serverFilesUploadPost: vi.fn() }
}))
vi.mock('@/eventBus', () => ({ EventBus: { $emit: vi.fn(), bus: { $emit: vi.fn() } } }))

const methods = (FilesMixin as any).options.methods

function uploader () {
  const uploads: Array<Record<string, unknown>> = []
  const owner: any = {
    $store: {
      state: { files: { uploads } },
      dispatch: vi.fn((action: string, payload: any) => {
        if (action === 'files/updateFileUpload') {
          const found = uploads.find(u => u.filepath === payload.filepath)
          if (found) Object.assign(found, payload)
          else uploads.push({ ...payload })
        } else if (action === 'files/removeFileUpload') {
          const at = uploads.findIndex(u => u.filepath === payload)
          if (at >= 0) uploads.splice(at, 1)
        }
      })
    }
  }
  for (const name of ['uploadFiles', 'uploadFile', 'performUploadFile', 'getFullPathAndFile']) owner[name] = methods[name].bind(owner)
  return owner
}

describe('upload over the cloud link: the user is told how it went', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('says the file uploaded when the printer accepts it', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost).mockResolvedValue({ data: { result: { item: { path: 'cube.gcode', root: 'gcodes' } } } } as any)
    const file = new File(['G28\n'], 'cube.gcode')
    await expect(uploader().uploadFiles([file], '', 'gcodes', false)).resolves.toEqual(['cube.gcode'])
    expect(EventBus.$emit).toHaveBeenCalledWith('Uploaded cube.gcode', { type: 'success', timeout: 4000 })
  })

  it('shows the link\'s own error text when the printer stops the stream', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost).mockRejectedValue(new Error('sending stopped by peer: error 0'))
    const file = new File(['G28\n'], 'cube.gcode')
    await expect(uploader().uploadFiles([file], '', 'gcodes', false)).resolves.toEqual([])
    expect(EventBus.$emit).toHaveBeenCalledWith('Upload of cube.gcode failed: sending stopped by peer: error 0', { type: 'error', timeout: -1 })
  })

  it('says nothing went wrong when the user cancelled', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost).mockRejectedValue(Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' }))
    const file = new File(['G28\n'], 'cube.gcode')
    await uploader().uploadFiles([file], '', 'gcodes', false)
    expect(EventBus.$emit).not.toHaveBeenCalled()
  })
})

describe('uploadErrorText', () => {
  it('prefers what the printer said', () => {
    expect(uploadErrorText({ response: { status: 403, data: 'muon-link refused this upload: a remote session uploads to the gcodes root only' } }))
      .toBe('muon-link refused this upload: a remote session uploads to the gcodes root only (HTTP 403)')
    expect(uploadErrorText({ response: { status: 400, data: { error: { message: 'Invalid path' } } } })).toBe('Invalid path (HTTP 400)')
    expect(uploadErrorText({ response: { status: 502, data: '' } })).toBe('the printer answered HTTP 502')
  })
  it('falls back to the transport error', () => {
    expect(uploadErrorText(new Error('closed'))).toBe('closed')
    expect(uploadErrorText(undefined)).toBe('unknown error')
  })
})
