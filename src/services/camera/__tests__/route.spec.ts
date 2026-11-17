import { describe, it, expect } from 'vitest'
import { cameraOutOfReach, cameraReachableThroughMuon3d } from '../route'

describe('cameraReachableThroughMuon3d', () => {
  it('an address on the printer has nowhere to load from through Muon3D', () => {
    expect(cameraReachableThroughMuon3d('/webcam/?action=stream', 'https:')).toBe(false)
    expect(cameraReachableThroughMuon3d('webcam/?action=snapshot', 'http:')).toBe(false)
    expect(cameraReachableThroughMuon3d('', 'https:')).toBe(false)
    expect(cameraReachableThroughMuon3d(undefined, 'https:')).toBe(false)
  })

  it('a full https address loads as it does anywhere', () => {
    expect(cameraReachableThroughMuon3d('https://cam.example.com/stream', 'https:')).toBe(true)
  })

  it('a full http address loads only on an http page', () => {
    expect(cameraReachableThroughMuon3d('http://192.168.1.20/webcam/?action=stream', 'https:')).toBe(false)
    expect(cameraReachableThroughMuon3d('http://camera.test/stream', 'http:')).toBe(true)
  })

  it('other schemes are not a picture', () => {
    expect(cameraReachableThroughMuon3d('rtsp://192.168.1.20/stream', 'http:')).toBe(false)
  })
})

describe('cameraOutOfReach', () => {
  const printerHosted = { service: 'mjpegstreamer', stream_url: '/webcam/?action=stream', snapshot_url: '/webcam/?action=snapshot' }

  it('on the printer\'s network every camera is drawn', () => {
    expect(cameraOutOfReach(printerHosted, false, 'https:')).toBe(false)
  })

  it('through Muon3D a camera on the printer is out of reach', () => {
    expect(cameraOutOfReach(printerHosted, true, 'https:')).toBe(true)
  })

  it('reads the address the service draws from: the adaptive service, its snapshots', () => {
    expect(cameraOutOfReach({ service: 'mjpegstreamer-adaptive', stream_url: 'https://cam.example.com/s', snapshot_url: '/webcam/?action=snapshot' }, true, 'https:')).toBe(true)
    expect(cameraOutOfReach({ service: 'mjpegstreamer-adaptive', stream_url: '/webcam/?action=stream', snapshot_url: 'https://cam.example.com/snap' }, true, 'https:')).toBe(false)
  })

  it('this device\'s own camera is always drawn', () => {
    expect(cameraOutOfReach({ service: 'device' }, true, 'https:')).toBe(false)
  })
})
