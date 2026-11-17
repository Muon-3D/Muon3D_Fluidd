import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilesMixin from '../files'
import { httpClientActions } from '@/api/httpClientActions'
import { SocketActions } from '@/api/socketActions'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverFilesUploadPost: vi.fn()
  }
}))

vi.mock('@/api/socketActions', () => ({
  SocketActions: {
    serverFilesGetDirectory: vi.fn()
  }
}))

function uploader () {
  return {
    performUploadFile: (FilesMixin as any).options.methods.performUploadFile,
    $store: {
      dispatch: vi.fn(),
      state: { files: { uploads: [] } }
    }
  }
}

describe('FilesMixin upload request ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const upload = (owner: ReturnType<typeof uploader>, file: File) =>
    (FilesMixin as any).options.methods.uploadFile.call(owner, file, '', 'gcodes', false) as Promise<unknown>

  it('sends one request when one browser action reaches two upload listeners', async () => {
    let finish: (value: unknown) => void = () => {}
    vi.mocked(httpClientActions.serverFilesUploadPost).mockImplementation(() => new Promise(resolve => { finish = resolve }) as any)
    const file = new File(['G28\n'], 'boxwood.gcode', { type: 'text/x-gcode' })
    const firstListener = upload(uploader(), file)
    const secondListener = upload(uploader(), file)

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(1)
    expect(SocketActions.serverFilesGetDirectory).not.toHaveBeenCalled()

    finish({ data: { result: { item: { path: file.name, root: 'gcodes' } } } })
    await expect(Promise.all([firstListener, secondListener])).resolves.toHaveLength(2)
  })

  it('allows a retry only after the failed request has settled', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost)
      .mockRejectedValueOnce(new Error('relay refused the upload'))
      .mockResolvedValueOnce({ data: { result: { item: { path: 'boxwood.gcode', root: 'gcodes' } } } } as any)
    const file = new File(['G28\n'], 'boxwood.gcode')

    await expect(upload(uploader(), file)).rejects.toThrow('relay refused')
    await expect(upload(uploader(), file)).resolves.toBeDefined()

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(2)
  })

  it('does not suppress a later deliberate upload after success', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost).mockResolvedValue({ data: { result: { item: { path: 'boxwood.gcode', root: 'gcodes' } } } } as any)
    const file = new File(['G28\n'], 'boxwood.gcode')

    await upload(uploader(), file)
    await upload(uploader(), file)

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(2)
  })
})

describe('FilesMixin uploadFiles result', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function batchOwner () {
    const owner: any = {
      ...uploader(),
      getFullPathAndFile: (FilesMixin as any).options.methods.getFullPathAndFile
    }
    owner.$store.state.files.uploads = [
      { filepath: 'a.gcode', cancelled: false },
      { filepath: 'b.gcode', cancelled: false }
    ]
    owner.uploadFile = (FilesMixin as any).options.methods.uploadFile
    return owner
  }

  const run = (owner: any, files: File[], canContinue?: () => boolean) =>
    (FilesMixin as any).options.methods.uploadFiles.call(owner, files, '', 'gcodes', false, canContinue)

  it('lists only the files that actually uploaded', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost)
      .mockResolvedValueOnce({ data: {} } as any)
      .mockRejectedValueOnce(new Error('aborted'))
    const result = await run(batchOwner(), [new File(['x'], 'a.gcode'), new File(['y'], 'b.gcode')])
    expect(result).toEqual(['a.gcode'])
  })

  it('lists nothing for a cancelled file', async () => {
    const owner = batchOwner()
    owner.$store.state.files.uploads = [{ filepath: 'a.gcode', cancelled: true }]
    const result = await run(owner, [new File(['x'], 'a.gcode')])
    expect(result).toEqual([])
    expect(httpClientActions.serverFilesUploadPost).not.toHaveBeenCalled()
  })

  it('returns false when the batch was stopped', async () => {
    const result = await run(batchOwner(), [new File(['x'], 'a.gcode')], () => false)
    expect(result).toBe(false)
  })
})
