import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isPrinter, lookNearby, nearbyState, startNearby, stopNearby } from '../nearby'
import { advert, EID, fakeBluetooth, fakePrinter, OTHER_EID, removeBluetooth } from './fakes'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

beforeEach(() => {
  localStorage.clear()
  nearbyState.printers.splice(0)
  nearbyState.error = null
  nearbyState.radio = 'unknown'
})

afterEach(() => {
  stopNearby()
  removeBluetooth()
})

describe('Look nearby', () => {
  it('lists the chosen printer with its whole EndpointId, and remembers it', async () => {
    fakeBluetooth({ chosen: fakePrinter().device })
    const p = await lookNearby()
    expect(p).toMatchObject({ deviceId: 'dev-walnut', localName: 'walnut-8987', display: 'Walnut · 8987', endpointId: EID })
    expect(nearbyState.printers).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('muon.ble.printers')!)).toEqual({
      'dev-walnut': { endpointId: EID, localName: 'walnut-8987' }
    })
  })

  it('shows nothing when the person closes the chooser', async () => {
    fakeBluetooth()
    expect(await lookNearby()).toBeNull()
    expect(nearbyState.error).toBeNull()
    expect(nearbyState.choosing).toBe(false)
  })

  it('says so when the printer cannot be read', async () => {
    fakeBluetooth({ chosen: fakePrinter({ infoValue: new Uint8Array([7]) }).device })
    expect(await lookNearby()).toBeNull()
    expect(nearbyState.error).toMatch(/Couldn't read the printer over Bluetooth/)
  })

  it('choosing the same printer again lists it once', async () => {
    const printer = fakePrinter()
    fakeBluetooth({ chosen: printer.device })
    await lookNearby()
    await lookNearby()
    expect(nearbyState.printers).toHaveLength(1)
  })
})

describe('printers chosen before', () => {
  it('are heard again without the chooser, with the flags their advertisement carries', async () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    const printer = fakePrinter({ watch: true })
    const stranger = fakePrinter({ id: 'dev-other', watch: true })
    const { bt } = fakeBluetooth({ remembered: [printer.device, stranger.device], available: true })
    await startNearby()
    expect(nearbyState.radio).toBe('on')
    expect(printer.calls).toEqual(['watch'])
    // Only printers this page remembers an EndpointId for.
    expect(stranger.calls).toEqual([])
    expect(nearbyState.printers).toHaveLength(0)

    printer.advertise(advert(0x01))
    expect(nearbyState.printers[0]).toMatchObject({
      endpointId: EID,
      display: 'Walnut · 8987',
      advert: { unclaimed: true, busy: false }
    })
    expect(bt.requestDevice).not.toHaveBeenCalled()
  })

  it('forget a remembered EndpointId that the advertisement contradicts (a factory reset)', async () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    const printer = fakePrinter({ watch: true })
    fakeBluetooth({ remembered: [printer.device] })
    await startNearby()
    printer.advertise(advert(0x01, OTHER_EID))
    expect(nearbyState.printers[0].endpointId).toBeNull()
    expect(isPrinter(nearbyState.printers[0], OTHER_EID)).toBe(true)
    expect(isPrinter(nearbyState.printers[0], EID)).toBe(false)
  })

  it('are not heard once the search stops', async () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    const printer = fakePrinter({ watch: true })
    fakeBluetooth({ remembered: [printer.device] })
    await startNearby()
    stopNearby()
    await flush()
    printer.advertise(advert(0x01))
    expect(nearbyState.printers).toHaveLength(0)
  })
})

describe('the adapter', () => {
  it('follows availabilitychanged', async () => {
    const { bt } = fakeBluetooth({ available: true })
    await startNearby()
    bt.dispatchEvent(Object.assign(new Event('availabilitychanged'), { value: false }))
    expect(nearbyState.radio).toBe('off')
  })

  it('stays unknown where the browser cannot tell, and support says why Bluetooth is missing', async () => {
    await startNearby()
    expect(nearbyState.support).toBe('unsupported')
    fakeBluetooth()
    await startNearby()
    expect(nearbyState.support).toBe('supported')
    expect(nearbyState.radio).toBe('unknown')
  })
})
