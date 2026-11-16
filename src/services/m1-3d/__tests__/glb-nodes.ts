import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as THREE from 'three'

/**
 * The shipped GLB's node tree (no mesh data), read from the asset itself, so
 * specs run on its real transforms. A node with a skin gets a SkinnedMesh
 * with a one-triangle geometry and the skin's real joints.
 */
export function glbScene (): THREE.Group {
  const b = readFileSync(resolve(__dirname, '../../../assets/m1/m1-accurate.glb'))
  const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
  const objs: THREE.Object3D[] = json.nodes.map((n: any) => {
    let o: THREE.Object3D
    if (n.skin !== undefined) {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(12).fill(0), 4))
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4))
      o = new THREE.SkinnedMesh(g, new THREE.MeshStandardMaterial())
    } else {
      o = new THREE.Object3D()
    }
    o.name = n.name ?? ''
    if (n.translation) o.position.fromArray(n.translation)
    if (n.rotation) o.quaternion.fromArray(n.rotation)
    return o
  })
  json.nodes.forEach((n: any, i: number) => (n.children ?? []).forEach((c: number) => objs[i].add(objs[c])))
  json.nodes.forEach((n: any, i: number) => {
    if (n.skin === undefined) return
    const bones = json.skins[n.skin].joints.map((j: number) => objs[j] as THREE.Bone)
    const mesh = objs[i] as THREE.SkinnedMesh
    mesh.bind(new THREE.Skeleton(bones))
  })
  const root = objs[json.scenes[0].nodes[0]]
  const scene = new THREE.Group()
  scene.add(root)
  scene.updateMatrixWorld(true)
  return scene
}
