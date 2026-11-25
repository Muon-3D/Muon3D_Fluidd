import { describe, expect, it } from 'vitest'
import { cameraContext, resolveCameraUrl } from '../secure-url'

const HOSTED = 'https://control.muon3d.com/boxwood'
const SECURE = 'https://abcdefghijklmnopqrst.muonlan.net'
const ctx = { pageUrl: HOSTED, apiUrl: SECURE, printerHosts: ['192.168.1.20'] }

describe('resolveCameraUrl on the https page', () => {
  it('moves a camera at the printer\'s own address onto the secure origin', () => {
    const r = resolveCameraUrl('http://192.168.1.20/webcam/?action=stream', ctx)
    expect(r.blocked).toBe(false)
    expect(r.url.toString()).toBe(`${SECURE}/webcam/?action=stream`)
  })

  it('moves the printer\'s /webcam/ route on another private address too', () => {
    const r = resolveCameraUrl('http://192.168.1.99/webcam/?action=snapshot', ctx)
    expect(r.blocked).toBe(false)
    expect(r.url.toString()).toBe(`${SECURE}/webcam/?action=snapshot`)
  })

  it('resolves a relative address against the printer, not control.muon3d.com', () => {
    expect(resolveCameraUrl('/webcam/?action=stream', ctx).url.toString()).toBe(`${SECURE}/webcam/?action=stream`)
  })

  it('blocks another http camera instead of loading it', () => {
    expect(resolveCameraUrl('http://cam.example.com:8080/stream', ctx).blocked).toBe(true)
    expect(resolveCameraUrl('http://192.168.1.77:8080/stream', ctx).blocked).toBe(true)
  })

  it('leaves an https camera alone', () => {
    const r = resolveCameraUrl('https://cam.example.com/stream', ctx)
    expect(r.blocked).toBe(false)
    expect(r.url.toString()).toBe('https://cam.example.com/stream')
  })

  it('blocks an http camera when the printer has no secure origin to move it to', () => {
    expect(resolveCameraUrl('http://192.168.1.20/webcam/?action=stream', { pageUrl: HOSTED, apiUrl: 'http://192.168.1.20' }).blocked).toBe(true)
  })
})

describe('resolveCameraUrl on the printer\'s own http page', () => {
  it('is left as it was', () => {
    const r = resolveCameraUrl('http://192.168.1.20/webcam/?action=stream', { pageUrl: 'http://192.168.1.20/', apiUrl: 'http://192.168.1.20' })
    expect(r.blocked).toBe(false)
    expect(r.url.toString()).toBe('http://192.168.1.20/webcam/?action=stream')
  })
})

describe('cameraContext', () => {
  it('reads the printer\'s own addresses from its network interfaces', () => {
    const c = cameraContext({ config: { apiUrl: SECURE }, server: { system_info: { network: { wlan0: { ip_addresses: [{ address: '192.168.1.20' }] } } } } })
    expect(c.printerHosts).toEqual(['192.168.1.20'])
    expect(c.apiUrl).toBe(SECURE)
  })
})
