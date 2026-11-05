import type * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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

/** The loader with Draco (from this site) and meshopt set; `dispose` frees the Draco workers. */
export async function createGltfLoader (): Promise<{ loader: GLTFLoader, dispose: () => void }> {
  const [{ GLTFLoader }, { DRACOLoader }, meshopt] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/loaders/DRACOLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js')
  ])
  // three r185's module exports it by name only; @types/three still declares a default.
  const { MeshoptDecoder } = meshopt as unknown as { MeshoptDecoder: typeof meshopt.default }
  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)
  return { loader, dispose: () => draco.dispose() }
}

export async function loadAccurateModel (url: string, onProgress?: (loaded: number, total: number) => void): Promise<LoadedModel> {
  const { loader, dispose } = await createGltfLoader()
  let bytes = 0
  try {
    const gltf = await loader.loadAsync(url, e => {
      bytes = e.loaded
      onProgress?.(e.loaded, e.total)
    })
    return { scene: gltf.scene, bytes }
  } finally {
    dispose()
  }
}
