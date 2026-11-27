import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearNearby, dropBluetoothHold, holdBluetooth, isPrinter, lookNearby, nearbyState, permittedPrinterFor, rememberedName, startNearby, stopNearby } from '../nearby'
import { heardRecently } from '../heard'
import { chooserOptions } from '../webBluetooth'
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

describe('Look nearby for one printer (KAN-2470)', () => {
  it('passes the target to the chooser', async () => {
    const { requests } = fakeBluetooth({ chosen: fakePrinter().device })
    await lookNearby({ endpointId: EID })
    expect(requests).toEqual([chooserOptions({ endpointId: EID })])
  })

  it('a dismissed targeted chooser shows nothing and no error', async () => {
    const { requests } = fakeBluetooth()
    expect(await lookNearby({ endpointId: EID })).toBeNull()
    expect(requests).toHaveLength(1)
    expect(nearbyState.error).toBeNull()
  })

  it('uses getDevices when the browser has it, and the chooser when it is undefined', async () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    const { bt } = fakeBluetooth({ remembered: [fakePrinter().device] })
    expect((await permittedPrinterFor(EID))?.deviceId).toBe('dev-walnut')
    expect(bt.requestDevice).not.toHaveBeenCalled()
    removeBluetooth()
    // Chrome 157 on desktop: getDevices is undefined.
    const none = fakeBluetooth({ chosen: fakePrinter().device })
    expect(none.bt.getDevices).toBeUndefined()
    clearNearby()
    expect(await permittedPrinterFor(EID)).toBeNull()
    // Chosen on this page: reused even without getDevices (KAN-3591).
    await lookNearby()
    expect((await permittedPrinterFor(EID))?.deviceId).toBe('dev-walnut')
  })

  it('a remembered device that was never heard is not heard recently (KAN-2528)', async () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    fakeBluetooth({ remembered: [fakePrinter().device] })
    const p = await permittedPrinterFor(EID)
    expect(p?.heardAt).toBe(0)
    expect(heardRecently(p)).toBe(false)
  })

  it('a chooser pick is heard now', async () => {
    fakeBluetooth({ chosen: fakePrinter().device })
    expect(heardRecently(await lookNearby())).toBe(true)
  })
})

describe('the name remembered for the chooser (KAN-2516)', () => {
  it('is the name the printer advertised when it was chosen, matched by EndpointId in any case', () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    expect(rememberedName(EID)).toBe('walnut-8987')
    expect(rememberedName(EID.toUpperCase())).toBe('walnut-8987')
  })

  it('is undefined for a printer never chosen here, or with nothing stored', () => {
    expect(rememberedName(EID)).toBeUndefined()
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    expect(rememberedName(OTHER_EID)).toBeUndefined()
    localStorage.setItem('muon.ble.printers', 'not json')
    expect(rememberedName(EID)).toBeUndefined()
  })

  it('becomes the chooser name filter when the EndpointId cannot be matched', () => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-x': { endpointId: 'short-id', localName: 'walnut-8987' } }))
    expect(chooserOptions({ endpointId: 'short-id', name: rememberedName('short-id') }).filters).toEqual([
      expect.objectContaining({ name: 'walnut-8987' })
    ])
  })
})

describe('a printer this page is connected to over Bluetooth (KAN-5974)', () => {
  it('stays reachable after its last advertisement, until the link drops', () => {
    const device = fakePrinter().device
    const p = holdBluetooth(device, { endpointId: EID })
    // It stopped advertising when the link came up: the last sighting is long ago.
    p.heardAt = Date.now() - 10 * 60_000
    expect(heardRecently(p)).toBe(true)
    expect(isPrinter(p, EID)).toBe(true)

    dropBluetoothHold(device)
    expect(heardRecently(p)).toBe(false)
  })

  it('is held at once when Chrome lists it as allowed and its radio link is up', async () => {
    const printer = fakePrinter()
    await printer.device.gatt.connect()
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-walnut': { endpointId: EID, localName: 'walnut-8987' } }))
    fakeBluetooth({ remembered: [printer.device] })
    await startNearby()
    expect(nearbyState.printers.find(p => p.deviceId === 'dev-walnut')?.held).toBe(true)
  })
})
