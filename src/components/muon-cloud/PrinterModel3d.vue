<template>
  <div
    ref="host"
    class="muon-model3d"
  >
    <div
      v-if="note"
      class="muon-model3d__note"
    >
      {{ note }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { PrinterStatus } from '@/services/muon-cloud/state'
import { cloudPrinterConnection } from '@/services/muon-cloud/state'
import { parseToolpath, segmentsPrinted, type Toolpath } from '@/services/muon-cloud/toolpath'
import { cloudBaseUrl } from '@/services/muon-cloud/api'

/* three.js is loaded at run time from the console's static assets, so the
   Fleet page costs nothing to a Fluidd that never opens it. */
// From the Muon3D service, so the model also loads in a printer-served Fluidd.
const THREE_URL = () => `${cloudBaseUrl()}/muon-3d/three.module.min.js`
const MODEL_URL = () => `${cloudBaseUrl()}/muon-3d/m1.json`
const MAX_GCODE_BYTES = 40 * 1024 * 1024

let threePromise: Promise<any> | null = null
let modelJsonPromise: Promise<any | null> | null = null

function loadThree () {
  threePromise ??= import(/* @vite-ignore */ THREE_URL())
  return threePromise
}

function loadModelJson () {
  modelJsonPromise ??= fetch(MODEL_URL()).then(r => (r.ok ? r.json() : null)).catch(() => null)
  return modelJsonPromise
}

const toolpaths = new Map<string, Promise<Toolpath | null>>()

/** The M1 in scene units (mm), and how to pose it from Klipper coordinates. */
interface Rig {
  root: any;
  /** Where printed plastic is drawn; moves with the bed. */
  partFrame: any;
  pose (x: number, y: number, z: number): void;
}

@Component({})
export default class PrinterModel3d extends Vue {
  @Prop({ type: String, required: true })
  readonly printerId!: string

  @Prop({ type: Object, default: null })
  readonly status!: PrinterStatus | null

  @Prop({ type: Boolean, default: true })
  readonly spin!: boolean

  note = ''
  private T: any = null
  private renderer: any = null
  private scene: any = null
  private camera: any = null
  private rig: Rig | null = null
  private lines: any = null
  private path: Toolpath | null = null
  private pathFile = ''
  private frame = 0
  private angle = 0.7
  private observer: ResizeObserver | null = null
  private disposed = false

  async mounted () {
    try {
      this.T = await loadThree()
    } catch {
      this.note = '3D view unavailable'
      return
    }
    if (this.disposed) return
    const T = this.T
    const host = this.$refs.host as HTMLElement
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(this.renderer.domElement)
    this.scene = new T.Scene()
    this.camera = new T.PerspectiveCamera(30, 1, 10, 5000)
    this.scene.add(new T.HemisphereLight(0xdfe8e0, 0x1a1f1c, 1.4))
    const key = new T.DirectionalLight(0xffffff, 1.6)
    key.position.set(400, 700, 500)
    this.scene.add(key)

    const json = await loadModelJson()
    if (this.disposed) return
    this.rig = json ? this.photorealRig(json) : this.stubRig()
    this.scene.add(this.rig.root)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(host)
    this.resize()
    this.onStatus()
    this.loop()
  }

  beforeDestroy () {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.observer?.disconnect()
    this.renderer?.dispose()
    this.renderer?.forceContextLoss?.()
  }

  /** The exported photoreal model, posed through the parts it names. */
  photorealRig (json: any): Rig {
    const T = this.T
    const root = new T.ObjectLoader().parse(json)
    const find = (name: string) => root.getObjectByName(name)
    const yCarriage = find('yCarriage')
    const pod = find('pod')
    const bedLift = find('bedLift')
    const print = find('print')
    if (print) print.visible = false
    const meta = root.userData?.rig ?? {}
    const partFrame = new T.Group()
    partFrame.name = 'partFrame'
    ;(bedLift ?? root).add(partFrame)
    return {
      root,
      partFrame,
      pose: (x: number, y: number, z: number) => {
        const tx = meta.travelX ?? 100
        const tz = meta.travelZ ?? 90
        const hx = ((x - 100) / 100) * tx
        const hz = ((y - 90) / 90) * tz
        if (yCarriage) yCarriage.position.z = hz
        if (pod) pod.position.x = hx
        if (bedLift) bedLift.position.y = 26 + ((z + 4) / 164) * (meta.bedTravel ?? 164)
        // The M1 prints hanging: the plate is above, and the part grows down
        // from its underside towards the nozzle. Klipper's (0, 0) sits where
        // the nozzle is when the head is at X0 Y0, in the bed's own frame.
        const nozzleOffX = -(meta.podW ?? 70) / 2 + 20
        const nozzleOffZ = -(meta.podL ?? 95) / 2 + 16
        partFrame.position.set(
          -100 + nozzleOffX - (meta.mastX ?? 0),
          0,
          -90 * (tz / 90) + nozzleOffZ - (meta.mastZ ?? 0)
        )
        partFrame.scale.set(1, -1, tz / 90)
      }
    }
  }

  /** A low-poly stand-in for when the exported model is not served. */
  stubRig (): Rig {
    const T = this.T
    const root = new T.Group()
    const dark = new T.MeshStandardMaterial({ color: 0x2b302c, metalness: 0.4, roughness: 0.6 })
    const metal = new T.MeshStandardMaterial({ color: 0x9aa39c, metalness: 0.8, roughness: 0.35 })
    const glass = new T.MeshStandardMaterial({ color: 0x3a4a44, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.85 })
    const box = (w: number, h: number, d: number, m: any, x: number, y: number, z: number) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m)
      mesh.position.set(x, y, z)
      root.add(mesh)
      return mesh
    }
    box(232, 40, 232, dark, 0, 20, 0)
    box(34, 300, 34, dark, -99, 190, -99)
    const bed = new T.Group()
    root.add(bed)
    const plate = new T.Mesh(new T.BoxGeometry(200, 4, 180), glass)
    bed.add(plate)
    const arm = new T.Mesh(new T.BoxGeometry(20, 12, 120), metal)
    arm.position.set(-90, 8, -40)
    bed.add(arm)
    const rail = box(210, 10, 14, metal, 0, 70, 0)
    const pod = new T.Mesh(new T.BoxGeometry(34, 44, 40), metal)
    root.add(pod)
    const nozzle = new T.Mesh(new T.ConeGeometry(4, 10, 12), new T.MeshStandardMaterial({ color: 0xc8a24a, metalness: 0.9, roughness: 0.3 }))
    nozzle.position.y = 27
    pod.add(nozzle)
    const partFrame = new T.Group()
    bed.add(partFrame)
    return {
      root,
      partFrame,
      pose: (x: number, y: number, z: number) => {
        const nozzleTop = 104
        bed.position.set(0, nozzleTop + 2 + Math.max(0, z), 0)
        pod.position.set(x - 100, 78, y - 90)
        rail.position.z = y - 90
        partFrame.position.set(-100, -2, -90)
        partFrame.scale.set(1, -1, 1)
      }
    }
  }

  resize () {
    const host = this.$refs.host as HTMLElement | undefined
    if (!host || !this.renderer) return
    const w = host.clientWidth || 300
    const h = host.clientHeight || 220
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  loop () {
    if (this.disposed) return
    this.frame = requestAnimationFrame(() => this.loop())
    if (this.spin) this.angle += 0.0025
    const r = 640
    this.camera.position.set(Math.sin(this.angle) * r, 330, Math.cos(this.angle) * r)
    this.camera.lookAt(0, 130, 0)
    this.renderer.render(this.scene, this.camera)
  }

  @Watch('status', { deep: true })
  onStatus () {
    if (!this.rig) return
    const s = this.status
    const p = s?.position ?? [100, 90, 20, 0]
    this.rig.pose(p[0], p[1], p[2])
    const file = s?.filename ?? ''
    if (file && file !== this.pathFile && (s?.state === 'printing' || s?.state === 'paused' || s?.state === 'complete')) {
      this.pathFile = file
      this.loadToolpath(file, s?.fileSize ?? 0)
    }
    this.drawProgress()
  }

  async loadToolpath (file: string, size: number) {
    if (size > MAX_GCODE_BYTES) {
      this.note = 'File too large to preview'
      return
    }
    const key = `${this.printerId}:${file}`
    let pending = toolpaths.get(key)
    if (!pending) {
      pending = (async () => {
        try {
          const connection = await cloudPrinterConnection(this.printerId)
          const response = await connection.fetch(`/server/files/gcodes/${encodeURI(file)}`)
          if (!response.ok) return null
          return parseToolpath(await response.text())
        } catch {
          return null
        }
      })()
      toolpaths.set(key, pending)
    }
    const path = await pending
    if (this.disposed || this.pathFile !== file || !path || !this.rig) return
    this.path = path
    const T = this.T
    if (this.lines) {
      this.lines.geometry.dispose()
      this.rig.partFrame.remove(this.lines)
    }
    const geometry = new T.BufferGeometry()
    // Klipper Y becomes scene Z; Klipper Z becomes the (flipped) height.
    const p = path.positions
    const swizzled = new Float32Array(p.length)
    for (let i = 0; i < p.length; i += 3) {
      swizzled[i] = p[i]
      swizzled[i + 1] = p[i + 2]
      swizzled[i + 2] = p[i + 1]
    }
    geometry.setAttribute('position', new T.BufferAttribute(swizzled, 3))
    this.lines = new T.LineSegments(geometry, new T.LineBasicMaterial({ color: 0x9fe870 }))
    this.rig.partFrame.add(this.lines)
    this.drawProgress()
  }

  drawProgress () {
    if (!this.lines || !this.path) return
    const s = this.status
    const done = s?.state === 'complete'
      ? this.path.count
      : segmentsPrinted(this.path, s?.filePosition ?? 0)
    this.lines.geometry.setDrawRange(0, done * 2)
  }
}
</script>

<style lang="scss" scoped>
.muon-model3d {
  position: relative;
  width: 100%;
  height: 100%;

  :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  &__note {
    position: absolute;
    left: 10px;
    bottom: 8px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.6;
  }
}
</style>
