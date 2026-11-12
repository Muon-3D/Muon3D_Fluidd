import { afterEach, describe, expect, it } from 'vitest'
import { dropHeldModels, handOverModels, heldModels, holdModels, MODEL_ACCEPT, type ModelsBridge } from '../handover'
import type { ModelsOpen } from '../vendor/printer-client/bridge/protocol'
import { isModelFile } from '@/services/jobs/model'

const TEXT = 'solid bracket\nendsolid bracket\n'

/** An STL. jsdom's File has no arrayBuffer(), a browser's does: given here as a browser reads it. */
const stl = () => {
  const file = new File([TEXT], 'bracket.stl')
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode(TEXT).buffer })
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

  it('holds at most 16 files, and Upload\'s picker takes every model kind Slice opens', () => {
    holdModels(Array.from({ length: 20 }, stl))
    expect(heldModels()).toHaveLength(16)
    for (const ext of MODEL_ACCEPT) expect(isModelFile(`part${ext}`)).toBe(true)
  })
})
