import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildPickProxy, clusterTriangles, placePickProxy, wantsPickProxy } from '../pick-proxy'

describe('pick-proxy', () => {
  it('collapses vertices in one cell and drops the triangles that vanish', () => {
    // Two triangles: one spans cells, one sits inside a single cell and goes.
    const positions = [0, 0, 0, 10, 0, 0, 0, 10, 0, 0.1, 0.1, 0, 0.2, 0.1, 0, 0.1, 0.2, 0]
    const out = clusterTriangles(positions, [0, 1, 2, 3, 4, 5], 1)
    expect(Array.from(out.vertices)).toEqual([0, 1, 2])
    expect(Array.from(out.triangles)).toEqual([0, 1, 2])
  })

  it('keeps one copy of a triangle repeated after collapsing', () => {
    const positions = [0, 0, 0, 5, 0, 0, 0, 5, 0, 0.2, 0, 0, 5.2, 0, 0, 0, 5.2, 0]
    const out = clusterTriangles(positions, null, 1)
    expect(out.triangles.length).toBe(3)
  })

  it('makes a dense sphere a hundred times smaller and still hits it where it is', () => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(40, 256, 128), new THREE.MeshBasicMaterial())
    sphere.position.set(100, 0, 0)
    sphere.updateMatrixWorld(true)
    const proxy = buildPickProxy(sphere, 3)
    const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3
    expect(tris(proxy.geometry)).toBeLessThan(tris(sphere.geometry) / 10)
    placePickProxy(proxy, sphere)
    const ray = new THREE.Raycaster(new THREE.Vector3(100, 0, 500), new THREE.Vector3(0, 0, -1))
    const hit = ray.intersectObject(proxy, false)[0]
    expect(hit.distance).toBeGreaterThan(455)
    expect(hit.distance).toBeLessThan(465)
    const miss = new THREE.Raycaster(new THREE.Vector3(150, 0, 500), new THREE.Vector3(0, 0, -1))
    expect(miss.intersectObject(proxy, false)).toHaveLength(0)
  })

  it('follows a skinned mesh as its bone moves', () => {
    const geometry = new THREE.BoxGeometry(10, 10, 10, 8, 8, 8)
    const n = geometry.getAttribute('position').count
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4))
    const w = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) w[i * 4] = 1
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(w, 4))
    const bone = new THREE.Bone()
    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial())
    mesh.add(bone)
    mesh.bind(new THREE.Skeleton([bone]))
    const proxy = buildPickProxy(mesh, 2)
    bone.position.set(50, 0, 0)
    mesh.updateMatrixWorld(true)
    placePickProxy(proxy, mesh)
    const at = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, 0, 100), new THREE.Vector3(0, 0, -1)).intersectObject(proxy, false).length
    expect(at(50)).toBeGreaterThan(0)
    expect(at(0)).toBe(0)
  })

  it('never coarsens past a share of the mesh, whatever units it is drawn in', () => {
    // A 1-unit sphere asked for a 3-unit cell (a model in metres, say) keeps its shape.
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshBasicMaterial())
    sphere.updateMatrixWorld(true)
    const proxy = buildPickProxy(sphere, 3)
    placePickProxy(proxy, sphere)
    const hit = new THREE.Raycaster(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1)).intersectObject(proxy, false)[0]
    expect(hit.distance).toBeGreaterThan(8.9)
    expect(hit.distance).toBeLessThan(9.1)
  })

  it('leaves light meshes to be picked as they are', () => {
    expect(wantsPickProxy(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)))).toBe(false)
    expect(wantsPickProxy(new THREE.Mesh(new THREE.SphereGeometry(1, 256, 128)))).toBe(true)
  })
})
