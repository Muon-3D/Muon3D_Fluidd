import type { NearbyPrinter } from './nearby'
import type { BleSetupFailure } from './setup'

/**
 * What a Bluetooth-heard printer's tile offers first (KAN-4828).
 * - `set-up`: its advertisement says unclaimed, so it is new: Set it up.
 * - `pair`: its advertisement says set up: pair over Bluetooth.
 * - `connect`: no advertisement was heard (a Chrome chooser pick), so nothing
 *   says whether it is new. Connect over Bluetooth, then ask the printer.
 */
export type SetupOffer = 'set-up' | 'pair' | 'connect'

export function setupOfferFor (printer: Pick<NearbyPrinter, 'advert'>): SetupOffer {
  if (!printer.advert) return 'connect'
  return printer.advert.unclaimed ? 'set-up' : 'pair'
}

/**
 * Once the link is up and the printer has said whether setup is complete: a
 * printer that is set up and was picked with no advertisement goes straight to
 * pairing, with no "Set it up" and no dead end. One that is not set up goes on
 * to setup. A printer whose advertisement already said set up keeps its page.
 */
export function afterSetupRefusal (printer: Pick<NearbyPrinter, 'advert' | 'endpointId'>, failure: BleSetupFailure): 'pair' | 'show' {
  return failure === 'set-up' && !!printer.endpointId && setupOfferFor(printer) === 'connect' ? 'pair' : 'show'
}
