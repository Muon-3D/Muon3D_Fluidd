import { describe, expect, it } from 'vitest'
import { createGltfLoader, DRACO_PATH } from '../accurate/gltf-load'

describe('the accurate model loader', () => {
  it('has the meshopt decoder set (three r185 exports it by name only)', async () => {
    const { loader, dispose } = await createGltfLoader()
    const decoder = (loader as unknown as { meshoptDecoder: { supported: boolean } | null }).meshoptDecoder
    expect(decoder).toBeTruthy()
    expect(typeof decoder!.supported).toBe('boolean')
    dispose()
  })

  it('reads the Draco decoder from this site, not a CDN', () => {
    expect(DRACO_PATH).toMatch(/^\/?[^:]*draco\/$/)
  })
})
