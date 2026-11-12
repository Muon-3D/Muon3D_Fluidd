import { afterEach, describe, expect, it } from 'vitest'
import { addModelText, dropHeldModels, handOverModels, heldModels, holdModels, isSlicerModel, MODEL_ACCEPT, SLICER_MODEL_EXTENSIONS, type ModelsBridge } from '../handover'
import type { ModelsOpen } from '../vendor/printer-client/bridge/protocol'
import { isModelFile } from '@/services/jobs/model'

const TEXT = 'solid bracket\nendsolid bracket\n'

/** An STL. jsdom's File has no arrayBuffer(), a browser's does: given here as a browser reads it. */
const stl = () => {
  const file = new File([TEXT], 'bracket.stl')
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode(TEXT).buffer })
  return file
}

/** A file of `size` bytes whose bytes must never be read: the limits are checked before reading. */
const unread = (size = 1) => {
  const file = new File(['x'], 'part.stl')
  Object.defineProperty(file, 'size', { value: size })
  Object.defineProperty(file, 'arrayBuffer', { value: () => { throw new Error('read before the limits were checked') } })
  return file
}

function bridge (features: string[], connected = true, takes = true) {
  const sent: ModelsOpen[] = []
  const b: ModelsBridge = { connected, clientFeatures: features, modelsOpen: (open) => { sent.push(open); return takes } }
  return { b, sent }
}

afterEach(() => dropHeldModels())

describe('handing models to the slicer (KAN-2191)', () => {
  it('sends the held files, name and bytes, to a slicer that lists models.open, then lets them go', async () => {
    holdModels([stl()])
    const { b, sent } = bridge(['ui.look', 'models.open'])
    expect(await handOverModels(b)).toBe('sent')
    expect(sent).toHaveLength(1)
    expect(sent[0].files[0].name).toBe('bracket.stl')
    expect(new TextDecoder().decode(sent[0].files[0].bytes)).toBe('solid bracket\nendsolid bracket\n')
    expect(heldModels()).toHaveLength(0)
    expect(await handOverModels(b)).toBe('none')
  })

  it('keeps them while no slicer is welcomed', async () => {
    holdModels([stl()])
    const { b, sent } = bridge(['models.open'], false)
    expect(await handOverModels(b)).toBe('none')
    expect(await handOverModels(null)).toBe('none')
    expect(sent).toHaveLength(0)
    expect(heldModels()).toHaveLength(1)
  })

  it('an older slicer is sent nothing: not-taken, and they are let go', async () => {
    holdModels([stl()])
    const { b, sent } = bridge(['ui.look', 'library'])
    expect(await handOverModels(b)).toBe('not-taken')
    expect(sent).toHaveLength(0)
    expect(heldModels()).toHaveLength(0)
  })

  it('files the bridge refuses are not-taken', async () => {
    holdModels([stl()])
    const { b } = bridge(['models.open'], true, false)
    expect(await handOverModels(b)).toBe('not-taken')
  })

  it('more than 16 files: nothing is held, nothing is read, and the problem is the count', () => {
    const files = Array.from({ length: 17 }, unread)
    const problem = holdModels(files)
    expect(problem).toMatch(/at most 16 models at once, and these are 17/)
    expect(heldModels()).toHaveLength(0)
    expect(holdModels(Array.from({ length: 16 }, unread))).toBeNull()
    expect(heldModels()).toHaveLength(16)
  })

  it('more than 512 MiB in all: nothing is held, nothing is read, and the problem is the size', () => {
    const big = (mib: number) => unread(mib * 1024 * 1024)
    expect(holdModels([big(300), big(300)])).toMatch(/600 MiB together; Slice takes 512 MiB/)
    expect(heldModels()).toHaveLength(0)
    expect(holdModels([big(256), big(256)])).toBeNull()
  })

  it('giving up (no slicer, or none welcomed in time) lets them go as not-taken', async () => {
    holdModels([stl()])
    expect(await handOverModels(null, true)).toBe('not-taken')
    expect(heldModels()).toHaveLength(0)
    holdModels([stl()])
    expect(await handOverModels(bridge(['models.open'], false).b, true)).toBe('not-taken')
    expect(heldModels()).toHaveLength(0)
    expect(addModelText(['a.stl', 'b.3mf'])).toBe('This slicer can\'t take a model from here yet: add a.stl, b.3mf with Add model.')
  })

  it('only what the slicer opens (its MODEL_EXTENSIONS: stl, obj, 3mf) is promised to it; STEP is not', () => {
    expect([...SLICER_MODEL_EXTENSIONS].sort()).toEqual(['3mf', 'obj', 'stl'])
    expect(MODEL_ACCEPT).toEqual(['.stl', '.obj', '.3mf'])
    for (const name of ['a.stl', 'B.STL', 'c.obj', 'd.3mf']) expect(isSlicerModel(name)).toBe(true)
    for (const name of ['e.step', 'f.stp', 'g.gcode', 'h.stl.zip']) expect(isSlicerModel(name)).toBe(false)
    // Every one is still a model (a drop of one is never uploaded to the printer).
    for (const name of ['a.stl', 'c.obj', 'd.3mf', 'e.step']) expect(isModelFile(name)).toBe(true)
  })
})
