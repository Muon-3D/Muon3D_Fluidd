import type * as THREE from 'three'

/**
 * Loads the accurate M1 GLB (meshopt or draco compressed). Everything here is
 * behind dynamic imports, so GLTFLoader, the decoders and the model itself sit
 * in a lazy chunk and never in the first-load bundle. The Draco decoder is
 * served from this site (`DRACO_PATH`), not a CDN; the meshopt decoder is
 * bundled with three.js.
 */
export const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`

export interface LoadedModel {
  scene: THREE.Group;
  /** Bytes fetched for the GLB, for the load measurement. */
  bytes: number;
}

export async function loadAccurateModel (url: string, onProgress?: (loaded: number, total: number) => void): Promise<LoadedModel> {
  const [{ GLTFLoader }, { DRACOLoader }, { default: MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/loaders/DRACOLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js')
  ])
  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)
  let bytes = 0
  try {
    const gltf = await loader.loadAsync(url, e => {
      bytes = e.loaded
      onProgress?.(e.loaded, e.total)
    })
    return { scene: gltf.scene, bytes }
  } finally {
    draco.dispose()
  }
}
